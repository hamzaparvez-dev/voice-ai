import type { ExecutiveReport } from './types';

function escapeCsvCell(value: string | number | boolean): string {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

export function buildExecutiveCsv(report: ExecutiveReport): string {
  const lines: string[] = [];

  lines.push('GenuineStack Executive KPI Export');
  lines.push(`Period,${report.start_date} to ${report.end_date}`);
  lines.push(`Timezone,${report.timezone}`);
  lines.push('');

  lines.push('Summary Metrics');
  lines.push('Metric,Value');
  lines.push(`Total Calls,${report.metrics.total_calls}`);
  lines.push(`Avg Duration (seconds),${report.metrics.avg_duration_seconds}`);
  lines.push(`Escalation Count,${report.metrics.escalation_count}`);
  lines.push(`Escalation Rate (%),${report.metrics.escalation_rate}`);
  lines.push(`Transfer Count,${report.metrics.transfer_count}`);
  lines.push('');

  lines.push('Sentiment Distribution');
  lines.push('Sentiment,Count,Percentage');
  for (const row of report.sentiment_distribution) {
    lines.push(
      [row.label, row.count, row.percentage].map(escapeCsvCell).join(',')
    );
  }
  lines.push('');

  lines.push('Intent Distribution');
  lines.push('Intent,Count,Percentage');
  for (const row of report.intent_distribution) {
    lines.push(
      [row.label, row.count, row.percentage].map(escapeCsvCell).join(',')
    );
  }
  lines.push('');

  lines.push('Call Detail');
  lines.push(
    [
      'Run ID',
      'Workflow',
      'Created At',
      'Duration (s)',
      'Sentiment',
      'Intent',
      'Escalated',
      'Disposition',
      'Phone',
    ].join(',')
  );

  for (const run of report.runs) {
    lines.push(
      [
        run.run_id,
        run.workflow_name,
        run.created_at,
        run.duration_seconds,
        run.sentiment,
        run.intent,
        run.escalated,
        run.disposition,
        run.phone_number,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return lines.join('\n');
}

export function downloadExecutiveCsv(report: ExecutiveReport): void {
  const csv = buildExecutiveCsv(report);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `genuinestack_executive_${report.start_date}_${report.end_date}.csv`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
