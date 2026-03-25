#!/bin/bash
# ============================================================
# PLENIUM — Deploy Script
# ============================================================
# Verwendung: ./deploy.sh <umgebung>
# Umgebungen: dev-westphal | dev-asmussen | dev | prod
#
# Wird vom poll-and-deploy.sh automatisch aufgerufen,
# wenn GitHub neue Commits hat.
# ============================================================

set -e

ENVIRONMENT=${1:-}
REPO_DIR="/opt/plenium/repo"
ENV_DIR="/opt/plenium/envs"

if [ -z "$ENVIRONMENT" ]; then
  echo "Verwendung: $0 <develop|prod>"
  exit 1
fi

case "$ENVIRONMENT" in
  develop) BRANCH="develop" ; COMPOSE="docker-compose.dev.yml"  ;;
  prod)    BRANCH="main"    ; COMPOSE="docker-compose.prod.yml" ;;
  *)
    echo "Unbekannte Umgebung: $ENVIRONMENT (erlaubt: develop | prod)"
    exit 1
    ;;
esac

ENV_FILE="$ENV_DIR/.env.$ENVIRONMENT"

if [ ! -f "$ENV_FILE" ]; then
  echo "Env-Datei fehlt: $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

echo "$(date '+%Y-%m-%d %H:%M:%S') ▶ Deploy: $ENVIRONMENT (Branch: $BRANCH)"

# Repository auf Branch-Stand bringen
cd "$REPO_DIR"
git fetch origin "$BRANCH" --quiet
git checkout "$BRANCH" --quiet
git reset --hard "origin/$BRANCH" --quiet

# Docker bauen und starten
docker compose \
  -f "$COMPOSE" \
  --env-file "$ENV_FILE" \
  --project-name "$PROJECT_NAME" \
  up -d --build --remove-orphans

# Alte Images entfernen
docker image prune -f --filter "until=24h" > /dev/null 2>&1 || true

echo "$(date '+%Y-%m-%d %H:%M:%S') ✓ $ENVIRONMENT bereit auf Port $NGINX_PORT"
