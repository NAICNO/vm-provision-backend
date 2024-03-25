docker build -t europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker/provision-request-queue-consumer .
docker push europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker/provision-request-queue-consumer

kubectl config use-context naic-och-prod

cd ../gcp/gke || exit
kubectl delete -f provision-request-queue-consumer-deployments.yaml
kubectl apply -f provision-request-queue-consumer-deployments.yaml

