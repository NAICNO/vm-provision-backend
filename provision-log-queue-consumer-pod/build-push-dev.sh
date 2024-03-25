docker build -t europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker-dev/provision-log-queue-consumer .
docker push europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker-dev/provision-log-queue-consumer

kubectl config use-context naic-och-dev

cd ../gcp/gke || exit
kubectl delete -f provision-log-queue-consumer-deployment.yaml
kubectl apply -f provision-log-queue-consumer-deployment.yaml

