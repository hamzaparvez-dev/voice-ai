# Call Transfer Tool — Configuration Guide

Wire Dograh's built-in **Transfer Call** tool to TBIS and ICMG escalation flows for live phone calls. This completes the human handoff path beyond escalation messaging and webhooks.

## Important Limitation

| Channel | Transfer Supported |
|---------|-------------------|
| **Phone** (Twilio, Telnyx, ARI) | ✅ Yes |
| **Web Call** (browser WebRTC) | ❌ No — use webhook + Slack/Kintone instead |

Web Call escalation relies on `escalation-webhook` → n8n → Slack (Phase 2). Phone calls can use **blind transfer** to a human destination.

---

## Architecture

```
Caller (PSTN)
    │
    ▼
Twilio / Telnyx ──► Dograh Voice Agent
                         │
                         │ LLM invokes transfer_call tool
                         ▼
                   Blind Transfer
                         │
                         ▼
              Human destination (+81...)
```

---

## Prerequisites

| Param ID | Requirement | Notes |
|----------|-------------|-------|
| **XFER-REQ-001** | Telephony provider configured | `/telephony-configurations` in dashboard |
| **XFER-REQ-002** | Inbound phone number assigned | Workflow set as inbound handler |
| **XFER-REQ-003** | Transfer destination number | E.164 format e.g. `+81312345678` |
| **XFER-REQ-004** | Tool created in Dograh | `/tools` → Transfer Call |

Do **not** modify `TURN_HOST` or `MINIO_PUBLIC_ENDPOINT` for transfer setup.

---

## Step 1 — Create Transfer Call Tool

Dashboard → **Tools** → **Create Tool** → **Transfer Call**

| Setting | TBIS Value | ICMG L&D Value |
|---------|------------|----------------|
| **Name** | `Transfer to Admissions` | `Transfer to L&D Coordinator` |
| **Description** | `Transfer the caller to a human TBIS admissions officer when they request a human, are frustrated, or need application-specific help.` | `Transfer the employee to a human L&D coordinator when they request a human or need enrollment exceptions.` |
| **Destination** | `${TBIS_TRANSFER_DESTINATION}` | `${ICMG_LD_TRANSFER_DESTINATION}` |
| **Timeout** | `30` seconds | `30` seconds |
| **Pre-transfer Message** | Custom (see below) | Custom (see below) |

### Pre-transfer Messages

**TBIS — English:**
> Please hold while I connect you with an admissions officer.

**TBIS — Japanese:**
> 少々お待ちください。担当者にお繋ぎいたします。

**ICMG — English:**
> Please hold while I connect you with a learning and development coordinator.

**ICMG — Japanese:**
> 少々お待ちください。ラーニング＆デベロップメント担当者にお繋ぎいたします。

Copy the tool UUID after saving — required for workflow wiring.

---

## Step 2 — Environment Variables (Tenant Destinations)

Store per-tenant destinations in VPS env or tenant runbook. Do not hardcode personal numbers in workflow JSON committed to git.

| Param ID | Variable | Example | Used By |
|----------|----------|---------|---------|
| **XFER-ENV-001** | `TBIS_TRANSFER_DESTINATION` | `+81312345678` | TBIS admissions queue |
| **XFER-ENV-002** | `ICMG_LD_TRANSFER_DESTINATION` | `+81398765432` | ICMG L&D helpdesk |
| **XFER-ENV-003** | `DEFAULT_TRANSFER_TIMEOUT` | `30` | Both kits |

Set in operator runbook; paste resolved E.164 number into the tool **Destination** field in the dashboard.

### E.164 Format Rules

- Japan: `+81` followed by number without leading `0`
- Example: `03-1234-5678` → `+81312345678`
- SIP (Asterisk ARI only): `PJSIP/admissions-queue`

---

## Step 3 — Attach Tool to Escalation Node

### TBIS (`kits/education-tbis/`)

| Config ID | Setting | Value |
|-----------|---------|-------|
| **XFER-TBIS-001** | Workflow | TBIS Bilingual Admissions Agent |
| **XFER-TBIS-002** | Node | `escalation-node` (Human Escalation) |
| **XFER-TBIS-003** | Attached tool | Transfer to Admissions (tool UUID) |
| **XFER-TBIS-004** | Node prompt addition | See prompt snippet below |

### ICMG (`kits/training-icmg/`)

| Config ID | Setting | Value |
|-----------|---------|-------|
| **XFER-ICMG-001** | Workflow | ICMG L&D Training Assistant |
| **XFER-ICMG-002** | Node | `escalation-node` (Human Escalation) |
| **XFER-ICMG-003** | Attached tool | Transfer to L&D Coordinator (tool UUID) |
| **XFER-ICMG-004** | Node prompt addition | See prompt snippet below |

### Escalation Node Prompt Snippet (append to existing prompt)

```
When the caller explicitly requests a human agent or you cannot answer from the knowledge base:
1. Inform the caller you are transferring them (in their language).
2. Invoke the Transfer Call tool immediately.
3. Do not continue the conversation after initiating transfer.
```

---

## Step 4 — Tool Definition JSON Reference

When creating tools via API or documenting for enterprise handoff:

```json
{
  "name": "Transfer to Admissions",
  "description": "Transfer the caller to a human TBIS admissions officer when they request a human, are frustrated, or need application-specific help.",
  "category": "transfer_call",
  "definition": {
    "schema_version": 1,
    "type": "transfer_call",
    "config": {
      "destination": "+81312345678",
      "messageType": "custom",
      "customMessage": "Please hold while I connect you with an admissions officer.",
      "timeout": 30
    }
  }
}
```

Replace `destination` with `${TBIS_TRANSFER_DESTINATION}` at deploy time.

ICMG variant:

```json
{
  "name": "Transfer to L&D Coordinator",
  "description": "Transfer the employee to a human L&D coordinator for enrollment exceptions or complex requests.",
  "category": "transfer_call",
  "definition": {
    "schema_version": 1,
    "type": "transfer_call",
    "config": {
      "destination": "+81398765432",
      "messageType": "custom",
      "customMessage": "Please hold while I connect you with a learning and development coordinator.",
      "timeout": 30
    }
  }
}
```

---

## Step 5 — Combined Escalation Flow (Phone)

For phone calls, use **both** transfer tool and webhook alert:

```
escalation-node
    ├── transfer_call tool  →  PSTN blind transfer
    └── escalation-webhook  →  n8n → Slack alert
```

| Channel | Transfer Tool | Webhook Alert |
|---------|---------------|---------------|
| Phone | ✅ Primary handoff | ✅ Manager notification |
| Web Call | ❌ Not available | ✅ Primary handoff path |

Update ICMG workflow `escalation-node` edges to fire webhook in parallel with transfer (already wired: `escalation-node` → `escalation-webhook`).

For TBIS, add an escalation webhook node mirroring ICMG if Slack alerts are needed on phone escalations.

---

## Step 6 — Telephony Provider Notes

### Twilio

- Destination must be a valid E.164 number reachable from your Twilio account
- Verify geo permissions for Japan (`+81`) in Twilio Console
- Transfer type: blind (no context passed to destination)

### Telnyx

- Same E.164 requirement
- Confirm transfer capability enabled on connection

### Asterisk ARI

- Use SIP endpoint format: `PJSIP/admissions-queue`
- External PSTN requires trunk configuration on Asterisk

---

## Testing Checklist

| Test ID | Scenario | Expected |
|---------|----------|----------|
| **XFER-QA-001** | Phone call → ask for human (EN) | Pre-transfer message → connected to destination |
| **XFER-QA-002** | Phone call → 担当者に繋いでください (JP) | Japanese pre-transfer message → transfer |
| **XFER-QA-003** | Web Call → ask for human | Escalation copy + webhook (no transfer) |
| **XFER-QA-004** | Destination busy / no answer | Timeout after 30s — verify agent handles failure in prompt |
| **XFER-QA-005** | Escalation on phone | Slack/n8n alert fires simultaneously |

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Tool not invoked | Verify tool attached to escalation node; prompt explicitly instructs LLM to call tool |
| Transfer fails immediately | E.164 format; Twilio geo permissions for +81 |
| Web call shows transfer error | Expected — transfers unsupported on WebRTC; use webhook path |
| Wrong destination | Verify tool UUID and destination in `/tools` editor |
| No hold music | Provider-dependent; optional pre-transfer custom message covers gap |

---

## Related Integrations

| Integration | Path | Use Case |
|-------------|------|----------|
| n8n Slack alert | [`../../automation/n8n/slack-alert.json`](../../automation/n8n/slack-alert.json) | Manager notification on escalation |
| Kintone record | [`../kintone/webhook-handler.md`](../kintone/webhook-handler.md) | Log escalation in Kintone |
| Salesforce Case | [`../salesforce/case-create.json`](../salesforce/case-create.json) | CRM case for escalations |

---

## Selective Restart Reminder

Transfer tool changes are dashboard-only — **no Docker restart required**.

If telephony credentials change:

```bash
cd /root/voice-ai/dograh
docker compose \
  -f docker-compose.yaml \
  -f docker-compose.safe.override.yaml \
  -f docker-compose.branding.override.yaml \
  --profile local-turn \
  up -d api
```
