#!/usr/bin/env bash
# Rebuild Dograh UI with GenuineStack branding (run on VPS after git pull).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOGRAH_DIR="$SCRIPT_DIR/../dograh"

cd "$DOGRAH_DIR"

echo "Rebuilding UI with GenuineStack branding..."
docker compose \
  -f docker-compose.yaml \
  -f docker-compose.safe.override.yaml \
  -f docker-compose.branding.override.yaml \
  --profile local-turn \
  build ui

docker compose \
  -f docker-compose.yaml \
  -f docker-compose.safe.override.yaml \
  -f docker-compose.branding.override.yaml \
  --profile local-turn \
  up -d ui

echo "Done. Refresh http://YOUR_IP:3010 (hard refresh: Cmd+Shift+R)"
