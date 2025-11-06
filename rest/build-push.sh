#!/usr/bin/env bash
set -euo pipefail

# Build image; if this fails, the script exits immediately
docker build -t europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker/rest-backend .

# Push image
docker push europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker/rest-backend

# Switch context
kubectl config use-context naic-och-prod

# Deploy manifests
cd ../gcp/gke || exit 1
# Allow delete to fail (e.g., NotFound) without aborting the script
kubectl delete -f rest-backend-deployment.yaml || true
kubectl apply -f rest-backend-deployment.yaml
