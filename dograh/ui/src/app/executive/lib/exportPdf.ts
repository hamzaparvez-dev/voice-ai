import type { ExecutiveReport } from './types';

function formatMetricLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildPdfHtml(report: ExecutiveReport): string {
  const metricsRows = Object.entries(report.metrics)
    .map(
      ([key, value]) =>
        `<tr><td>${formatMetricLabel(key)}</td><td>${value}</td></tr>`
    )
    .join('');

  const sentimentRows = report.sentiment_distribution
    .map(
      (r) =>
        `<tr><td>${r.label}</td><td>${r.count}</td><td>${r.percentage}%</td></tr>`
    )
    .join('');

  const intentRows = report.intent_distribution
    .map(
      (r) =>
        `<tr><td>${r.label}</td><td>${r.count}</td><td>${r.percentage}%</td></tr>`
    )
    .join('');

  const runRows = report.runs
    .slice(0, 50)
    .map(
      (r) =>
        `<tr>
          <td>${r.run_id}</td>
          <td>${r.workflow_name}</td>
          <td>${r.sentiment}</td>
          <td>${r.intent}</td>
          <td>${r.escalated ? 'Yes' : 'No'}</td>
          <td>${r.duration_seconds}s</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>GenuineStack Executive Report</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; color: #1e293b; margin: 40px; }
    h1 { color: #0f172a; font-size: 22px; margin-bottom: 4px; }
    h2 { color: #334155; font-size: 14px; margin-top: 28px; border-bottom: 2px solid #F0AA46; padding-bottom: 4px; }
    .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
    th { background: #f8fafc; text-align: left; padding: 8px; border: 1px solid #e2e8f0; }
    td { padding: 8px; border: 1px solid #e2e8f0; }
    .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>GenuineStack Executive KPI Report</h1>
  <p class="meta">
    Period: ${report.start_date} — ${report.end_date}<br/>
    Timezone: ${report.timezone}<br/>
    Generated: ${new Date().toISOString()}
  </p>

  <h2>Summary Metrics</h2>
  <table>
    <thead><tr><th>Metric</th><th>Value</th></tr></thead>
    <tbody>${metricsRows}</tbody>
  </table>

  <h2>Sentiment Distribution</h2>
  <table>
    <thead><tr><th>Sentiment</th><th>Count</th><th>%</th></tr></thead>
    <tbody>${sentimentRows || '<tr><td colspan="3">No data</td></tr>'}</tbody>
  </table>

  <h2>Top Intents</h2>
  <table>
    <thead><tr><th>Intent</th><th>Count</th><th>%</th></tr></thead>
    <tbody>${intentRows || '<tr><td colspan="3">No data</td></tr>'}</tbody>
  </table>

  <h2>Recent Calls (max 50)</h2>
  <table>
    <thead>
      <tr>
        <th>Run ID</th><th>Workflow</th><th>Sentiment</th>
        <th>Intent</th><th>Escalated</th><th>Duration</th>
      </tr>
    </thead>
    <tbody>${runRows || '<tr><td colspan="6">No calls</td></tr>'}</tbody>
  </table>

  <p class="footer">GenuineStack Japan — Self-hosted enterprise voice AI</p>
</body>
</html>`;
}

/** Client-side: opens print dialog (Save as PDF) with formatted report */
export function printExecutivePdf(report: ExecutiveReport): void {
  const html = buildPdfHtml(report);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Popup blocked — allow popups to export PDF');
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

/** Client-side: download HTML report (fallback when print unavailable) */
export function downloadExecutiveHtml(report: ExecutiveReport): void {
  const html = buildPdfHtml(report);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `genuinestack_executive_${report.start_date}_${report.end_date}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Server-assisted PDF export via Next.js API route */
export async function downloadExecutivePdf(report: ExecutiveReport): Promise<void> {
  const response = await fetch('/api/executive/export/pdf', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    throw new Error(`PDF export failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `genuinestack_executive_${report.start_date}_${report.end_date}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
