#!/usr/bin/env bash
# GenuineStack Japan — Local setup script
# Deploys Dograh and prepares TBIS agent configuration

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOGRAH_DIR="$PROJECT_ROOT/dograh"

echo "=========================================="
echo "  GenuineStack Japan — Setup"
echo "  Dograh + TBIS Bilingual Agent"
echo "=========================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Install Docker first:"
    echo "   curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! docker compose version &> /dev/null && ! docker-compose version &> /dev/null; then
    echo "❌ Docker Compose not found."
    exit 1
fi

echo "✅ Docker found"

# Check dograh directory
if [ ! -d "$DOGRAH_DIR" ]; then
    echo "❌ Dograh directory not found at $DOGRAH_DIR"
    echo "   Run: git clone https://github.com/dograh-hq/dograh.git dograh"
    exit 1
fi

echo "✅ Dograh repository found"

# Create .env if missing
cd "$DOGRAH_DIR"
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env with secure defaults..."
    cat > .env << EOF
# GenuineStack Japan — Dograh Configuration
ENABLE_TELEMETRY=false
PUBLIC_HOST=localhost
BACKEND_API_ENDPOINT=http://localhost:8000
TURN_HOST=localhost
OSS_JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-me-$(date +%s)")
POSTGRES_PASSWORD=$(openssl rand -hex 16 2>/dev/null || echo "postgres-$(date +%s)")
REDIS_PASSWORD=$(openssl rand -hex 16 2>/dev/null || echo "redis-$(date +%s)")
MINIO_ROOT_USER=dograh
MINIO_ROOT_PASSWORD=$(openssl rand -hex 16 2>/dev/null || echo "minio-$(date +%s)")
EOF
    echo "✅ .env created"
else
    echo "✅ .env already exists"
fi

# Start GenuineStack (branded UI from source)
echo ""
echo "🚀 Starting GenuineStack (first run builds UI — may take 5 minutes)..."

docker compose \
  -f docker-compose.yaml \
  -f docker-compose.branding.override.yaml \
  up -d --build ui --pull always

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "  Dashboard:  http://localhost:3010"
echo "  API:        http://localhost:8000"
echo ""
echo "  Next steps:"
echo "  1. Open http://localhost:3010 and create an account"
echo "  2. Upload workflow: workflows/tbis-bilingual-agent.json"
echo "  3. Upload KB docs from: knowledge-base/"
echo "  4. Attach document UUIDs to workflow nodes"
echo "  5. Configure models at /model-configurations"
echo "  6. Click Web Call to test bilingual agent"
echo ""
echo "  Deployment guide: deployment/hostinger-setup.md"
echo "  Demo script:      deployment/icmg-presentation.md"
echo ""
