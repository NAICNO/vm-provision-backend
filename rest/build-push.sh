docker build -t europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker/rest-backend .
docker push europe-north1-docker.pkg.dev/usit-itf-naic-project/vm-provisioning-docker/rest-backend

kubectl config use-context naic-och-prod

cd ../gcp/gke || exit
kubectl delete -f rest-backend-deployment.yaml
kubectl apply -f rest-backend-deployment.yaml
