#!/bin/bash

export IMAGE_NAME=todolistapp-springboot
export IMAGE_VERSION=0.1

# OCI IAM OIDC config, baked into the React bundle at build time.
# Set these in Cloud Shell before running build.sh (or export them in your shell profile):
#   export REACT_APP_OIDC_AUTHORITY=https://idcs-...identity.oraclecloud.com
#   export REACT_APP_OIDC_CLIENT_ID=<client-id>
#   export REACT_APP_OIDC_CLIENT_SECRET=<client-secret>


if [ -z "$DOCKER_REGISTRY" ]; then
    export DOCKER_REGISTRY=$(state_get DOCKER_REGISTRY)
    echo "DOCKER_REGISTRY set."
fi
if [ -z "$DOCKER_REGISTRY" ]; then
    echo "Error: DOCKER_REGISTRY env variable needs to be set!"
    exit 1
fi

export IMAGE=${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_VERSION}

mvn clean package spring-boot:repackage
docker build -f Dockerfile -t $IMAGE .

docker push $IMAGE
if [  $? -eq 0 ]; then
    docker rmi "$IMAGE" #local
fi