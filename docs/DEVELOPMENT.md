# Local Development

## Prerequisites

- Node.js 20+
- Yarn
- Docker
- PostgreSQL
- RabbitMQ
- Redis

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone https://github.com/NAICNO/vm-provision-backend.git
   cd vm-provision-backend
   ```

2. **Set up environment variables:**

   ```bash
   cp rest/.env.example rest/.env.development
   ```

   Edit `rest/.env.development` with your configuration values.

3. **Start Redis locally with Docker:**

   ```bash
   docker run -d --name vm-provision-redis -p 6379:6379 redis:7-alpine redis-server --requirepass devpassword
   ```

4. **Install dependencies and run:**

   ```bash
   cd rest
   yarn install
   npx prisma generate
   yarn dev
   ```

The API will be available at `http://localhost:3000`.

## Environment Variables

See `rest/.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `PORT` | API server port (default: `3000`) |
| `DATABASE_URL_GCP` | PostgreSQL connection string |
| `RABBITMQ_URL_GCP` | RabbitMQ connection string |
| `REDIS_URL_GCP` | Redis connection URL |
| `REDIS_PASSWORD` | Redis password |
| `SESSION_SECRET` | Express session secret |
| `AUTH_API_KEY_SECRET` | API key for inter-service authentication |
| `SIGMA_DISCOVERY_URL` | OIDC provider discovery URL |
| `SIGMA_CLIENT_ID` | OIDC client ID |
| `SIGMA_CLIENT_SECRET` | OIDC client secret |
| `VM_QUOTA_PER_USER` | Max active VMs per user |
| `CLOUD_INIT_CALLBACK_BASE_URL` | Base URL for cloud-init callbacks |

**Queue consumers and Terraform runner:**

| Variable | Used By | Description |
|----------|---------|-------------|
| `RABBITMQ_USER` | All consumers + runner | RabbitMQ username |
| `RABBITMQ_PASSWORD` | All consumers + runner | RabbitMQ password |
| `AUTH_API_KEY_SECRET` | Log consumer | API key for REST API authentication |
| `TERRAFORM_RUNNER_IMAGE` | Request consumer | Docker image for Terraform jobs |
| `VM_ID` | Terraform runner | ID of the VM being provisioned |
| `ACTION` | Terraform runner | Operation: `CREATE`, `DESTROY`, or `REFRESH` |

## Database

Schema is managed via Prisma migrations in `rest/prisma/migrations/`.

```bash
cd rest

# Apply migrations
npx prisma migrate dev

# Regenerate client after schema changes
npx prisma generate
```

Seed data for providers and VM templates is in `data/vm_templates.sql`:

```bash
psql -U <user> -d vm_management_db -f data/vm_templates.sql
```

## Testing

```bash
cd rest
yarn test
```
