#!/usr/bin/env bash
# Safe VPS deploy — does NOT bind 80/443 (nginx) or touch existing services.
# Uses UI :3010, API :8000, TURN :3478 only.

set -euo pipefail

SERVER_IP="${1:-72.62.119.108}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOGRAH_DIR="$SCRIPT_DIR/../dograh"

echo "=========================================="
echo "  GenuineStack — Safe VPS Deploy"
echo "  Server: $SERVER_IP"
echo "  Ports: 3010 (UI), 8000 (API), 3478 (TURN)"
echo "  Skips: 80, 443, 8080, 8088, 18789"
echo "=========================================="

command -v docker >/dev/null 2>&1 || {
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
}

[[ -d "$DOGRAH_DIR" ]] || { echo "Error: dograh/ not found. Run from repo root after git clone."; exit 1; }

cd "$DOGRAH_DIR"

if [[ -f .env ]]; then
  echo "Warning: .env already exists — reusing it (not overwriting)."
else
  TURN_SECRET="$(openssl rand -hex 32)"
  OSS_JWT="$(openssl rand -hex 32)"
  POSTGRES_PW="$(openssl rand -hex 32)"
  REDIS_PW="$(openssl rand -hex 32)"
  MINIO_USER="dograh$(openssl rand -hex 6)"
  MINIO_PW="$(openssl rand -hex 32)"

  cat > .env << EOF
REGISTRY=ghcr.io/dograh-hq
ENABLE_TELEMETRY=false

PUBLIC_HOST=${SERVER_IP}
BACKEND_API_ENDPOINT=http://${SERVER_IP}:8000
MINIO_PUBLIC_ENDPOINT=http://${SERVER_IP}:8000

TURN_HOST=${SERVER_IP}
TURN_SECRET=${TURN_SECRET}

OSS_JWT_SECRET=${OSS_JWT}
POSTGRES_PASSWORD=${POSTGRES_PW}
REDIS_PASSWORD=${REDIS_PW}
MINIO_ROOT_USER=${MINIO_USER}
MINIO_ROOT_PASSWORD=${MINIO_PW}

FASTAPI_WORKERS=2
EOF
  echo "Created .env"
fi

# Keep postgres/redis internal only — avoid conflicting with host DB on 5432/6379
cat > docker-compose.safe.override.yaml << 'EOF'
services:
  postgres:
    ports: !reset []
  redis:
    ports: !reset []
EOF

echo ""
echo "Starting GenuineStack (branded UI, local-turn profile — no nginx on 80/443)..."
echo "First run builds UI from source (~5 min). Subsequent runs are faster."
echo ""

docker compose \
  -f docker-compose.yaml \
  -f docker-compose.safe.override.yaml \
  -f docker-compose.branding.override.yaml \
  --profile local-turn \
  up -d --build ui --pull always

echo ""
echo "=========================================="
echo "  Deploy started"
echo "=========================================="
echo ""
echo "  Dashboard:  http://${SERVER_IP}:3010"
echo "  API health: http://${SERVER_IP}:8000/api/v1/health"
echo ""
echo "  Add Hostinger firewall rules (do NOT change 80/443/8080/8088/18789):"
echo "    TCP 3010, TCP 8000, TCP 3478, UDP 3478, UDP 49152-49200"
echo ""
echo "  Check status:  cd $DOGRAH_DIR && docker compose -f docker-compose.yaml -f docker-compose.safe.override.yaml -f docker-compose.branding.override.yaml --profile local-turn ps"
echo "  View logs:     cd $DOGRAH_DIR && docker compose -f docker-compose.yaml -f docker-compose.safe.override.yaml -f docker-compose.branding.override.yaml --profile local-turn logs -f api"
echo ""
