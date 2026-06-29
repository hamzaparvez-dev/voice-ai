# ICMG L&D Training Solution Kit

Enterprise solution kit for **ICMG Learning & Development** — a bilingual (English/Japanese) corporate training voice assistant for portfolio company employees.

This kit demonstrates the ICMG portfolio expansion story: beyond customer-facing CX (TBIS), GenuineStack Japan supports internal L&D, compliance, and professional development use cases.

## Kit Contents

```
kits/training-icmg/
├── README.md              ← This file
├── IMPORT.md              ← Step-by-step tenant import with alphanumeric IDs
├── workflows/
│   └── icmg-training-assistant.json
├── knowledge-base/training/
│   ├── course-catalog.txt
│   ├── enrollment-process.txt
│   ├── training-schedule.txt
│   └── compliance-requirements.txt
└── prompts/
    └── training-full-prompt.txt
```

## Target Tenant Profile

| Field | Value |
|-------|-------|
| **Kit ID** | `GS-KIT-TRN-ICMG-001` |
| **Industry** | Corporate L&D / portfolio HR |
| **Languages** | English, Japanese (auto-detect) |
| **Tone** | Formal Keigo (敬語) for Japanese |
| **Demo audience** | ICMG leadership / Mr. Segawa portfolio expansion |

## Capabilities

| Feature | Source |
|---------|--------|
| Bilingual greeting + compliance recording notice | `start-icmg` node |
| Intent routing (catalog / enrollment / schedule / compliance) | `main-dialogue` + topic nodes |
| Knowledge base RAG | 4 documents in `knowledge-base/training/` |
| Variable extraction | `learner_intent`, `caller_language`, `employee_department`, `course_interest`, `call_sentiment` |
| Human escalation + Slack alert | `escalation-node` → `escalation-webhook` |
| Post-call ticket automation | `post-call-webhook` → n8n |

## n8n Automation Integration

This kit is designed to wire into the Phase 2 automation layer:

| Webhook Node | n8n Endpoint | Flow File |
|--------------|--------------|-----------|
| Post-Call Ticket | `http://127.0.0.1:5678/webhook/post-call-ticket` | `deployment/automation/n8n/post-call-ticket-workflow.json` |
| Human Escalation | `http://127.0.0.1:5678/webhook/human-escalation` | `deployment/automation/n8n/slack-alert.json` |

Update webhook URLs to your public n8n endpoint before production (see `deployment/automation/n8n/README.md`).

## Quick Import (5 Steps)

1. **Import workflow** — Upload `workflows/icmg-training-assistant.json`
2. **Upload KB files** — Upload all four files from `knowledge-base/training/`
3. **Wire document UUIDs** — See `IMPORT.md` section **ICMG-DOC-***
4. **Configure models** — STT/TTS/LLM per tenant policy
5. **Wire n8n webhooks** — Point post-call and escalation nodes to n8n URLs

Detailed alphanumeric mapping: [`IMPORT.md`](IMPORT.md)

## ICMG Demo Talking Points

Use alongside [`../../deployment/icmg-presentation.md`](../../deployment/icmg-presentation.md):

- **Portfolio expansion**: Same platform, different kit — TBIS (CX) + ICMG L&D (internal)
- **Compliance automation**: Post-call tickets + Slack escalation via n8n
- **Multi-tenant ready**: Each portfolio company gets isolated KB + workflow

## Related Documentation

| Doc | Path |
|-----|------|
| TBIS education kit | [`../education-tbis/README.md`](../education-tbis/README.md) |
| n8n automation | [`../../deployment/automation/n8n/README.md`](../../deployment/automation/n8n/README.md) |
| ICMG demo script | [`../../deployment/icmg-presentation.md`](../../deployment/icmg-presentation.md) |

## Version

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-06-29 | Initial ICMG L&D kit for Phase 2 |
