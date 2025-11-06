# IP Capture Implementation Summary

## Overview

Implemented a **cron job-based IP capture mechanism** that triggers Terraform refresh jobs for VMs without IP addresses. This leverages the entire existing infrastructure (RabbitMQ, Kubernetes jobs, log processing) to automatically capture IPs that weren't immediately available during VM provisioning.

## What Was Changed

### 1. New Cron Job: `rest/src/cronJobs/captureVmIpJob.ts`

**Purpose**: Periodically checks for VMs without IPs and triggers Terraform refresh jobs

**Key Features**:
- Runs every 30 seconds
- Queries VMs with status `PROVISIONING_COMPLETED`, `INITIALIZING`, or `RUNNING` AND `ipv4Address IS NULL`
- Only checks VMs created in the last 30 minutes
- Publishes `REFRESH` action messages to RabbitMQ queue
- Uses existing outbox pattern for reliable message delivery

**Functions**:
- `triggerTerraformRefreshJob()` - Creates REFRESH message and adds to queue
- `getFolderNameForProvider()` - Maps provider names to HCL folder names

### 2. Updated Queue Consumer: `provision-request-queue-consumer-pod/src/consumer.ts`

**New Action Handler**: `handleRefreshAction()`

**Changes to `createTerraformJob()`**:
- Added support for `REFRESH` action
- Job name: `tf-refresh-job-{vmId}`
- Command: `terraform init && terraform refresh -json | python3 /send_to_rabbitmq.py && terraform output -json | python3 /send_to_rabbitmq.py`

**New Function**: `createTerraformVmRefreshJob()`

### 3. Updated Cron Job Index: `rest/src/cronJobs/index.ts`

- Exported `captureVmIpJob` for automatic activation

### 4. Documentation: `docs/IP_CAPTURE_SOLUTION.md`

Comprehensive documentation covering:
- Problem description and solution architecture
- Implementation details for each component
- Deployment instructions
- Monitoring and observability
- Troubleshooting guide
- Testing procedures
- Edge cases and considerations

## How It Works

```
User Creates VM → Terraform Apply → IP May Be NULL
                                          ↓
                    Cron Job (every 30 sec) detects missing IP
                                          ↓
                    Publishes REFRESH message to RabbitMQ
                                          ↓
                    Queue Consumer creates K8s Terraform job
                                          ↓
                    Terraform refresh queries cloud provider
                                          ↓
                    Terraform output emits IP to log stream
                                          ↓
                    Log Consumer updates database via existing pipeline
                                          ↓
                    User receives Socket.IO notification with IP
```

## Why This Approach?

✅ **Reuses entire existing infrastructure**:
- Same RabbitMQ queues (`vm_provisioning_requests`, `vm_provisioning_progress`)
- Same Kubernetes job pattern
- Same Terraform runner image
- Same log processing pipeline (`tfLogService`, `vmService`)
- Same database update and Socket.IO notification flow

✅ **Reliable**:
- `terraform refresh` queries cloud provider for authoritative state
- Existing retry mechanisms in place (Kubernetes backoffLimit, cron retries)
- Full audit trail in provision logs

✅ **Maintainable**:
- Consistent with CREATE/DESTROY workflow
- No new infrastructure components
- Works uniformly across all providers

✅ **Simple**:
- ~100 lines of new code
- Minimal changes to existing code
- No volume mounts or file I/O complexity

## Deployment Checklist

- [ ] Build and push REST API image (`rest/build-push.sh` or `rest/build-push-dev.sh`)
- [ ] Build and push queue consumer image (`provision-request-queue-consumer-pod/build-push.sh` or `build-push-dev.sh`)
- [ ] Restart REST API deployment (`kubectl rollout restart deployment rest-backend-deployment`)
- [ ] Restart queue consumer deployment (`kubectl rollout restart deployment provision-request-queue-consumer`)
- [ ] Verify cron job is running (`kubectl logs -l app=rest-backend | grep '\[Cron\]'`)
- [ ] Test with a VM (especially Azure with dynamic IP)
- [ ] Monitor logs for REFRESH jobs and IP captures

## Testing the Implementation

1. Create a VM (Azure recommended for dynamic IP testing)
2. Check database - `ipv4Address` may be NULL after initial provisioning
3. Wait 2 minutes for cron job to run
4. Verify REFRESH job is created: `kubectl get jobs | grep tf-refresh`
5. Check job logs: `kubectl logs job/tf-refresh-job-{vmId}`
6. Verify IP captured in database
7. Verify user received Socket.IO update

## Monitoring

**Key Metrics**:
- VMs without IP: `SELECT COUNT(*) FROM virtual_machine WHERE status IN ('PROVISIONING_COMPLETED', 'INITIALIZING', 'RUNNING') AND ipv4_address IS NULL`
- REFRESH jobs: `kubectl get jobs | grep tf-refresh | wc -l`
- IP capture success rate: Compare initial NULL IPs vs. captured IPs

**Log Queries**:
```bash
# Cron job activity
kubectl logs -l app=rest-backend | grep '\[Cron\]'

# Queue consumer REFRESH handling
kubectl logs -l app=provision-request-queue-consumer | grep REFRESH

# Terraform refresh job logs
kubectl logs job/tf-refresh-job-{vmId}
```

## Files Changed

### New Files:
- `rest/src/cronJobs/captureVmIpJob.ts`
- `docs/IP_CAPTURE_SOLUTION.md`
- `docs/IP_CAPTURE_IMPLEMENTATION_SUMMARY.md` (this file)

### Modified Files:
- `rest/src/cronJobs/index.ts`
- `provision-request-queue-consumer-pod/src/consumer.ts`

### No Changes Required:
- `rest/src/services/tfLogService.ts` - Already handles IP extraction from outputs
- `rest/src/services/vmService.ts` - Already updates IP when status is same but IP is provided
- Terraform HCL files - Already output `vm_ip`
- Database schema - Already has `ipv4Address` field

## Next Steps

1. **Deploy to development environment first**
2. **Test with all cloud providers** (NREC, Azure, Google Cloud, IBM Cloud)
3. **Monitor for 24 hours** to verify:
   - Cron job runs reliably every 2 minutes
   - REFRESH jobs complete successfully
   - IPs are captured and database is updated
   - No performance issues with multiple replicas
4. **Deploy to production** after successful dev testing
5. **Consider enhancements**:
   - Exponential backoff (check more frequently initially, then back off)
   - Alert if IP not captured within 10 minutes
   - Metrics dashboard for IP capture statistics

## Rollback Plan

If issues arise:

1. **Disable cron job**: 
   - Comment out `import './src/cronJobs'` in `rest/index.ts`
   - Redeploy REST API

2. **Revert to previous images**:
   ```bash
   kubectl set image deployment/rest-backend-deployment rest-backend=<previous-image>
   kubectl set image deployment/provision-request-queue-consumer provision-request-queue-consumer=<previous-image>
   ```

3. **Clear RabbitMQ queue** if backlog builds up:
   ```bash
   # Via RabbitMQ management UI
   kubectl port-forward svc/rabbitmq 15672:15672
   # Purge vm_provisioning_requests queue
   ```
