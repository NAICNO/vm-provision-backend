docker build -t europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker-dev/rest-backend .
docker push europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker-dev/rest-backend

kubectl config use-context naic-och-dev

cd ../gcp/gke || exit
kubectl delete -f rest-backend-deployment.yaml
kubectl apply -f rest-backend-deployment.yaml
