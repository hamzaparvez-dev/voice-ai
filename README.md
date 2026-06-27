# GenuineStack Japan — Production AI Voice Agent Platform

Self-hosted bilingual (English/Japanese) AI voice agent for enterprise customer experience, built on [Dograh](https://github.com/dograh-hq/dograh) — the open-source alternative to Vapi and Retell.

**Target demo:** TBIS (Tokyo Bay International School) admissions agent for ICMG meeting.

## Quick Start

```bash
# Clone this repo (includes Dograh)
git clone <repo-url> genuinestack-japan
cd genuinestack-japan

# One-command local deploy
chmod +x scripts/setup.sh
./scripts/setup.sh

# Open dashboard
open http://localhost:3010
```

## Project Structure

```
genuinestack-japan/
├── dograh/                          # Dograh platform (cloned)
│   ├── docker-compose.yaml
│   ├── scripts/start_docker.sh
│   └── deploy/hostinger/            # VPS deployment configs
├── knowledge-base/                  # TBIS documents for RAG
│   ├── admissions-faq.txt
│   ├── curriculum-overview.txt
│   ├── fee-structure.txt
│   └── facilities.txt
├── prompts/                         # System prompts
│   ├── system-keigo.txt             # Japanese Keigo rules
│   ├── system-english.txt           # English prompt
│   └── tbis-full-prompt.txt         # Combined bilingual prompt
├── workflows/
│   └── tbis-bilingual-agent.json    # Import-ready TBIS workflow
├── deployment/
│   ├── hostinger-setup.md           # Hostinger KVM2 deploy guide
│   └── icmg-presentation.md         # Demo talking points
└── scripts/
    └── setup.sh                     # Local setup script
```

## TBIS Agent Setup

1. **Deploy Dograh** — run `scripts/setup.sh` or follow `deployment/hostinger-setup.md`
2. **Import workflow** — Dashboard → Workflows → Upload Agent Definition → `workflows/tbis-bilingual-agent.json`
3. **Upload knowledge base** — Dashboard → Files → upload all files from `knowledge-base/`
4. **Attach documents** — In workflow editor, add document UUIDs to agent nodes
5. **Configure models** — Set STT to multilingual, TTS for Japanese + English
6. **Publish & test** — Validate → Publish → Web Call

## Features

| Feature | Status |
|---------|--------|
| Bilingual EN/JP with auto-detection | ✅ |
| Japanese Keigo (敬語) mode | ✅ |
| Intent routing (admissions/curriculum/fees/facilities) | ✅ |
| Knowledge base RAG | ✅ |
| Human escalation | ✅ |
| CRM webhook integration | ✅ (configure endpoint) |
| Call recording consent | ✅ |
| Self-hosted / APPI compliant | ✅ |

## Architecture

```
┌─────────────────────────────────────────────┐
│              Docker Compose Stack            │
├─────────────────────────────────────────────┤
│  Nginx │ Coturn │ API (FastAPI) │ UI (Next) │
│  PostgreSQL + pgvector │ Redis │ MinIO      │
└─────────────────────────────────────────────┘
```

## Cost

| Item | Cost |
|------|------|
| Hostinger KVM2 | ~$10-15/mo |
| STT/TTS (built-in) | Free |
| LLM (BYOK) | Variable |
| **Total** | **~$10-15/mo + LLM** |

## Documentation

- [Hostinger Deployment Guide](deployment/hostinger-setup.md)
- [ICMG Demo Script](deployment/icmg-presentation.md)
- [Dograh Docs](https://docs.dograh.com)

## License

- Dograh: BSD 2-Clause
- GenuineStack Japan configuration: MIT (this repo)

## Success Criteria (ICMG Demo)

- [ ] Dograh deployed on Hostinger KVM2
- [ ] TBIS agent speaks fluent Japanese (Keigo)
- [ ] TBIS agent speaks fluent English
- [ ] Language auto-detection works
- [ ] Knowledge base answers admissions questions
- [ ] Escalation to human works
- [ ] Dashboard shows call logs/transcripts
- [ ] Demo ready for Mr. Segawa (ICMG CFO)
