#!/bin/bash
TAG=$(git rev-parse --short HEAD)
export IMAGE_NAME=todolistapp-springboot
export IMAGE_VERSION=$TAG

if [ -z "$DOCKER_REGISTRY" ]; then
    export DOCKER_REGISTRY=$(state_get DOCKER_REGISTRY)
    echo "DOCKER_REGISTRY set."
fi

if [ -z "$DOCKER_REGISTRY" ]; then
    echo "Error: DOCKER_REGISTRY env variable needs to be set!"
    exit 1
fi

export IMAGE=${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_VERSION}
export IMAGE_LATEST=${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
export IMAGE_PREVIOUS=${DOCKER_REGISTRY}/${IMAGE_NAME}:previous

# 1. Descargar el 'latest' actual para convertirlo en 'previous'
echo "Intentando obtener la imagen 'latest' actual..."
if docker pull $IMAGE_LATEST >/dev/null 2>&1; then
    echo "Imagen 'latest' encontrada. Etiquetando y subiendo como 'previous'..."
    docker tag $IMAGE_LATEST $IMAGE_PREVIOUS
    docker push $IMAGE_PREVIOUS
else
    echo "No se encontró una imagen 'latest' en el registro (¿primera ejecución?). Se omite 'previous'."
fi

# 2. Empaquetar la aplicación
echo "Ejecutando Maven..."
mvn clean package spring-boot:repackage

# 3. Construir la nueva imagen con el tag del hash de Git
echo "Construyendo la imagen Docker..."
docker build -f Dockerfile -t $IMAGE .

# 4. Etiquetar esta nueva imagen también como 'latest'
docker tag $IMAGE $IMAGE_LATEST

# 5. Subir ambas etiquetas (hash y latest)
echo "Subiendo imagen con tag: $IMAGE_VERSION"
docker push $IMAGE
PUSH_STATUS=$?

if [ $PUSH_STATUS -eq 0 ]; then
    echo "Subiendo imagen con tag: latest"
    docker push $IMAGE_LATEST
    
    # 6. Limpieza de imágenes locales para no saturar el disco
    echo "Limpiando imágenes locales..."
    docker rmi $IMAGE
    docker rmi $IMAGE_LATEST
    docker rmi $IMAGE_PREVIOUS 2>/dev/null || true
    echo "Despliegue de imágenes completado con éxito."
else
    echo "Error: Falló la subida de la imagen principal ($IMAGE)."
    exit 1
fi
