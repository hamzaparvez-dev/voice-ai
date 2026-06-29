# TBIS Education Solution Kit

Enterprise solution kit for **Tokyo Bay International School (TBIS)** — a bilingual (English/Japanese) admissions voice agent for GenuineStack Japan.

This kit is fully decoupled from the core platform. Import assets into a tenant dashboard without modifying `dograh/` or shared deployment configs.

## Kit Contents

```
kits/education-tbis/
├── README.md              ← This file
├── IMPORT.md              ← Step-by-step tenant import with alphanumeric IDs
├── workflow/
│   └── tbis-bilingual-agent.json
├── knowledge-base/
│   ├── admissions-faq.txt
│   ├── curriculum-overview.txt
│   ├── fee-structure.txt
│   └── facilities.txt
└── prompts/
    ├── system-keigo.txt
    ├── system-english.txt
    └── tbis-full-prompt.txt
```

## Target Tenant Profile

| Field | Value |
|-------|-------|
| **Kit ID** | `GS-KIT-EDU-TBIS-001` |
| **Industry** | International education / admissions |
| **Languages** | English, Japanese (auto-detect) |
| **Tone** | Formal Keigo (敬語) for Japanese |
| **Demo audience** | ICMG / portfolio CFO presentations |

## Capabilities

| Feature | Source |
|---------|--------|
| Bilingual greeting + recording consent | `workflow/tbis-bilingual-agent.json` → node `start-tbis` |
| Intent routing (admissions / curriculum / fees / facilities) | `main-dialogue` + topic nodes |
| Knowledge base RAG | `knowledge-base/*.txt` (4 documents) |
| Variable extraction | `caller_intent`, `caller_language`, `child_grade` |
| Human escalation messaging | `escalation-node` |
| CRM webhook on call end | `crm-webhook` (configure endpoint per tenant) |

## Prerequisites

Before importing this kit, ensure the GenuineStack platform is running:

1. Production URL live: `https://voice.genuinestack.com`
2. Models configured at `/model-configurations` (STT multilingual, TTS EN+JP, LLM BYOK)
3. Operator account created in the dashboard

Run the smoke test after deploy:

```bash
./scripts/smoke-test.sh
./scripts/smoke-test.sh --local   # on VPS — also checks Docker containers
```

## Quick Import (5 Steps)

1. **Import workflow** — Dashboard → Workflows → Upload → `workflow/tbis-bilingual-agent.json`
2. **Upload KB files** — Files → upload all four files from `knowledge-base/`
3. **Wire document UUIDs** — See `IMPORT.md` section **TBIS-DOC-*** mapping
4. **Configure models** — STT/TTS/LLM per tenant policy
5. **Validate → Publish → Web Call** — Test English and Japanese

Detailed alphanumeric mapping: [`IMPORT.md`](IMPORT.md)

## Prompt Reference Files

Files in `prompts/` are **source-of-truth references**. The workflow JSON embeds prompts inline; edit these files first, then sync changes into the workflow global node if updating production behavior.

| File | Purpose |
|------|---------|
| `system-keigo.txt` | Japanese Keigo rules |
| `system-english.txt` | English voice assistant rules |
| `tbis-full-prompt.txt` | Combined bilingual system prompt |

## CRM Webhook

The workflow includes a placeholder webhook (`crm-webhook`). Replace before production:

```
https://your-crm.example.com/api/call-summary
```

Set the real endpoint in the workflow editor or via tenant automation (Phase 2 n8n).

## Related Documentation

| Doc | Path |
|-----|------|
| Platform README | [`../../README.md`](../../README.md) |
| Hostinger deploy | [`../../deployment/hostinger-setup.md`](../../deployment/hostinger-setup.md) |
| ICMG demo script | [`../../deployment/icmg-presentation.md`](../../deployment/icmg-presentation.md) |
| Smoke test | [`../../scripts/smoke-test.sh`](../../scripts/smoke-test.sh) |

## Version

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-06-29 | Initial kit packaging for Phase 1 |
