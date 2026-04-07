# VM Provisioning - Backend

Backend services for the NAIC VM Provisioning platform. Orchestrates Terraform-based infrastructure provisioning across multiple cloud providers via a microservices architecture deployed on Kubernetes.

**Frontend:** [NAICNO/vm-provision-frontend](https://github.com/NAICNO/vm-provision-frontend)

## Architecture

```
User Request --> REST API --> RabbitMQ --> Request Consumer --> K8s Terraform Job
                                                                    |
                                          RabbitMQ <-- Terraform logs/outputs
                                              |
                                      Log Consumer --> REST API --> DB + Socket.IO
```

### Components

| Component | Description |
|-----------|-------------|
| `rest/` | Express.js REST API with Socket.IO, Prisma ORM, Redis sessions |
| `provision-request-queue-consumer-pod/` | RabbitMQ consumer that spawns Kubernetes Terraform jobs |
| `provision-log-queue-consumer-pod/` | Processes Terraform JSON logs and updates the REST API |
| `terraform-runner-job/` | Kubernetes Job container that runs Terraform and pipes output to RabbitMQ |

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

## Building & Deploying

Each service has its own Dockerfile. A template build script is provided at [`build-push.sh.example`](build-push.sh.example) — copy it into the service directory, update the configuration variables, and run it to build, push, and deploy to Kubernetes.

```bash
cp build-push.sh.example rest/build-push.sh
# Edit rest/build-push.sh with your registry, context, and deployment name
cd rest && ./build-push.sh
```

Before deploying, update the container image references and `TERRAFORM_RUNNER_IMAGE` env var in the Kubernetes manifests under `gcp/gke/` to point to your Docker registry. See [`gcp/gke/README.md`](gcp/gke/README.md) for manifest details and deployment order.

## Testing

```bash
cd rest
yarn test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
