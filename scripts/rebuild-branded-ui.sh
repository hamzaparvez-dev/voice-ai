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

echo "Done. Refresh https://voice.genuinestack.com (hard refresh: Cmd+Shift+R)"
echo ""
echo "Also update dograh/.env on the server if uploads still fail:"
echo "  BACKEND_API_ENDPOINT=https://voice.genuinestack.com"
echo "  MINIO_PUBLIC_ENDPOINT=https://voice.genuinestack.com"
echo "  PUBLIC_HOST=voice.genuinestack.com"
echo "  Then: docker compose --profile local-turn restart api"
