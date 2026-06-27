# ICMG Demo Presentation Guide

Talking points for the GenuineStack Japan / TBIS demo meeting with ICMG (Mr. Segawa, CFO).

## Opening (2 min)

> "Today we demonstrate GenuineStack Japan — a production-ready, self-hosted AI voice agent platform built on Dograh, the open-source alternative to Vapi and Retell. This demo shows how TBIS (Tokyo Bay International School) can handle bilingual admissions inquiries with full data residency on Japanese infrastructure."

## Strategic Alignment with Kawamaru-san's Requirements (3 min)

| Requirement | Demo Proof Point |
|-------------|------------------|
| **Low-cost customization** | Show workflow editor — drag-and-drop, no code |
| **Any system environment** | Self-hosted on Hostinger KVM2 (~$10-15/mo) |
| **Flexible implementation** | Start with voice, expand to CRM/RAG later |
| **No vendor lock-in** | BSD 2-Clause open source — full source access |
| **Data residency (APPI)** | All data on client's server in Japan |
| **Multi-tenant** | One instance serves multiple ICMG portfolio clients |

## Live Demo Flow (10 min)

### 1. Dashboard Overview (1 min)
- Open `http://your-server:3010`
- Show clean UI, call logs, analytics

### 2. Workflow Builder (2 min)
- Open TBIS Bilingual Agent workflow
- Show visual graph: Greeting → Intent routing → Admissions/Curriculum/Fees/Facilities → Escalation → End
- Highlight: no-code, rapid iteration

### 3. English Web Call (2 min)
- Click **Web Call**
- Ask: "What are the admission requirements for Grade 5?"
- Show accurate KB-backed response
- Ask: "How much is tuition for middle school?"
- Show fee information from knowledge base

### 4. Japanese Web Call with Keigo (2 min)
- Switch to Japanese: "入学の手続きについて教えてください"
- Verify です/ます form and polite tone
- Ask: "カリキュラムについて教えてください"
- Show IB programme explanation in Japanese

### 5. Escalation Demo (1 min)
- Ask something complex: "Can you check my application status for Tanaka?"
- Show graceful transfer message in both languages

### 6. Knowledge Base (1 min)
- Show uploaded documents: admissions FAQ, curriculum, fees, facilities
- Explain RAG: documents chunked, embedded, retrieved in real-time

### 7. Call Logs & Analytics (1 min)
- Show transcript, extracted variables (intent, language, grade)
- Mention CRM webhook integration point

## Technical Architecture (3 min)

```
Caller → WebRTC/Twilio → Dograh API → LLM + RAG
                              ↓
                    PostgreSQL + pgvector
                    Redis + MinIO (recordings)
                              ↓
                    Dashboard (analytics, logs)
```

**Key points:**
- Zero STT/TTS cost with built-in stack (faster-whisper, Piper/Kokoro)
- BYOK for LLM — use OpenAI, Anthropic, or local models
- Docker Compose — one command deploy
- Modular: add CRM webhooks, Kintone, Sansan integration later

## Cost Comparison (2 min)

| | Dograh (Self-Hosted) | Retell AI (SaaS) |
|---|---|---|
| License | Free (BSD) | Proprietary |
| Infrastructure | ~$10-15/mo | N/A |
| Per-minute fees | $0 | ~$0.07-0.15/min |
| STT/TTS | Free (built-in) | Included in fee |
| Data residency | Your server | Their cloud |
| Customization | Full source | None |

**Example:** 1,000 minutes/month on Retell ≈ $70-150/mo vs. $10-15/mo self-hosted + LLM API costs.

## APPI / Compliance (1 min)

- All data on client's Hostinger server in Japan
- Recording consent built into workflow
- HTTPS encryption, audit logs
- No third-party data sharing (unless BYOK LLM chosen)
- Right to access/delete — client controls all data

## Expansion Roadmap (2 min)

| Phase | Module | Timeline |
|-------|--------|----------|
| 1 | Voice agent (TBIS demo) | Now |
| 2 | CRM integration (Kintone/Sansan) | 2-4 weeks |
| 3 | Multi-tenant for ICMG portfolio | 4-6 weeks |
| 4 | Analytics dashboard + reporting | 6-8 weeks |

## Q&A Preparation

**Q: Can we use our own LLM?**
A: Yes — BYOK supports OpenAI, Anthropic, Google, local models via Ollama.

**Q: Does it work with phone calls, not just web?**
A: Yes — Twilio, Vonage, Telnyx integration for real phone numbers.

**Q: How hard is it to add a new client/school?**
A: Duplicate workflow, upload new KB docs, publish. Under 30 minutes.

**Q: What about Japanese speech recognition quality?**
A: Built-in faster-whisper supports Japanese; Deepgram/Sarvam also available as BYOK.

**Q: Can we integrate with Kintone?**
A: Yes — webhook nodes call any REST API including Kintone.

## Success Criteria Checklist

| Criteria | Status |
|----------|--------|
| Dograh deployed on Hostinger KVM2 | ☐ |
| TBIS agent speaks fluent Japanese (Keigo) | ☐ |
| TBIS agent speaks fluent English | ☐ |
| Language auto-detection works | ☐ |
| Knowledge base answers admissions questions | ☐ |
| Escalation to human works | ☐ |
| Dashboard shows call logs/transcripts | ☐ |
| Demo ready for Mr. Segawa | ☐ |

## Closing (1 min)

> "GenuineStack Japan delivers enterprise-grade bilingual voice AI with full data control, zero vendor lock-in, and a fraction of SaaS costs. We're ready to co-create with ICMG — starting with TBIS and expanding across your portfolio."
