# TBIS Kit — Enterprise Import Guide

Alphanumeric ID mapping for deploying the TBIS solution kit to a GenuineStack tenant. Use these IDs in runbooks, ticketing systems, and client handoff documents.

**Kit identifier:** `GS-KIT-EDU-TBIS-001`

---

## A. Tenant Environment Parameters

Configure on the VPS (`/root/voice-ai/dograh/.env`). Do **not** change `TURN_HOST` or `MINIO_PUBLIC_ENDPOINT` if already working.

| Param ID | Environment Variable | Production Value | Notes |
|----------|---------------------|------------------|-------|
| **TBIS-ENV-001** | `PUBLIC_HOST` | `voice.genuinestack.com` | UI + API public hostname |
| **TBIS-ENV-002** | `BACKEND_API_ENDPOINT` | `https://voice.genuinestack.com` | Must match Cloudflare route |
| **TBIS-ENV-003** | `MINIO_PUBLIC_ENDPOINT` | `https://storage.genuinestack.com` | Isolated storage — do not change |
| **TBIS-ENV-004** | `TURN_HOST` | `72.62.119.108` | Coturn relay — do not change |
| **TBIS-ENV-005** | `ENABLE_TELEMETRY` | `false` | Enterprise / APPI compliance |
| **TBIS-ENV-006** | `OSS_JWT_SECRET` | *(auto-generated)* | Auth signing key |

After `.env` changes, restart only affected services:

```bash
cd /root/voice-ai/dograh
docker compose \
  -f docker-compose.yaml \
  -f docker-compose.safe.override.yaml \
  -f docker-compose.branding.override.yaml \
  --profile local-turn \
  up -d api
```

---

## B. Workflow Import

| Step ID | Action | File / Target |
|---------|--------|---------------|
| **TBIS-WF-001** | Upload agent definition | `workflow/tbis-bilingual-agent.json` |
| **TBIS-WF-002** | Validate workflow | Dashboard → Validate (no errors) |
| **TBIS-WF-003** | Publish workflow | Dashboard → Publish |
| **TBIS-WF-004** | Copy workflow UUID | Settings or URL: `/workflow/{workflowUuid}` |

### Workflow Node ID Reference

Use these internal node IDs when attaching KB documents or editing in the visual editor:

| Node ID | Node Name | Type | KB Attachment |
|---------|-----------|------|---------------|
| **TBIS-NODE-G01** | `global-tbis` | globalNode | — (system rules) |
| **TBIS-NODE-S01** | `start-tbis` | startCall | — |
| **TBIS-NODE-M01** | `main-dialogue` | agentNode | All docs (primary RAG) |
| **TBIS-NODE-A01** | `admissions-node` | agentNode | TBIS-DOC-001 |
| **TBIS-NODE-C01** | `curriculum-node` | agentNode | TBIS-DOC-002 |
| **TBIS-NODE-F01** | `fees-node` | agentNode | TBIS-DOC-003 |
| **TBIS-NODE-F02** | `facilities-node` | agentNode | TBIS-DOC-004 |
| **TBIS-NODE-E01** | `escalation-node` | agentNode | — |
| **TBIS-NODE-K01** | `clarification-node` | agentNode | — |
| **TBIS-NODE-X01** | `end-tbis` | endCall | — |
| **TBIS-NODE-W01** | `crm-webhook` | webhook | Configure TBIS-CRM-001 |

---

## C. Knowledge Base Document Mapping

Upload each file via **Files** in the dashboard. After upload, copy the document UUID from the file detail view.

| Doc ID | Source File | Attach To Node(s) | Content Summary |
|--------|-------------|-------------------|-----------------|
| **TBIS-DOC-001** | `knowledge-base/admissions-faq.txt` | `main-dialogue`, `admissions-node` | Application process, deadlines, documents |
| **TBIS-DOC-002** | `knowledge-base/curriculum-overview.txt` | `main-dialogue`, `curriculum-node` | IB PYP / MYP / DP programmes |
| **TBIS-DOC-003** | `knowledge-base/fee-structure.txt` | `main-dialogue`, `fees-node` | Tuition, enrollment fees, payment |
| **TBIS-DOC-004** | `knowledge-base/facilities.txt` | `main-dialogue`, `facilities-node` | Campus, sports, arts, tours |

### Wiring Procedure (TBIS-DOC-001 example)

1. Open workflow in editor
2. Select node **Main Admissions Dialogue** (`main-dialogue` / TBIS-NODE-M01)
3. Knowledge Base section → Add document → paste UUID from **TBIS-DOC-001**
4. Repeat for topic-specific nodes per table above
5. Save → Validate → Publish

---

## D. Model Configuration

| Config ID | Component | Recommended Setting |
|-----------|-----------|---------------------|
| **TBIS-MODEL-001** | STT (Transcriber) | Multilingual or Japanese + English |
| **TBIS-MODEL-002** | TTS (Voice) | Japanese voice + English voice |
| **TBIS-MODEL-003** | LLM | GPT-4o or tenant-approved model (BYOK) |

Path: `/model-configurations`

---

## E. Extracted Variables

The workflow extracts these variables during calls (TBIS-NODE-M01):

| Var ID | Variable Name | Type | CRM Field Mapping |
|--------|---------------|------|-------------------|
| **TBIS-VAR-001** | `caller_intent` | string | `intent` |
| **TBIS-VAR-002** | `caller_language` | string | `language` |
| **TBIS-VAR-003** | `child_grade` | string | `grade_inquiry` |

---

## F. CRM Webhook Configuration

| Config ID | Parameter | Value |
|-----------|-----------|-------|
| **TBIS-CRM-001** | Webhook node | `crm-webhook` (TBIS-NODE-W01) |
| **TBIS-CRM-002** | HTTP method | `POST` |
| **TBIS-CRM-003** | Endpoint URL | *(tenant-specific — replace placeholder)* |
| **TBIS-CRM-004** | Payload template | See workflow JSON `payload_template` |

Default payload fields:

```json
{
  "school": "TBIS",
  "intent": "{{caller_intent}}",
  "language": "{{caller_language}}",
  "grade_inquiry": "{{child_grade}}",
  "call_summary": "TBIS admissions call completed"
}
```

---

## G. Acceptance Test Checklist

Run after import. Record pass/fail per test ID.

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| **TBIS-QA-001** | Web Call — English greeting | Recording consent + warm welcome |
| **TBIS-QA-002** | Ask about admissions (EN) | KB-backed answer from TBIS-DOC-001 |
| **TBIS-QA-003** | Web Call — Japanese greeting | Keigo greeting (です/ます) |
| **TBIS-QA-004** | Ask 入学について (JP) | Japanese Keigo response |
| **TBIS-QA-005** | Ask unanswerable question | Escalation message (TBIS-NODE-E01) |
| **TBIS-QA-006** | End call | CRM webhook fires (if TBIS-CRM-003 configured) |
| **TBIS-QA-007** | Platform smoke test | `./scripts/smoke-test.sh` exits 0 |

---

## H. Multi-Tenant Deployment Notes

When deploying TBIS kit to additional enterprise clients:

1. Clone kit folder: `kits/education-tbis/` → `kits/education-tbis-{client-slug}/`
2. Update **TBIS-CRM-003** endpoint per client CRM
3. Replace KB content files if client-specific (keep TBIS-DOC-* IDs in runbook)
4. Assign new kit ID: `GS-KIT-EDU-TBIS-{NNN}`
5. Keep kits isolated under `/root/voice-ai/kits/` — never merge into `dograh/`

---

## Import Sequence Summary

```
TBIS-WF-001  →  Upload workflow JSON
TBIS-DOC-*   →  Upload 4 KB files, record UUIDs
TBIS-NODE-*  →  Wire document UUIDs to agent nodes
TBIS-MODEL-* →  Configure STT / TTS / LLM
TBIS-WF-002  →  Validate
TBIS-WF-003  →  Publish
TBIS-QA-*    →  Run acceptance tests
TBIS-CRM-001 →  Set production webhook URL
```
