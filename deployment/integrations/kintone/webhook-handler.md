# Kintone Webhook Handler — GenuineStack Japan

Bridge Dograh workflow webhooks to a Kintone Call Log app. Designed for the Japanese enterprise market (サイボウズ Kintone) with APPI-compliant self-hosted data flow.

## Architecture

```
Dograh Workflow (webhook node)
        │
        │  POST JSON (intent, language, sentiment, transcript)
        ▼
┌───────────────────────────────────────┐
│  Handler Layer (choose one)           │
│  • n8n HTTP Request node              │
│  • Custom FastAPI middleware          │
│  • Kintone Webhook plugin (inbound)   │
└───────────────────────────────────────┘
        │
        │  POST /k/v1/record.json
        ▼
Kintone App: 音声エージェント通話ログ
```

Recommended path: route through **n8n** (`deployment/automation/n8n/`) so Kintone credentials never live in Dograh.

---

## Environment Variables

Inject these at runtime. Never commit tokens to git.

| Param ID | Variable | Example | Required |
|----------|----------|---------|----------|
| **KINTONE-ENV-001** | `KINTONE_SUBDOMAIN` | `your-company` | Yes |
| **KINTONE-ENV-002** | `KINTONE_APP_ID` | `42` | Yes |
| **KINTONE-ENV-003** | `KINTONE_API_TOKEN` | *(API token with record add)* | Yes |
| **KINTONE-ENV-004** | `KINTONE_BASE_URL` | `https://your-company.cybozu.com` | Optional override |
| **KINTONE-ENV-005** | `KINTONE_GUEST_SPACE_ID` | `5` | Only for guest space apps |

Derived base URL (if `KINTONE_BASE_URL` unset):

```
https://${KINTONE_SUBDOMAIN}.cybozu.com
```

### VPS `.env` placement

Add to `deployment/automation/n8n/.env` (preferred) or a dedicated handler `.env`:

```bash
KINTONE_SUBDOMAIN=your-company
KINTONE_APP_ID=42
KINTONE_API_TOKEN=your-api-token-here
```

Backup before editing:

```bash
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

---

## Field Mapping — Dograh → Kintone

### TBIS Admissions Kit

| Kintone Field | Dograh Variable | Webhook Key | Notes |
|---------------|-----------------|-------------|-------|
| `call_id` | Workflow run ID | `call_id` or generate in handler | Use `{{workflow_run_id}}` if exposed |
| `source_kit` | Static | `"TBIS"` | Hardcode in handler |
| `caller_intent` | Extracted | `intent` / `caller_intent` | admissions, curriculum, fees, facilities |
| `caller_language` | Extracted | `language` / `caller_language` | English, Japanese |
| `context_field` | Extracted | `grade_inquiry` / `child_grade` | Grade level |
| `sentiment` | Extracted or default | `sentiment` | Default `neutral` if absent |
| `escalated` | Static / flag | `escalated` | `["Yes"]` if true, else `[]` |
| `transcript_summary` | Static / QA | `call_summary` / `transcript_summary` | Post-call summary text |
| `call_timestamp` | Generated | ISO 8601 UTC | `$now` in n8n |
| `workflow_name` | Static | `"TBIS Bilingual Admissions Agent"` | |
| `handler_status` | Static | `"processed"` | Set `"error"` on failure |

### ICMG L&D Kit

| Kintone Field | Dograh Variable | Webhook Key |
|---------------|-----------------|-------------|
| `source_kit` | Static | `"ICMG-LD"` |
| `caller_intent` | `learner_intent` | `intent` |
| `caller_language` | `caller_language` | `language` |
| `context_field` | Combined | `department` + ` / ` + `course` |
| `sentiment` | `call_sentiment` | `sentiment` |
| `escalated` | Event type | `true` if `event=human_escalation` |
| `transcript_summary` | Static / QA | `transcript_summary` |

Mapping IDs for runbooks: **KINTONE-MAP-TBIS-*** and **KINTONE-MAP-ICMG-***

---

## Execution Parameters

### KINTONE-EXEC-001 — Create Record (Primary)

| Parameter | Value |
|-----------|-------|
| Method | `POST` |
| URL | `${KINTONE_BASE_URL}/k/v1/record.json` |
| Header | `X-Cybozu-API-Token: ${KINTONE_API_TOKEN}` |
| Header | `Content-Type: application/json` |
| Body | See `sample-app.json` → `sample_record_create` |

### KINTONE-EXEC-002 — Upsert by Call ID (Optional)

Use Kintone `PUT /k/v1/record.json` with `updateKey` when the same call may fire twice (retry-safe):

```json
{
  "app": "${KINTONE_APP_ID}",
  "updateKey": {
    "field": "call_id",
    "value": "WR-20260629-001234"
  },
  "record": {
    "handler_status": { "value": "processed" }
  }
}
```

### KINTONE-EXEC-003 — Error Record

On handler failure, write with `handler_status: "error"` and summary in `transcript_summary`.

---

## n8n Handler Node Configuration

Add after the **Normalize Payload** node in `post-call-ticket-workflow.json`:

**HTTP Request node — Create Kintone Record**

| Setting | Expression |
|---------|------------|
| Method | POST |
| URL | `https://{{ $env.KINTONE_SUBDOMAIN }}.cybozu.com/k/v1/record.json` |
| Header `X-Cybozu-API-Token` | `{{ $env.KINTONE_API_TOKEN }}` |
| Body (JSON) | See below |

```json
{
  "app": "{{ $env.KINTONE_APP_ID }}",
  "record": {
    "call_id": { "value": "{{ $json.ticket_id }}" },
    "source_kit": { "value": "{{ $json.source }}" },
    "caller_intent": { "value": "{{ $json.intent }}" },
    "caller_language": { "value": "{{ $json.language }}" },
    "context_field": { "value": "{{ $json.department || $json.course || '' }}" },
    "sentiment": { "value": "{{ $json.sentiment }}" },
    "escalated": { "value": {{ $json.escalated ? '[\"Yes\"]' : '[]' }} },
    "transcript_summary": { "value": "{{ $json.transcript_summary }}" },
    "call_timestamp": { "value": "{{ $now.toISO() }}" },
    "workflow_name": { "value": "GenuineStack Voice Agent" },
    "ticket_id": { "value": "{{ $json.ticket_id }}" },
    "handler_status": { "value": "processed" }
  }
}
```

---

## Manual Test (curl)

Replace placeholders and run from VPS or local machine with network access:

```bash
curl -X POST "https://${KINTONE_SUBDOMAIN}.cybozu.com/k/v1/record.json" \
  -H "X-Cybozu-API-Token: ${KINTONE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "app": "'"${KINTONE_APP_ID}"'",
    "record": {
      "call_id": { "value": "TEST-'"$(date +%s)"'" },
      "source_kit": { "value": "TBIS" },
      "caller_intent": { "value": "admissions" },
      "caller_language": { "value": "Japanese" },
      "context_field": { "value": "Grade 5" },
      "sentiment": { "value": "neutral" },
      "escalated": { "value": [] },
      "transcript_summary": { "value": "Smoke test from GenuineStack handler" },
      "call_timestamp": { "value": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" },
      "workflow_name": { "value": "TBIS Bilingual Admissions Agent" },
      "handler_status": { "value": "received" }
    }
  }'
```

Expected response:

```json
{ "id": "123", "revision": "1" }
```

---

## Wire Dograh Webhook → Handler

1. Deploy n8n with Kintone env vars in `.env`
2. Extend post-call n8n flow with Kintone HTTP node (above)
3. In Dograh workflow editor, set webhook URL to n8n:
   - TBIS: `crm-webhook` → `{N8N_WEBHOOK_URL}/webhook/post-call-ticket`
   - ICMG: `post-call-webhook` → same endpoint

Do **not** point Dograh directly at Kintone unless you implement token rotation — use n8n as the secrets boundary.

---

## APPI / Compliance Notes

- Kintone record data stays in your Cybozu tenant (Japan region if configured)
- API tokens are scoped to app + permissions — use record-add only tokens
- Recording consent is handled in the voice workflow greeting node
- Audit: enable Kintone audit log + retain `call_id` for traceability

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| HTTP 401 | `KINTONE_API_TOKEN` invalid or expired |
| HTTP 400 `GAIA_IQ03` | Field code mismatch — verify app fields match `sample-app.json` |
| HTTP 403 | Token lacks record add permission for this app |
| Duplicate records | Switch to KINTONE-EXEC-002 upsert by `call_id` |
| Empty `context_field` | Map TBIS `grade_inquiry` vs ICMG `department`/`course` explicitly |

---

## Related Files

| File | Purpose |
|------|---------|
| [`sample-app.json`](sample-app.json) | Kintone app field spec + sample REST body |
| [`../salesforce/`](../salesforce/) | Alternative CRM for global portfolio clients |
| [`../../automation/n8n/`](../../automation/n8n/) | Recommended handler runtime |
