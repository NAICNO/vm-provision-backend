docker build -t europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker/request-queue-consumer .
docker push europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker/request-queue-consumer

cd ..
cd gke
kubectl delete -f rabbitmq-consumers-deployments.yml
kubectl apply -f rabbitmq-consumers-deployments.yml

