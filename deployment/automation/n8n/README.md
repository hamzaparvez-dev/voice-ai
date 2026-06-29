# n8n — GenuineStack Enterprise Automation Layer

Self-hosted n8n instance for post-call ticket creation and Slack escalation alerts. Runs **alongside** the Dograh stack without modifying core compose files.

## Architecture

```
Dograh Workflow (ICMG L&D)
    │
    ├── post-call-webhook ──POST──► n8n /webhook/post-call-ticket
    │                                    │
    │                                    ├── Normalize payload
    │                                    ├── Create ticket (HTTP mock)
    │                                    └── Respond 200
    │
    └── escalation-webhook ──POST──► n8n /webhook/human-escalation
                                         │
                                         ├── Check sentiment / escalated flag
                                         └── Slack alert to #ld-escalations
```

## Files

| File | Purpose |
|------|---------|
| `docker-compose.n8n.yaml` | Standalone n8n container (port 5678) |
| `.env.example` | Environment template |
| `post-call-ticket-workflow.json` | Import into n8n — ticket creation flow |
| `slack-alert.json` | Import into n8n — Slack escalation flow |

## Prerequisites

- Docker + Docker Compose on VPS
- Does **not** require changes to `dograh/.env`, `TURN_HOST`, or `MINIO_PUBLIC_ENDPOINT`
- Avoids ports 80, 443, 3010, 8000, 3478, 8080, 8088, 18789

## Deploy (Idempotent)

```bash
cd /root/voice-ai/deployment/automation/n8n

# First run — create .env from template
if [[ ! -f .env ]]; then
  cp .env.example .env
  # Edit .env — set N8N_WEBHOOK_URL and Slack credentials
fi

docker compose -f docker-compose.n8n.yaml up -d
```

n8n UI: `http://127.0.0.1:5678` (SSH tunnel or reverse proxy for remote access)

## Import Workflows

1. Open n8n UI → **Workflows** → **Import from File**
2. Import `post-call-ticket-workflow.json`
3. Import `slack-alert.json`
4. Activate both workflows (toggle **Active**)
5. Copy webhook URLs from each Webhook node
6. Paste into Dograh workflow webhook nodes (`ICMG-N8N-001`, `ICMG-N8N-002`)

## Wire Dograh → n8n

In the ICMG L&D workflow editor, update webhook URLs:

| Dograh Node | n8n Path |
|-------------|----------|
| Post-Call Ticket Webhook | `{N8N_WEBHOOK_URL}/webhook/post-call-ticket` |
| Escalation Alert Webhook | `{N8N_WEBHOOK_URL}/webhook/human-escalation` |

**Local (same VPS):** `http://127.0.0.1:5678/webhook/...`

**Production (public):** Set `N8N_WEBHOOK_URL=https://automation.genuinestack.com` and route via Cloudflare/nginx.

## Environment Variables

See `.env.example` for full list. Key variables:

| Variable | Purpose |
|----------|---------|
| `N8N_WEBHOOK_URL` | Public base URL n8n uses for webhook registration |
| `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` | Protect n8n UI |
| `SLACK_WEBHOOK_URL` | Incoming webhook for `#ld-escalations` channel |
| `TICKET_API_URL` | Optional external ticket system (defaults to mock response) |

## Selective Restart

Restart **only** n8n — never the full Dograh stack:

```bash
cd /root/voice-ai/deployment/automation/n8n
docker compose -f docker-compose.n8n.yaml up -d n8n
```

## Backup Before Config Changes

```bash
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
cp docker-compose.n8n.yaml docker-compose.n8n.yaml.backup.$(date +%Y%m%d_%H%M%S)
```

## Test Webhooks Manually

```bash
# Post-call ticket
curl -X POST http://127.0.0.1:5678/webhook/post-call-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "source": "ICMG-LD",
    "event": "call_completed",
    "intent": "compliance",
    "language": "Japanese",
    "department": "Finance",
    "course": "APPI Data Privacy",
    "sentiment": "neutral",
    "transcript_summary": "Employee asked about compliance deadline",
    "escalated": false
  }'

# Human escalation
curl -X POST http://127.0.0.1:5678/webhook/human-escalation \
  -H "Content-Type: application/json" \
  -d '{
    "source": "ICMG-LD",
    "event": "human_escalation",
    "intent": "enrollment",
    "language": "English",
    "department": "HR",
    "course": "Executive Leadership",
    "sentiment": "frustrated",
    "escalated": true
  }'
```

## Related Kits

- ICMG L&D workflow: [`../../../kits/training-icmg/`](../../../kits/training-icmg/)
- TBIS education kit: [`../../../kits/education-tbis/`](../../../kits/education-tbis/)
