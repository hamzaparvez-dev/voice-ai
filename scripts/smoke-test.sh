#!/usr/bin/env bash
# GenuineStack Japan — Production smoke test
# Validates public endpoints, API health, storage, and Coturn port accessibility.
# Safe to run repeatedly (idempotent). Does not modify any configuration.
#
# Usage:
#   ./scripts/smoke-test.sh              # remote checks (default production URLs)
#   ./scripts/smoke-test.sh --local    # also verify Docker services on this host
#
# Override defaults via environment:
#   VOICE_URL=https://voice.genuinestack.com
#   API_HEALTH_URL=https://voice.genuinestack.com/api/v1/health
#   STORAGE_URL=https://storage.genuinestack.com
#   TURN_HOST=72.62.119.108

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOGRAH_DIR="${DOGRAH_DIR:-$PROJECT_ROOT/dograh}"

# --- Configurable targets (production defaults) ---
VOICE_URL="${VOICE_URL:-https://voice.genuinestack.com}"
API_HEALTH_URL="${API_HEALTH_URL:-${VOICE_URL%/}/api/v1/health}"
STORAGE_URL="${STORAGE_URL:-https://storage.genuinestack.com}"
TURN_HOST="${TURN_HOST:-72.62.119.108}"
TURN_PORT="${TURN_PORT:-3478}"
TURN_UDP_MIN="${TURN_UDP_MIN:-49152}"
TURN_UDP_MAX="${TURN_UDP_MAX:-49200}"

# Sample UDP ports from the Coturn relay range (full range scan would be slow)
TURN_UDP_SAMPLE_PORTS=(49152 49160 49180 49200)

CHECK_LOCAL=false
if [[ "${1:-}" == "--local" ]]; then
  CHECK_LOCAL=true
fi

PASS=0
FAIL=0
WARN=0

log_pass() { echo "  ✅ PASS — $1"; PASS=$((PASS + 1)); }
log_fail() { echo "  ❌ FAIL — $1"; FAIL=$((FAIL + 1)); }
log_warn() { echo "  ⚠️  WARN — $1"; WARN=$((WARN + 1)); }

# --- HTTP helpers ---
http_status() {
  local url="$1"
  curl -sS -o /dev/null -w '%{http_code}' \
    --connect-timeout 10 \
    --max-time 30 \
    -L \
    "$url" 2>/dev/null || echo "000"
}

http_body() {
  local url="$1"
  curl -sS \
    --connect-timeout 10 \
    --max-time 30 \
    -L \
    "$url" 2>/dev/null || echo ""
}

check_http_200() {
  local label="$1"
  local url="$2"
  local code
  code="$(http_status "$url")"
  if [[ "$code" == "200" ]]; then
    log_pass "$label ($url → HTTP $code)"
  else
    log_fail "$label ($url → HTTP $code, expected 200)"
  fi
}

# --- Port helpers ---
port_open_tcp() {
  local host="$1"
  local port="$2"
  if command -v nc >/dev/null 2>&1; then
    nc -z -w 3 "$host" "$port" 2>/dev/null
    return $?
  fi
  # Bash /dev/tcp fallback
  (echo >/dev/tcp/"$host"/"$port") 2>/dev/null
}

port_open_udp() {
  local host="$1"
  local port="$2"
  if command -v nc >/dev/null 2>&1; then
    nc -z -u -w 3 "$host" "$port" 2>/dev/null
    return $?
  fi
  # UDP probe without nc is unreliable; treat as warning
  return 2
}

check_turn_ports() {
  echo ""
  echo "▶ Coturn / WebRTC ports ($TURN_HOST)"

  if port_open_tcp "$TURN_HOST" "$TURN_PORT"; then
    log_pass "TURN TCP $TURN_PORT reachable on $TURN_HOST"
  else
    log_fail "TURN TCP $TURN_PORT not reachable on $TURN_HOST"
  fi

  local udp_result
  port_open_udp "$TURN_HOST" "$TURN_PORT"
  udp_result=$?
  if [[ $udp_result -eq 0 ]]; then
    log_pass "TURN UDP $TURN_PORT reachable on $TURN_HOST"
  elif [[ $udp_result -eq 2 ]]; then
    log_warn "TURN UDP $TURN_PORT — install 'nc' (netcat) for UDP checks"
  else
    log_fail "TURN UDP $TURN_PORT not reachable on $TURN_HOST"
  fi

  local relay_ok=0
  local relay_fail=0
  for port in "${TURN_UDP_SAMPLE_PORTS[@]}"; do
    port_open_udp "$TURN_HOST" "$port"
    udp_result=$?
    if [[ $udp_result -eq 0 ]]; then
      relay_ok=$((relay_ok + 1))
    elif [[ $udp_result -eq 2 ]]; then
      log_warn "Relay UDP $port — skipped (no nc)"
      break
    else
      relay_fail=$((relay_fail + 1))
    fi
  done

  if [[ $relay_ok -gt 0 && $relay_fail -eq 0 ]]; then
    log_pass "TURN relay UDP range sample ($TURN_UDP_MIN-$TURN_UDP_MAX): ${relay_ok}/${#TURN_UDP_SAMPLE_PORTS[@]} ports open"
  elif [[ $relay_fail -gt 0 ]]; then
    log_fail "TURN relay UDP range sample: $relay_fail port(s) closed (expected $TURN_UDP_MIN-$TURN_UDP_MAX open)"
  fi
}

check_api_health() {
  echo ""
  echo "▶ Backend microservices"

  local code body
  code="$(http_status "$API_HEALTH_URL")"
  body="$(http_body "$API_HEALTH_URL")"

  if [[ "$code" == "200" ]]; then
    log_pass "API health endpoint ($API_HEALTH_URL → HTTP $code)"
  else
    log_fail "API health endpoint ($API_HEALTH_URL → HTTP $code, expected 200)"
    return
  fi

  if echo "$body" | grep -q '"status"[[:space:]]*:[[:space:]]*"ok"'; then
    log_pass 'API health JSON contains status="ok"'
  else
    log_fail 'API health JSON missing status="ok"'
  fi

  if echo "$body" | grep -q '"turn_enabled"[[:space:]]*:[[:space:]]*true'; then
    log_pass "API reports turn_enabled=true"
  else
    log_warn "API turn_enabled is false or absent — verify TURN_SECRET in .env"
  fi
}

check_storage() {
  echo ""
  echo "▶ Object storage (MinIO public endpoint)"

  local code
  code="$(http_status "$STORAGE_URL")"
  # MinIO may return 200, 403 (auth required), or 400 on root — all indicate service is up
  if [[ "$code" =~ ^(200|400|403)$ ]]; then
    log_pass "Storage endpoint reachable ($STORAGE_URL → HTTP $code)"
  else
    log_fail "Storage endpoint unreachable ($STORAGE_URL → HTTP $code)"
  fi
}

check_docker_local() {
  echo ""
  echo "▶ Local Docker services (VPS host)"

  if ! command -v docker >/dev/null 2>&1; then
    log_warn "Docker not installed — skipping local container checks"
    return
  fi

  if [[ ! -d "$DOGRAH_DIR" ]]; then
    log_warn "dograh/ not found at $DOGRAH_DIR — skipping container checks"
    return
  fi

  local compose_cmd=(
    docker compose
    -f "$DOGRAH_DIR/docker-compose.yaml"
    -f "$DOGRAH_DIR/docker-compose.safe.override.yaml"
    -f "$DOGRAH_DIR/docker-compose.branding.override.yaml"
    --profile local-turn
  )

  local required_services=(ui api postgres redis minio coturn)
  local ps_output
  if ! ps_output="$("${compose_cmd[@]}" ps --format '{{.Service}} {{.State}}' 2>/dev/null)"; then
    log_fail "docker compose ps failed — stack may not be running"
    return
  fi

  for svc in "${required_services[@]}"; do
    if echo "$ps_output" | grep -q "^${svc} running"; then
      log_pass "Container '$svc' is running"
    else
      log_fail "Container '$svc' is not running"
    fi
  done
}

# --- Main ---
echo "=========================================="
echo "  GenuineStack Japan — Smoke Test"
echo "  $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="
echo ""
echo "  Voice UI:     $VOICE_URL"
echo "  API Health:   $API_HEALTH_URL"
echo "  Storage:      $STORAGE_URL"
echo "  TURN Host:    $TURN_HOST:$TURN_PORT"
echo "  Local Docker: $CHECK_LOCAL"
echo ""

echo "▶ Public HTTP endpoints"
check_http_200 "Voice dashboard" "$VOICE_URL"

check_api_health
check_storage
check_turn_ports

if [[ "$CHECK_LOCAL" == "true" ]]; then
  check_docker_local
fi

echo ""
echo "=========================================="
echo "  Results: $PASS passed, $FAIL failed, $WARN warnings"
echo "=========================================="

if [[ $FAIL -gt 0 ]]; then
  echo ""
  echo "  Smoke test FAILED. Review failures above."
  exit 1
fi

echo ""
echo "  Smoke test PASSED."
exit 0
