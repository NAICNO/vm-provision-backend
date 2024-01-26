docker build -t europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker/request-queue-consumer .
docker push europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker/request-queue-consumer

cd ../gcp/gke || exit
kubectl delete -f rabbitmq-consumers-deployments.yaml
kubectl apply -f rabbitmq-consumers-deployments.yaml

