#!/bin/bash
# Copyright (c) 2021 Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.

# Fail on error
set -e


BUILDS="todolistapp-springboot"

# Provision Repos
#while ! state_done JAVA_REPOS; do
#  for b in $BUILDS; do
#    oci artifacts container repository create --compartment-id "$(state_get COMPARTMENT_OCID)" --display-name "$(state_get RUN_NAME)/$b" --is-public true
#  done
#  state_set_done JAVA_REPOS
#done


# Install Graal
while ! state_done GRAAL; do
  if ! test -d ~/graalvm-community-openjdk-22.0.2+9.1; then
    echo "downloading graalVM"
    curl -sL https://github.com/graalvm/graalvm-ce-builds/releases/download/jdk-22.0.2/graalvm-community-jdk-22.0.2_linux-x64_bin.tar.gz | tar xz
    #curl -sL https://github.com/graalvm/graalvm-ce-builds/releases/download/jdk-22.0.2/graalvm-community-jdk-22.0.2_linux-aarch64_bin.tar.gz | tar xz 
    mv graalvm-community-openjdk-22.0.2+9.1 ~/
  fi
  state_set_done GRAAL
  state_set_done GRAAL_IMAGE
  echo "finished downloading graalVM"
done


# Install GraalVM native-image...
#while ! state_done GRAAL_IMAGE; do
#  ~/graalvm-community-openjdk-22.0.2+9.1/bin/gu install native-image

#done


# Wait for docker login
while ! state_done DOCKER_REGISTRY; do
  echo "Waiting for Docker Registry"
  sleep 5
done

state_set_done JAVA_BUILDS


# # Build all the images (no push) except frontend-helidon (requires Jaeger)
# while ! state_done JAVA_BUILDS; do
#   echo "building images"
#   for b in $BUILDS; do
#     cd $MTDRWORKSHOP_LOCATION/backend
#     time ./build.sh &>> $MTDRWORKSHOP_LOG/build-backend.log
#   done
#   state_set_done JAVA_BUILDS
# done

# while ! state_done JAVA_DEPLOY; do
#   echo "pushing images"
#   for b in $BUILDS; do
#     cd $MTDRWORKSHOP_LOCATION/backend
#     time ./deploy.sh &>> $MTDRWORKSHOP_LOG/deploy-backend.log
#   done
#   state_set_done JAVA_DEPLOY
# done
