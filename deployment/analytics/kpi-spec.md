# GenuineStack Executive KPI Specification

Product specification for the **Executive Insights** dashboard (`/executive`) — portfolio-level KPIs for ICMG leadership and enterprise operators.

**UI route:** `dograh/ui/src/app/executive/`  
**API endpoint:** `GET /api/v1/organizations/reports/executive`  
**Kit alignment:** TBIS (`GS-KIT-EDU-TBIS-001`), ICMG L&D (`GS-KIT-TRN-ICMG-001`)

---

## 1. Purpose

Provide CFO-ready visibility into voice agent operations without exporting raw call logs:

| Audience | Need |
|----------|------|
| ICMG / portfolio leadership | Escalation rate, call volume trends, intent mix |
| GenuineStack ops | Duration distribution, transfer counts |
| Enterprise compliance | Sentiment tracking, audit-friendly exports |

---

## 2. KPI Definitions

| KPI ID | Metric | Formula | Source |
|--------|--------|---------|--------|
| **KPI-001** | Total Calls | Count of workflow runs in date range | `workflow_runs.created_at` |
| **KPI-002** | Avg Duration | Mean `call_duration_seconds` | `usage_info.call_duration_seconds` |
| **KPI-003** | Escalation Count | Runs flagged as escalated | See §3 Escalation rules |
| **KPI-004** | Escalation Rate (%) | `escalation_count / total_calls × 100` | Derived |
| **KPI-005** | Transfer Count | Runs with disposition `XFER` | `gathered_context.mapped_call_disposition` |
| **KPI-006** | Sentiment Distribution | Group by extracted sentiment | See §3 Sentiment rules |
| **KPI-007** | Top Intents | Group by extracted intent | See §3 Intent rules |
| **KPI-008** | Daily Volume | Calls per calendar day (org timezone) | Aggregated by date |
| **KPI-009** | Daily Escalations | Escalations per calendar day | Aggregated by date |

---

## 3. Data Extraction Rules

### Sentiment (KPI-006)

Read from `gathered_context` in priority order:

1. `call_sentiment`
2. `sentiment`
3. `caller_sentiment`

Valid values: `positive`, `neutral`, `negative`, `frustrated`.  
Default if absent: `neutral`.

**Workflow wiring:** ICMG kit extracts `call_sentiment` on `main-dialogue` node. TBIS kit should add the same variable for full sentiment charts.

### Intent (KPI-007)

Read from `gathered_context` in priority order:

1. `caller_intent` (TBIS)
2. `learner_intent` (ICMG L&D)
3. `intent` (generic)

Default if absent: `unknown`.

### Escalation (KPI-003)

A run is counted as escalated if **any** of:

| Rule | Condition |
|------|-----------|
| **ESC-001** | `mapped_call_disposition` ∈ `{XFER, TRANSFER, ESCALATED}` |
| **ESC-002** | `escalated` = true |
| **ESC-003** | `call_tags` contains `escalation`, `escalated`, or `human_transfer` |

Aligns with Phase 2 n8n `human-escalation` webhook and Phase 3 transfer tool config.

### Duration buckets

| Bucket | Range (seconds) |
|--------|-----------------|
| 0-10 | 0 ≤ d < 10 |
| 10-30 | 10 ≤ d < 30 |
| 30-60 | 30 ≤ d < 60 |
| 60-120 | 60 ≤ d < 120 |
| 120-180 | 120 ≤ d < 180 |
| >180 | d ≥ 180 |

---

## 4. API Contract

### Request

```
GET /api/v1/organizations/reports/executive
  ?start_date=2026-06-23
  &end_date=2026-06-29
  &timezone=Asia/Tokyo
  &workflow_id=42          (optional)
```

### Response (abbreviated)

```json
{
  "start_date": "2026-06-23",
  "end_date": "2026-06-29",
  "timezone": "Asia/Tokyo",
  "workflow_id": null,
  "metrics": {
    "total_calls": 142,
    "avg_duration_seconds": 48.3,
    "escalation_count": 7,
    "escalation_rate": 4.93,
    "transfer_count": 5
  },
  "sentiment_distribution": [
    { "label": "neutral", "count": 98, "percentage": 69.01 }
  ],
  "intent_distribution": [
    { "label": "admissions", "count": 45, "percentage": 31.69 }
  ],
  "duration_distribution": [...],
  "daily_volume": [
    { "date": "2026-06-23", "calls": 18, "escalations": 1 }
  ],
  "runs": [...]
}
```

Implementation: `dograh/api/services/reports/executive_report.py`

---

## 5. Dashboard Components

| Component | Chart Type | KPI IDs |
|-----------|------------|---------|
| `ExecutiveKpiCards` | Stat cards | KPI-001 – KPI-005 |
| `EscalationTrendChart` | Recharts LineChart | KPI-008, KPI-009 |
| `SentimentChart` | Recharts PieChart | KPI-006 |
| `IntentChart` | Recharts BarChart (horizontal) | KPI-007 |
| `ExecutiveDurationChart` | Recharts BarChart | Duration buckets |

**Styling:** GenuineStack palette — primary `#F0AA46` (cta), aligned with sidebar accent.

---

## 6. Export Framework (Task 4.2)

| Export | Module | Format |
|--------|--------|--------|
| CSV | `executive/lib/exportCsv.ts` | Client-side download — summary + distributions + call detail |
| PDF (server) | `app/api/executive/export/pdf/route.ts` | Server-generated minimal PDF via POST |
| PDF (fallback) | `executive/lib/exportPdf.ts` | Browser print dialog / HTML download |

### CSV filename pattern

```
genuinestack_executive_{start_date}_{end_date}.csv
```

### PDF filename pattern

```
genuinestack_executive_{start_date}_{end_date}.pdf
```

---

## 7. Success Thresholds (ICMG Demo)

| Threshold ID | Metric | Target | Notes |
|--------------|--------|--------|-------|
| **TH-001** | Escalation rate | < 10% | Healthy self-service |
| **TH-002** | Avg duration | 30–90s | Voice-appropriate responses |
| **TH-003** | Negative + frustrated sentiment | < 15% combined | CX quality indicator |
| **TH-004** | Top intent coverage | ≥ 3 distinct intents | Routing working |

---

## 8. Future Enhancements (Out of Phase 4 Scope)

- Cost-per-call from LLM usage tokens
- Multi-tenant portfolio rollup across orgs
- Real-time WebSocket KPI updates
- Scheduled email PDF to CFO (n8n cron)

---

## 9. Related Documentation

| Doc | Path |
|-----|------|
| Executive UI | `dograh/ui/src/app/executive/` |
| Daily reports (ops) | `dograh/ui/src/app/reports/` |
| ICMG kit variables | `kits/training-icmg/IMPORT.md` |
| TBIS kit variables | `kits/education-tbis/IMPORT.md` |
| n8n post-call flow | `deployment/automation/n8n/post-call-ticket-workflow.json` |

---

## Version

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-06-29 | Phase 4 initial KPI spec + executive dashboard |
