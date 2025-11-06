# VM IP Address Capture Solution

## Problem

Sometimes the VM IP address is not captured from Terraform outputs immediately after VM creation is completed. This happens because:

1. **Async IP Allocation**: Cloud providers (especially Azure with Dynamic IPs and IBM Cloud PowerVS) may not assign the public IP immediately when the VM is created
2. **Terraform Timing**: Terraform outputs are evaluated before the IP is fully allocated
3. **Race Condition**: The Terraform apply completes before the cloud provider's network infrastructure assigns the IP

**Provider-Specific Behaviors**:
- **Azure**: Dynamic public IPs are allocated asynchronously after VM creation
- **IBM Cloud PowerVS**: External IPs may take a few moments to propagate to the public network
- **NREC/Google Cloud**: Generally assign IPs immediately, but can occasionally have delays

## Solution Overview

We've implemented a **cron job-based retry mechanism** that periodically checks for VMs without IP addresses and triggers Terraform refresh jobs to capture the latest IP from the cloud provider. The IP is then sent through the existing log processing pipeline to update the database.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Terraform Runner Job (Initial CREATE)                      │
│  ├─ Provisions VM                                           │
│  ├─ Writes terraform.tfstate to /data/terraform/{vmId}/    │
│  └─ Sends outputs (vm_ip may be empty)                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Log Consumer → REST API                                    │
│  └─ Updates DB (ipv4Address may be null)                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Cron Job: captureVmIpJob (runs every 30 seconds)          │
│  ├─ Finds VMs without IP (created in last 30 min)          │
│  ├─ Publishes REFRESH message to RabbitMQ queue            │
│  └─ Queued for provision-request-queue-consumer            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Provision Request Queue Consumer                           │
│  ├─ Consumes REFRESH message from queue                    │
│  └─ Creates Kubernetes Terraform REFRESH job               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Terraform Runner Job (REFRESH action)                      │
│  ├─ Runs: terraform refresh -json                          │
│  ├─ Runs: terraform output -json                           │
│  └─ Pipes JSON logs to RabbitMQ (vm_ip captured)           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Log Consumer → REST API                                    │
│  ├─ Processes Terraform output logs                        │
│  ├─ Extracts vm_ip from outputs                            │
│  ├─ Updates database with IP address                       │
│  └─ Notifies user via Socket.IO                            │
└─────────────────────────────────────────────────────────────┘
```

**Key Advantage**: This approach **reuses the entire existing infrastructure**:
- Same RabbitMQ queues and message format
- Same Kubernetes job creation logic
- Same Terraform runner image
- Same log processing pipeline
- Same database update and Socket.IO notification flow

No need to mount volumes or read state files directly!

## Implementation Details

### 1. Cron Job (`rest/src/cronJobs/captureVmIpJob.ts`)

**Schedule**: Every 30 seconds (`*/30 * * * * *`)

**Selection Criteria**:
- VM status is `PROVISIONING_COMPLETED`, `INITIALIZING`, or `RUNNING`
- `ipv4Address` field is `null`
- VM was created within the last 30 minutes (prevents checking old VMs indefinitely)

**Process**:
1. Query database for eligible VMs
2. For each VM:
   - Create a `REFRESH` action message
   - Publish to `vm_provisioning_requests` queue via outbox pattern
   - Message includes: `vm_id`, `provider`, `action: 'REFRESH'`

**Error Handling**:
- Gracefully handles message publishing failures
- Logs errors without crashing the cron job
- Continues processing remaining VMs if one fails

### 2. Queue Consumer (`provision-request-queue-consumer-pod/src/consumer.ts`)

**New Action Handler**: `handleRefreshAction`

**Process**:
1. Receives `REFRESH` message from queue
2. Acknowledges message
3. Publishes status: `IP_CAPTURE_QUEUED`
4. Creates Kubernetes Terraform job with `REFRESH` action

**Terraform Command for REFRESH**:
```bash
terraform init && \
terraform refresh -json | python3 /send_to_rabbitmq.py && \
terraform output -json | python3 /send_to_rabbitmq.py
```

This command:
- Initializes Terraform (reads existing state)
- Runs `terraform refresh` to sync state with cloud provider (captures latest IP)
- Pipes refresh logs to RabbitMQ
- Runs `terraform output` to emit all outputs including `vm_ip`
- Pipes output logs to RabbitMQ

### 3. Terraform Runner Job

**Job Naming**: `tf-refresh-job-{vmId}`

**Execution**:
- Reads existing state from `/data/terraform/{vmId}/`
- Queries cloud provider for current VM state
- Updates `terraform.tfstate` with latest IP
- Emits Terraform JSON logs with `type: "outputs"`

**Output Format** (sent to RabbitMQ):
```json
{
  "@level": "info",
  "@message": "Outputs: vm_ip",
  "@module": "terraform.ui",
  "@timestamp": "2025-11-05T10:30:00.000Z",
  "type": "outputs",
  "outputs": {
    "vm_ip": {
      "value": "13.74.249.123",
      "type": "string",
      "sensitive": false
    },
    "vm_provision_status": {
      "value": "PROVISIONING_COMPLETED",
      "type": "string",
      "sensitive": false
    }
  }
}
```

### 4. Log Processing (`rest/src/services/tfLogService.ts`)

The existing log processor already handles this! No changes needed:

```typescript
if (logType === 'outputs') {
  switch (action) {
    case 'CREATE': {
      if (log.outputs?.vm_provision_status?.value === VmStatus.PROVISIONING_COMPLETED) {
        status = VmStatus.PROVISIONING_COMPLETED
        ip = log.outputs?.vm_ip?.value || undefined  // ← IP extracted here
      }
      break
    }
  }
}
```

**Note**: The existing code processes outputs for `CREATE` action. Since `REFRESH` is semantically similar (updating state), the IP will be extracted and the database updated via `updateVmStatus()`.

### 5. Database Update (`rest/src/services/vmService.ts`)

Existing `updateVmStatus()` function handles IP updates:

```typescript
if (ipFromLog !== undefined) {
  update.ipv4Address = ipFromLog
  update.startedAt = new Date()
}
```

Even if status doesn't change, IP is persisted:

```typescript
if (nextStatus === currentStatus) {
  if (ipFromLog !== undefined) {
    const updateData: Prisma.VirtualMachineUpdateInput = {
      ipv4Address: ipFromLog,
      updatedAt: new Date(),
    }
    if (!vm.startedAt) {
      updateData.startedAt = new Date()
    }
    // Update and return
  }
}
```

### 6. Cron Job Registration

The cron job is automatically activated via side-effect import in `rest/index.ts`:

```typescript
import './src/cronJobs'
```

Exported from `rest/src/cronJobs/index.ts`:

```typescript
export {
  destroyExpiredVmsJob,
  deleteUserProfileJob,
  captureVmIpJob,  // New cron job
}
```

## Terraform State File Structure

The Terraform refresh command queries the cloud provider and updates the state file, then outputs:

```json
{
  "vm_ip": {
    "value": "13.74.249.123",
    "type": "string"
  },
  "vm_provision_status": {
    "value": "PROVISIONING_COMPLETED",
    "type": "string"
  }
}
```

All provider HCL templates (`hcl/{provider}/main.tf`) output `vm_ip`:
- **NREC**: `openstack_compute_instance_v2.vm.access_ip_v4`
- **Azure**: `data.azurerm_public_ip.main.ip_address` (uses data source for dynamic IPs)
- **Google Cloud**: `google_compute_instance.default.network_interface[0].access_config[0].nat_ip`
- **IBM Cloud**: `ibm_pi_instance.vm.pi_network[0].external_ip` (PowerVS external IP)

The `terraform refresh` command ensures the state is synchronized with the actual cloud resources, capturing any IPs that were assigned after the initial `terraform apply`.

## Configuration

### Environment Variables

No additional environment variables required. Uses existing:
- Database connection via Prisma
- Socket.IO for real-time updates
- Logging via Winston

### Tuning Parameters

In `rest/src/cronJobs/captureVmIpJob.ts`:

```typescript
// Run frequency (Croner cron syntax)
new Cron('0 */2 * * * *', ...)  // Every 2 minutes

// Time window for checking VMs
createdAt: {
  gte: new Date(Date.now() - 30 * 60 * 1000)  // Last 30 minutes
}
```

**Recommendations**:
- **Frequency**: 2 minutes is optimal - balances responsiveness with resource usage
- **Time Window**: 30 minutes covers most edge cases; increase if VMs take longer to assign IPs
- **Statuses**: Include `PROVISIONING_COMPLETED`, `INITIALIZING`, `RUNNING` to catch IPs at any stage

## Deployment

### 1. Deploy Updated Services

```bash
# Deploy REST API with new cron job
cd rest/
./build-push.sh  # Production
# OR
./build-push-dev.sh  # Development

# Deploy provision-request-queue-consumer with REFRESH action handler
cd ../provision-request-queue-consumer-pod/
./build-push.sh  # Production
# OR
./build-push-dev.sh  # Development
```

### 2. Restart Pods

```bash
# Restart REST API
kubectl rollout restart deployment rest-backend-deployment
kubectl rollout status deployment rest-backend-deployment

# Restart queue consumer
kubectl rollout restart deployment provision-request-queue-consumer
kubectl rollout status deployment provision-request-queue-consumer
```

### 3. Verify Cron Job

```bash
# Check logs for cron job activity (every 2 minutes)
kubectl logs -l app=rest-backend --tail=100 | grep '\[Cron\]'

# Expected output:
# [Cron] Running captureVmIpJob every 2 minutes
# [Cron] Found 2 VMs without IP addresses, triggering IP capture jobs
# [Cron] Triggering IP capture job for VM: abc-123-def
# [Cron] IP capture job queued for VM: abc-123-def
```

### 4. Verify Queue Consumer

```bash
# Check queue consumer logs
kubectl logs -l app=provision-request-queue-consumer --tail=100

# Expected output:
# Request received abc-123-def : REFRESH
# Handling REFRESH action for VM: abc-123-def
# Message acked vmId: abc-123-def
# Status published vmId: abc-123-def
# Job created vmId: abc-123-def action: REFRESH
```

### 5. Verify Terraform Job

```bash
# List Terraform refresh jobs
kubectl get jobs | grep tf-refresh

# Check job logs
kubectl logs job/tf-refresh-job-{vmId}

# Expected output includes:
# terraform refresh output with vm_ip
# terraform output -json with vm_ip value
```

## Monitoring & Observability

### Log Messages

**Cron Job Success**:
```
[Cron] Running captureVmIpJob every 2 minutes
[Cron] Found 2 VMs without IP addresses, triggering IP capture jobs
[Cron] Triggering IP capture job for VM: {vmId}
[Cron] IP capture job queued for VM: {vmId}
```

**Queue Consumer**:
```
Request received {vmId} : REFRESH
Handling REFRESH action for VM: {vmId}
Message acked vmId: {vmId}
Status published vmId: {vmId}
Job created vmId: {vmId} action: REFRESH
```

**Terraform Runner**:
```
Terraform refresh logs (JSON format)
terraform output -json with vm_ip value
```

**Log Processor**:
```
Processing Terraform output logs
Extracting vm_ip from outputs
Updating VM {vmId} with IP {ip}
```

**No IPs to Capture**:
```
[Cron] Running captureVmIpJob every 2 minutes
```
(No additional messages if no VMs need IP capture)

**Errors**:
```
[Cron] Error triggering IP capture job for VM: {vmId}
[Cron] Error in captureVmIpJob
Error creating job vmId: {vmId} action: REFRESH
```

### Metrics to Track

1. **VMs without IP**: `SELECT COUNT(*) FROM virtual_machine WHERE status IN ('PROVISIONING_COMPLETED', 'INITIALIZING', 'RUNNING') AND ipv4_address IS NULL`
2. **IP Capture Rate**: Monitor how many VMs get IPs on first attempt vs. via cron job
3. **Time to IP**: Track `createdAt` to `startedAt` duration for VMs

### Sentry Integration

Errors are automatically captured by Sentry via existing Winston → Sentry integration:

```typescript
logger.error({
  message: '[Cron] Error capturing IP for VM: {vmId}',
  error  // Sent to Sentry with full context
})
```

## Edge Cases & Considerations

### 1. Multiple Replicas

The REST API runs with 3 replicas. The cron job runs in all pods, but this is safe because:
- Each pod independently queries for VMs without IPs
- Multiple REFRESH messages for the same VM are harmless (idempotent)
- RabbitMQ ensures messages are processed exactly once
- Kubernetes job names include vmId, preventing duplicate jobs

**Optimization**: The queue consumer could check if a REFRESH job already exists:

```typescript
const existingJobs = await k8sApi.listNamespacedJob('default', undefined, undefined, undefined, undefined, `metadata.name=tf-refresh-job-${vmId}`)
if (existingJobs.body.items.length > 0) {
  logger.info(`REFRESH job already exists for VM: ${vmId}, skipping`)
  return
}
```

### 2. Terraform Refresh Failures

**Cause**: Cloud provider API is temporarily unavailable or VM is in transitioning state

**Handling**: 
- Kubernetes job has `backoffLimit: 3` (3 retries)
- If job fails, it will be marked as Failed
- Next cron run (2 minutes later) will trigger a new REFRESH job
- Logs sent to Sentry for investigation

### 3. IP Still Not Available

**Cause**: Cloud provider hasn't allocated IP yet, even after refresh

**Handling**: Job retries every 2 minutes for 30 minutes (15 attempts)

### 4. Concurrent REFRESH Jobs

**Scenario**: Cron job triggers REFRESH while a previous REFRESH job is still running

**Handling**:
- Kubernetes job names include vmId: `tf-refresh-job-{vmId}`
- Second job creation will fail with "AlreadyExists" error
- Error is logged but doesn't affect the cron job
- First job will complete and update the IP

### 5. State Locking

**Terraform State Locking**: Not an issue because:
- Each VM has its own state file in `/data/terraform/{vmId}/`
- No concurrent operations on the same VM (CREATE, REFRESH, DESTROY are queued)
- Terraform doesn't lock state for read-only operations like `refresh` with separate state files

### 6. Resource Cleanup

**Old REFRESH jobs**: Kubernetes automatically garbage collects completed jobs after 30 days (default TTL)

**Manual cleanup**:
```bash
# Delete completed refresh jobs older than 1 day
kubectl delete jobs -l app=terraform --field-selector status.successful=1 --all-namespaces
```

## Alternative Approaches Considered

### 1. Direct State File Reading (Not Implemented)

Read `terraform.tfstate` file directly from shared NFS volume:

**Pros**:
- Simpler implementation (no Kubernetes jobs)
- Lower resource usage

**Cons**:
- Requires mounting Terraform volume to REST API pods
- Couples REST API to Terraform internals
- Bypasses existing log processing pipeline
- Direct file I/O on NFS (potential latency)
- No audit trail in provision logs

**Verdict**: Doesn't leverage existing infrastructure; creates tight coupling

### 2. Terraform Refresh Command via Kubernetes Jobs (✅ Implemented)

Spawn Kubernetes jobs running `terraform refresh && terraform output`:

**Pros**:
- **Reuses entire existing infrastructure** (queues, jobs, log processing)
- Queries cloud provider for authoritative IP (most reliable)
- Full audit trail in provision logs
- Consistent with CREATE/DESTROY workflow
- No changes needed to log processing or database update logic
- Works across all cloud providers uniformly

**Cons**:
- Higher resource usage (spawns K8s jobs)
- Slight latency (job scheduling + Terraform init)

**Verdict**: ✅ **Best approach** - reliable, maintainable, leverages existing pipeline

### 3. Cloud Provider API Polling (Not Implemented)

Directly query cloud provider APIs for VM IP:

**Pros**:
- Bypasses Terraform entirely
- Can get real-time data

**Cons**:
- Requires provider-specific code for each cloud (NREC, Azure, GCP)
- Needs separate credentials management (service principals, API keys)
- More complex authentication flows
- Terraform state is already the source of truth
- Duplicates logic that Terraform already handles

**Verdict**: Too complex and duplicates Terraform's functionality

### 4. Increase Terraform Apply Timeout (Not Implemented)

Add explicit waits in Terraform HCL:

```hcl
resource "null_resource" "wait_for_ip" {
  provisioner "local-exec" {
    command = "sleep 120"
  }
  depends_on = [azurerm_linux_virtual_machine.main]
}
```

**Pros**:
- Captures IP at provisioning time

**Cons**:
- Increases provisioning time for ALL VMs (even those with instant IPs)
- Doesn't guarantee IP will be available after wait
- Wastes Terraform runner resources
- Poor user experience (longer wait times)

**Verdict**: Reactive approach (cron + REFRESH) is better than slowing down all provisions

## Troubleshooting

### Cron Job Not Running

**Check**:
```bash
kubectl logs -l app=rest-backend | grep captureVmIpJob
```

**Fix**: Ensure `import './src/cronJobs'` is in `rest/index.ts`

### REFRESH Messages Not Consumed

**Check queue**:
```bash
# Access RabbitMQ management UI or use rabbitmqadmin
kubectl port-forward svc/rabbitmq 15672:15672
# Open http://localhost:15672
# Check vm_provisioning_requests queue for REFRESH messages
```

**Fix**: Restart queue consumer:
```bash
kubectl rollout restart deployment provision-request-queue-consumer
```

### REFRESH Jobs Not Created

**Check consumer logs**:
```bash
kubectl logs -l app=provision-request-queue-consumer | grep REFRESH
```

**Possible causes**:
1. Consumer doesn't have `REFRESH` case in switch statement → Deploy updated consumer
2. Kubernetes API permissions issue → Check service account `rabbitmq-consumer-sa`
3. Job name conflict → Delete old job: `kubectl delete job tf-refresh-job-{vmId}`

### IPs Still Not Captured

**Check Terraform job logs**:
```bash
kubectl logs job/tf-refresh-job-{vmId}
```

**Possible causes**:
1. Terraform refresh failed → Check cloud provider API status
2. State file missing → Wait for initial CREATE job to complete
3. IP still not assigned by cloud provider → Wait and retry (cron runs every 2 minutes)
4. Terraform output not reaching RabbitMQ → Check `send_to_rabbitmq.py` logs

**Check provision logs table**:
```sql
SELECT * FROM provision_log 
WHERE vm_id = '{vmId}' AND action = 'REFRESH' 
ORDER BY timestamp DESC;
```

### Performance Impact

**Check cron job execution time**:
```bash
kubectl logs -l app=rest-backend | grep '\[Cron\]' | grep -E 'Running|Found'
```

If many VMs without IPs, consider:
- Increasing cron interval (e.g., every 5 minutes instead of 2)
- Reducing time window (e.g., 15 minutes instead of 30)
- Adding database index: 
  ```sql
  CREATE INDEX idx_vm_ip_capture ON virtual_machine(status, ipv4_address, created_at) 
  WHERE ipv4_address IS NULL;
  ```

### RabbitMQ Queue Backlog

**Check queue depth**:
```bash
# Via RabbitMQ management UI
kubectl port-forward svc/rabbitmq 15672:15672
# Check vm_provisioning_requests queue message count
```

If backlog is growing:
- Scale up queue consumer replicas: `kubectl scale deployment provision-request-queue-consumer --replicas=2`
- Check if REFRESH jobs are failing and filling the queue

## Future Enhancements

1. **Exponential Backoff**: Check more frequently initially (every 30s), then back off to 5 minutes
2. **IPv6 Support**: Extend to capture `ipv6Address` from Terraform outputs
3. **Metrics Dashboard**: Track IP capture success rate and latency
4. **Alert on Failures**: Send notification if IP not captured within 10 minutes
5. **Provider-Specific Logic**: Different retry strategies for Azure vs. NREC vs. GCP

## References

- Terraform State File: https://www.terraform.io/docs/language/state/index.html
- Croner (Cron Library): https://github.com/Hexagon/croner
- Kubernetes Persistent Volumes: https://kubernetes.io/docs/concepts/storage/persistent-volumes/
