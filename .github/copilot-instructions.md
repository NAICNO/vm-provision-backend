# VM Provisioning Backend - AI Coding Agent Instructions

## Architecture Overview

This is a **microservices-based VM provisioning system** deployed on GKE that orchestrates Terraform-based infrastructure provisioning across multiple cloud providers (NREC, Azure, Google Cloud).

### Core Components

1. **`rest/`** - Express.js REST API with Socket.IO
   - Main entry: `rest/index.ts`
   - Prisma ORM with PostgreSQL (`rest/prisma/schema.prisma`)
   - Session management via Redis
   - RabbitMQ producer for provisioning requests
   - Real-time updates via Socket.IO namespaces (`/vm`)
   - Sentry integration for error tracking

2. **`provision-request-queue-consumer-pod/`** - RabbitMQ consumer that spawns Kubernetes jobs
   - Consumes from `vm_provisioning_requests` queue
   - Generates Terraform tfvars files in `/data/terraform/{vmId}/`
   - Creates K8s batch jobs running `terraform-runner` image
   - Provider-specific configurations in `src/providers.ts`

3. **`provision-log-queue-consumer-pod/`** - Log processor
   - Consumes from `vm_provisioning_progress` queue
   - Posts Terraform JSON logs to REST API via `http://rest-service/api/message/process`

4. **`terraform-runner-job/`** - K8s Job container
   - Python script `send_to_rabbitmq.py` pipes Terraform JSON output to RabbitMQ
   - Mounts provider-specific HCL from `hcl/{provider}/` directories

## Message Flow

```
User Request → REST API → vm_provisioning_requests (RabbitMQ)
                          ↓
                  Request Consumer creates K8s Job
                          ↓
                  Terraform Runner → vm_provisioning_progress (RabbitMQ)
                          ↓
                  Log Consumer → REST API /api/message/process
                          ↓
                  Database update → Socket.IO push to user
```

## Database Patterns

- **Prisma migrations**: `npx prisma migrate dev --name <update_message>` (from `rest/` directory)
- All IDs use `gen_random_uuid()` PostgreSQL function
- Connection strings from `DATABASE_URL_GCP` env var
- Key tables: `VirtualMachine`, `UserProfile`, `VmTemplate`, `Provider`, `Message` (outbox pattern)

## Authentication & Sessions

- **OIDC Flow**: Authorization Code Flow with external OIDC provider
- **Session Storage**: Redis-backed sessions via `express-session` + `connect-redis`
- **Session Config**: 24-hour TTL, httpOnly cookies, prefix `naic:`
- **Client Init**: `initializeAuthClient()` from `openid-client` library
- **Inter-service Auth**: API key validation via `x-api-key` header (`authenticateApiKey` middleware)

## Service Communication

- **Message Queue**: Persistent RabbitMQ with auto-reconnect (`rest/src/utils/queueUtils.ts`)
- **Outbox Pattern**: Messages stored in DB first, published async via `messageQueueService.ts`
- **Socket.IO**: User-specific updates via `userSocketMap` in `rest/src/sockets/index.ts`
- **Internal Auth**: API key validation via `x-api-key` header for inter-service calls

## Development Workflows

### Running Locally
```bash
# REST API (from rest/)
yarn dev  # Watches TS files and auto-restarts

# Database migrations
npx prisma migrate dev --name <description>
npx prisma generate  # Regenerate client after schema changes
```

### Building & Deploying
Each component has `build-push.sh` (prod) and `build-push-dev.sh` (dev) scripts:
```bash
./rest/build-push.sh      # Production: vm-provisioning-docker
./rest/build-push-dev.sh  # Dev environment: vm-provisioning-docker-dev
```
Images target: `europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker{-dev}/`

**Environments**:
- **Production**: Full-scale GKE cluster
- **Dev**: Separate GKE environment with reduced resources for testing

### Testing
- Jest configured in `rest/` with `yarn test`
- Tests in `rest/__tests__/` mirror `src/` structure
- Use Prisma's `ITXClientDenyList` type for transactional contexts
- **Note**: Test coverage is being expanded - follow existing patterns in `__tests__/`

## Project-Specific Conventions

### Logging
- Winston logger in all services (`src/utils/logger.ts` or `logger.ts`)
- Structured logging with context objects: `logger.info({message: '...', vmId, error})`
- Request IDs via `req.id` (UUID) added in middleware
- Skip health checks in logs via `expressWinston` `ignoreRoute`

### Error Handling & Observability
- **Sentry**: Exception tracking with context objects: `Sentry.captureException(error, {contexts: {...}})`
- **GCP Logging**: Winston JSON format in production (structured logs to Cloud Logging)
- Global error handler: `rest/src/api/middlewares/errorHandler.ts`
- Custom error messages: `rest/src/utils/errorMessages.ts`

### Environment Management
- Environment-specific dotenv files: `.env.${NODE_ENV}` (loaded in `rest/index.ts`)
- Secrets from K8s mounted as env vars (see `provision-request-queue-consumer-pod/src/providers.ts`)

### Cron Jobs
- Croner library for scheduling (not node-cron)
- All jobs exported from `rest/src/cronJobs/index.ts`
- Import side-effect in `rest/index.ts` to activate: `import './src/cronJobs'`

### State Machine
- VM status transitions validated via `validNextStates` map (`rest/src/utils/vmStatusUtils.ts`)
- Use `findNextVmState()` to prevent invalid transitions

### Provider-Specific Logic
- HCL templates in `provision-request-queue-consumer-pod/hcl/{provider}/`
- Volume mounts, env vars, and secrets configured per provider in `providers.ts`
- Cloud-init shared across providers: `hcl/cloud-init/`

## GKE Deployment Files

- Kubernetes manifests in `gcp/gke/`
- Persistent volumes for shared Terraform state: `terraform-wd-filestore-pvc.yaml`
- **Terraform State Storage**: NFS-backed persistent volume in GCP (shared across jobs)
- RabbitMQ, PostgreSQL, Redis deployed as StatefulSets with PVCs

## Critical Gotchas

1. **Prisma Client in Transactions**: Use `Omit<PrismaClient, ITXClientDenyList>` when passing to functions used in `.$transaction()`
2. **RabbitMQ Reconnection**: Channel state tracked via `isChannelOpen` flag; reconnect logic in `queueUtils.ts`
3. **Socket.IO Namespaces**: Use `/vm` namespace, not root. Auth via `socket.handshake.auth.userId`
4. **K8s Job Naming**: Must include `vmId` for cleanup: `tf-{create|destroy}-job-{vmId}`
5. **Health Checks**: `/health` and `/ready` endpoints restricted to internal IPs only (10.x.x.x)
