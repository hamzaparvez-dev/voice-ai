from collections import Counter
from datetime import datetime, time, timedelta
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

from api.db import db_client

SENTIMENT_KEYS = ("call_sentiment", "sentiment", "caller_sentiment")
INTENT_KEYS = ("caller_intent", "learner_intent", "intent")
ESCALATION_DISPOSITIONS = {"XFER", "TRANSFER", "ESCALATED"}


def _extract_sentiment(gathered_context: Optional[Dict[str, Any]]) -> str:
    if not gathered_context:
        return "neutral"
    for key in SENTIMENT_KEYS:
        value = gathered_context.get(key)
        if value:
            normalized = str(value).strip().lower()
            if normalized in {"positive", "neutral", "negative", "frustrated"}:
                return normalized
    return "neutral"


def _extract_intent(gathered_context: Optional[Dict[str, Any]]) -> str:
    if not gathered_context:
        return "unknown"
    for key in INTENT_KEYS:
        value = gathered_context.get(key)
        if value:
            return str(value).strip().lower().replace(" ", "_")
    return "unknown"


def _is_escalation(gathered_context: Optional[Dict[str, Any]]) -> bool:
    if not gathered_context:
        return False
    disposition = str(
        gathered_context.get("mapped_call_disposition", "")
    ).upper()
    if disposition in ESCALATION_DISPOSITIONS:
        return True
    escalated = gathered_context.get("escalated")
    if escalated in (True, "true", "True", "yes", "Yes"):
        return True
    tags = gathered_context.get("call_tags") or []
    if isinstance(tags, list):
        lowered = {str(t).lower() for t in tags}
        if lowered & {"escalation", "escalated", "human_transfer"}:
            return True
    return False


def _duration_seconds(usage_info: Optional[Dict[str, Any]]) -> float:
    if not usage_info:
        return 0.0
    raw = usage_info.get("call_duration_seconds", 0)
    try:
        return float(raw)
    except (TypeError, ValueError):
        return 0.0


class ExecutiveReportService:
    async def get_executive_report(
        self,
        organization_id: int,
        start_date: str,
        end_date: str,
        timezone: str,
        workflow_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        tz = ZoneInfo(timezone)
        start_obj = datetime.strptime(start_date, "%Y-%m-%d")
        end_obj = datetime.strptime(end_date, "%Y-%m-%d")

        if end_obj < start_obj:
            raise ValueError("end_date must be on or after start_date")

        start_dt = datetime.combine(start_obj, time.min, tzinfo=tz)
        end_dt = datetime.combine(end_obj, time.max, tzinfo=tz)
        start_utc = start_dt.astimezone(ZoneInfo("UTC"))
        end_utc = end_dt.astimezone(ZoneInfo("UTC"))

        runs = await db_client.get_workflow_runs_for_executive_report(
            organization_id=organization_id,
            start_utc=start_utc,
            end_utc=end_utc,
            workflow_id=workflow_id,
        )

        total_calls = len(runs)
        durations: List[float] = []
        sentiment_counts: Counter[str] = Counter()
        intent_counts: Counter[str] = Counter()
        escalation_count = 0
        transfer_count = 0
        daily_counts: Counter[str] = Counter()
        daily_escalations: Counter[str] = Counter()

        duration_buckets = {
            "0-10": 0,
            "10-30": 0,
            "30-60": 0,
            "60-120": 0,
            "120-180": 0,
            ">180": 0,
        }

        run_rows: List[Dict[str, Any]] = []

        for run in runs:
            ctx = run.get("gathered_context") or {}
            usage = run.get("usage_info") or {}
            duration = _duration_seconds(usage)
            durations.append(duration)

            sentiment = _extract_sentiment(ctx)
            intent = _extract_intent(ctx)
            sentiment_counts[sentiment] += 1
            intent_counts[intent] += 1

            escalated = _is_escalation(ctx)
            if escalated:
                escalation_count += 1

            disposition = str(ctx.get("mapped_call_disposition", "")).upper()
            if disposition == "XFER":
                transfer_count += 1

            created_at = run["created_at"]
            if isinstance(created_at, datetime):
                day_key = created_at.astimezone(tz).strftime("%Y-%m-%d")
            else:
                day_key = str(created_at)[:10]
            daily_counts[day_key] += 1
            if escalated:
                daily_escalations[day_key] += 1

            if duration < 10:
                duration_buckets["0-10"] += 1
            elif duration < 30:
                duration_buckets["10-30"] += 1
            elif duration < 60:
                duration_buckets["30-60"] += 1
            elif duration < 120:
                duration_buckets["60-120"] += 1
            elif duration < 180:
                duration_buckets["120-180"] += 1
            else:
                duration_buckets[">180"] += 1

            run_rows.append(
                {
                    "run_id": run["id"],
                    "workflow_id": run["workflow_id"],
                    "workflow_name": run["workflow_name"],
                    "created_at": run["created_at"].isoformat()
                    if isinstance(run["created_at"], datetime)
                    else str(run["created_at"]),
                    "duration_seconds": round(duration, 1),
                    "sentiment": sentiment,
                    "intent": intent,
                    "escalated": escalated,
                    "disposition": disposition or "UNKNOWN",
                    "phone_number": ctx.get("customer_phone_number")
                    or run.get("initial_context", {}).get("phone_number", ""),
                }
            )

        avg_duration = sum(durations) / len(durations) if durations else 0.0
        escalation_rate = (
            round(escalation_count / total_calls * 100, 2) if total_calls else 0.0
        )

        def _distribution(counter: Counter[str], limit: int = 8) -> List[Dict[str, Any]]:
            items = counter.most_common(limit)
            return [
                {
                    "label": label,
                    "count": count,
                    "percentage": round(count / total_calls * 100, 2)
                    if total_calls
                    else 0.0,
                }
                for label, count in items
            ]

        duration_total = sum(duration_buckets.values())
        duration_distribution = [
            {
                "bucket": bucket,
                "count": count,
                "percentage": round(count / duration_total * 100, 2)
                if duration_total
                else 0.0,
            }
            for bucket, count in duration_buckets.items()
        ]

        daily_volume: List[Dict[str, Any]] = []
        cursor = start_obj
        while cursor <= end_obj:
            key = cursor.strftime("%Y-%m-%d")
            daily_volume.append(
                {
                    "date": key,
                    "calls": daily_counts.get(key, 0),
                    "escalations": daily_escalations.get(key, 0),
                }
            )
            cursor += timedelta(days=1)

        return {
            "start_date": start_date,
            "end_date": end_date,
            "timezone": timezone,
            "workflow_id": workflow_id,
            "metrics": {
                "total_calls": total_calls,
                "avg_duration_seconds": round(avg_duration, 1),
                "escalation_count": escalation_count,
                "escalation_rate": escalation_rate,
                "transfer_count": transfer_count,
            },
            "sentiment_distribution": _distribution(sentiment_counts),
            "intent_distribution": _distribution(intent_counts),
            "duration_distribution": duration_distribution,
            "daily_volume": daily_volume,
            "runs": run_rows,
        }
