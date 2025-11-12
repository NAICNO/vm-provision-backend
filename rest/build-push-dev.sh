#!/usr/bin/env bash
set -euo pipefail

# Configuration
REGISTRY="europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker-dev"
IMAGE_NAME="rest-backend"
KUBE_CONTEXT="naic-och-dev"

# Generate version tag (git commit SHA + timestamp)
GIT_SHA=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
VERSION_TAG="${GIT_SHA}-${TIMESTAMP}"

# Image tags
IMAGE_VERSIONED="${REGISTRY}/${IMAGE_NAME}:${VERSION_TAG}"
IMAGE_LATEST="${REGISTRY}/${IMAGE_NAME}:latest"

echo "🔨 Building version: ${VERSION_TAG} (DEV)"

# Build with both tags
docker build \
  -t "${IMAGE_VERSIONED}" \
  -t "${IMAGE_LATEST}" \
  .

# Push both tags
echo "📤 Pushing images..."
docker push "${IMAGE_VERSIONED}"
docker push "${IMAGE_LATEST}"

# Switch kubectl context
kubectl config use-context "${KUBE_CONTEXT}"

# Update deployment YAML to use rolling update strategy if not already set
cd ../gcp/gke || exit 1

# Apply the deployment configuration (creates or updates)
echo "🚀 Deploying version ${VERSION_TAG} to DEV..."
kubectl apply -f rest-backend-deployment.yaml

# Update the image to the specific version (triggers rolling update)
kubectl set image deployment/rest-backend-deployment \
  rest-backend="${IMAGE_VERSIONED}"

# Wait for rollout to complete
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/rest-backend-deployment --timeout=5m

# Check if rollout was successful
if [ $? -eq 0 ]; then
  echo "✅ Deployment successful! Version: ${VERSION_TAG}"
  echo ""
  echo "📋 Deployment info:"
  kubectl get deployment rest-backend-deployment
  echo ""
  echo "To rollback: kubectl rollout undo deployment/rest-backend-deployment"
else
  echo "❌ Deployment failed. Rolling back..."
  kubectl rollout undo deployment/rest-backend-deployment
  exit 1
fi
