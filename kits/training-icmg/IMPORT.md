# ICMG L&D Kit — Enterprise Import Guide

Alphanumeric ID mapping for deploying the ICMG Training solution kit to a GenuineStack tenant.

**Kit identifier:** `GS-KIT-TRN-ICMG-001`

---

## A. Tenant Environment Parameters

Configure on the VPS (`/root/voice-ai/dograh/.env`). Do **not** change `TURN_HOST` or `MINIO_PUBLIC_ENDPOINT`.

| Param ID | Environment Variable | Production Value | Notes |
|----------|---------------------|------------------|-------|
| **ICMG-ENV-001** | `PUBLIC_HOST` | `voice.genuinestack.com` | UI + API public hostname |
| **ICMG-ENV-002** | `BACKEND_API_ENDPOINT` | `https://voice.genuinestack.com` | Must match Cloudflare route |
| **ICMG-ENV-003** | `MINIO_PUBLIC_ENDPOINT` | `https://storage.genuinestack.com` | Isolated storage — do not change |
| **ICMG-ENV-004** | `TURN_HOST` | `72.62.119.108` | Coturn relay — do not change |
| **ICMG-ENV-005** | `N8N_WEBHOOK_URL` | *(see n8n README)* | Public URL for n8n webhooks |

---

## B. Workflow Import

| Step ID | Action | File / Target |
|---------|--------|---------------|
| **ICMG-WF-001** | Upload agent definition | `workflows/icmg-training-assistant.json` |
| **ICMG-WF-002** | Validate workflow | Dashboard → Validate |
| **ICMG-WF-003** | Publish workflow | Dashboard → Publish |
| **ICMG-WF-004** | Copy workflow UUID | URL: `/workflow/{workflowUuid}` |

### Workflow Node ID Reference

| Node ID | Internal ID | Node Name | KB Attachment |
|---------|-------------|-----------|---------------|
| **ICMG-NODE-G01** | `global-icmg` | Global ICMG L&D Rules | — |
| **ICMG-NODE-S01** | `start-icmg` | Greeting | — |
| **ICMG-NODE-M01** | `main-dialogue` | Main L&D Dialogue | All docs |
| **ICMG-NODE-C01** | `catalog-node` | Course Catalog Response | ICMG-DOC-001 |
| **ICMG-NODE-E01** | `enrollment-node` | Enrollment Response | ICMG-DOC-002 |
| **ICMG-NODE-S02** | `schedule-node` | Schedule Response | ICMG-DOC-003 |
| **ICMG-NODE-R01** | `compliance-node` | Compliance Response | ICMG-DOC-004 |
| **ICMG-NODE-X01** | `escalation-node` | Human Escalation | — |
| **ICMG-NODE-W01** | `escalation-webhook` | Escalation Alert Webhook | ICMG-N8N-002 |
| **ICMG-NODE-K01** | `clarification-node` | Follow-up | — |
| **ICMG-NODE-Z01** | `end-icmg` | Goodbye | — |
| **ICMG-NODE-W02** | `post-call-webhook` | Post-Call Ticket Webhook | ICMG-N8N-001 |

---

## C. Knowledge Base Document Mapping

| Doc ID | Source File | Attach To Node(s) | Content Summary |
|--------|-------------|-------------------|-----------------|
| **ICMG-DOC-001** | `knowledge-base/training/course-catalog.txt` | `main-dialogue`, `catalog-node` | Leadership, compliance, technical courses |
| **ICMG-DOC-002** | `knowledge-base/training/enrollment-process.txt` | `main-dialogue`, `enrollment-node` | Portal enrollment, approval, cancellation |
| **ICMG-DOC-003** | `knowledge-base/training/training-schedule.txt` | `main-dialogue`, `schedule-node` | Q3 2026 sessions and deadlines |
| **ICMG-DOC-004** | `knowledge-base/training/compliance-requirements.txt` | `main-dialogue`, `compliance-node` | Mandatory annual training |

---

## D. Extracted Variables

| Var ID | Variable Name | Type | n8n / Ticket Field |
|--------|---------------|------|-------------------|
| **ICMG-VAR-001** | `learner_intent` | string | `intent` |
| **ICMG-VAR-002** | `caller_language` | string | `language` |
| **ICMG-VAR-003** | `employee_department` | string | `department` |
| **ICMG-VAR-004** | `course_interest` | string | `course` |
| **ICMG-VAR-005** | `call_sentiment` | string | `sentiment` |

---

## E. n8n Automation Wiring

| Config ID | Webhook Node | Default URL | n8n Flow |
|-----------|--------------|-------------|----------|
| **ICMG-N8N-001** | `post-call-webhook` | `http://127.0.0.1:5678/webhook/post-call-ticket` | `post-call-ticket-workflow.json` |
| **ICMG-N8N-002** | `escalation-webhook` | `http://127.0.0.1:5678/webhook/human-escalation` | `slack-alert.json` |

### Post-Call Payload (ICMG-N8N-001)

```json
{
  "source": "ICMG-LD",
  "event": "call_completed",
  "intent": "{{learner_intent}}",
  "language": "{{caller_language}}",
  "department": "{{employee_department}}",
  "course": "{{course_interest}}",
  "sentiment": "{{call_sentiment}}",
  "transcript_summary": "ICMG L&D training inquiry completed",
  "escalated": false
}
```

### Escalation Payload (ICMG-N8N-002)

```json
{
  "source": "ICMG-LD",
  "event": "human_escalation",
  "intent": "{{learner_intent}}",
  "language": "{{caller_language}}",
  "department": "{{employee_department}}",
  "course": "{{course_interest}}",
  "sentiment": "{{call_sentiment}}",
  "escalated": true
}
```

For production, replace `127.0.0.1:5678` with your public n8n URL (e.g. `https://automation.genuinestack.com`).

---

## F. Acceptance Test Checklist

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| **ICMG-QA-001** | Web Call — English greeting | Compliance recording notice |
| **ICMG-QA-002** | Ask about leadership courses (EN) | KB answer from ICMG-DOC-001 |
| **ICMG-QA-003** | Ask 研修の申し込み方法 (JP) | Keigo enrollment guidance |
| **ICMG-QA-004** | Ask compliance deadlines (EN) | Mandatory training dates |
| **ICMG-QA-005** | Request human coordinator | Escalation message + n8n alert |
| **ICMG-QA-006** | End call | Post-call ticket in n8n executions |
| **ICMG-QA-007** | Negative sentiment call | Slack alert if sentiment=negative/frustrated |

---

## Import Sequence Summary

```
ICMG-WF-001  →  Upload workflow JSON
ICMG-DOC-*   →  Upload 4 KB files, record UUIDs
ICMG-NODE-*  →  Wire document UUIDs to agent nodes
ICMG-N8N-*   →  Start n8n, import flows, update webhook URLs
ICMG-WF-002  →  Validate
ICMG-WF-003  →  Publish
ICMG-QA-*    →  Run acceptance tests
```
