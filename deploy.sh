#!/bin/sh
# deploy.sh — pull the latest evn-dashboard image from GHCR and restart the container.
# Usage on NAS:
#   ssh admin@<nas>
#   cd /volume1/docker/evn-dashboard
#   ./deploy.sh
#
# Requirements:
#   - Container Manager (Docker) installed on DSM.
#   - This folder contains the docker-compose.yml that references
#     ghcr.io/hanhanhycc/evn-dashboard:latest.
#   - If the GHCR package is PRIVATE, log in once with a PAT (read:packages):
#       echo <PAT> | sudo docker login ghcr.io -u hanhanhycc --password-stdin
#
# Optional env vars:
#   IMAGE_TAG   override the image tag to deploy (default: latest)
#   COMPOSE     override the compose command (default: auto-detect)

set -eu

# Move to the directory of this script so it works from anywhere.
cd "$(dirname "$0")"

# --- Detect docker compose flavour (DSM Container Manager uses `docker compose`).
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE="${COMPOSE:-docker compose}"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="${COMPOSE:-docker-compose}"
else
  echo "ERROR: neither 'docker compose' nor 'docker-compose' is available." >&2
  exit 1
fi

# DSM usually needs sudo for docker; auto-prepend it when not root.
if [ "$(id -u)" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

# Optional image tag override.
IMAGE_TAG="${IMAGE_TAG:-latest}"
if [ "$IMAGE_TAG" != "latest" ]; then
  echo ">> Overriding image tag to: $IMAGE_TAG"
  # shellcheck disable=SC2016
  export EVN_IMAGE_TAG="$IMAGE_TAG"
fi

echo ">> Pulling latest image from ghcr.io ..."
$SUDO $COMPOSE pull

echo ">> Recreating container ..."
$SUDO $COMPOSE up -d --remove-orphans

echo ">> Pruning dangling images ..."
$SUDO docker image prune -f >/dev/null || true

echo ">> Current status:"
$SUDO $COMPOSE ps

echo ">> Last 20 log lines:"
$SUDO $COMPOSE logs --tail=20 || true

echo
echo "Done. App should be reachable at http://<nas-ip>:3030"
