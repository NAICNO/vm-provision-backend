Build Docker image
```
docker build -t europe-north1-docker.pkg.dev/vm-provisioning/vm-provisioning-docker/request-queue-consumer .
```
Push Docker image to Google Cloud Registry
```
docker push europe-north1-docker.pkg.dev/vm-provisioning/vm-provisioning-docker/request-queue-consumer
```
