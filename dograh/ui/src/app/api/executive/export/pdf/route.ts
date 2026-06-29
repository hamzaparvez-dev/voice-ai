import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side PDF export for executive KPI reports.
 * Returns a minimal valid PDF document (no external PDF library required).
 */
export const runtime = 'nodejs';

interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

interface ExecutivePayload {
  start_date: string;
  end_date: string;
  timezone: string;
  metrics: Record<string, number>;
  sentiment_distribution: DistributionItem[];
  intent_distribution: DistributionItem[];
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildMinimalPdf(lines: string[]): Uint8Array {
  const contentLines = ['BT', '/F1 10 Tf', '50 780 Td'];
  lines.forEach((line, index) => {
    if (index > 0) {
      contentLines.push('0 -14 Td');
    }
    contentLines.push(`(${escapePdfText(line)}) Tj`);
  });
  contentLines.push('ET');
  const stream = contentLines.join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function buildPdfLines(payload: ExecutivePayload): string[] {
  const lines = [
    'GenuineStack Executive KPI Report',
    `Period: ${payload.start_date} to ${payload.end_date}`,
    `Timezone: ${payload.timezone}`,
    '',
    '--- Summary ---',
    `Total Calls: ${payload.metrics.total_calls ?? 0}`,
    `Avg Duration (s): ${payload.metrics.avg_duration_seconds ?? 0}`,
    `Escalations: ${payload.metrics.escalation_count ?? 0}`,
    `Escalation Rate (%): ${payload.metrics.escalation_rate ?? 0}`,
    `Transfers: ${payload.metrics.transfer_count ?? 0}`,
    '',
    '--- Sentiment ---',
  ];

  for (const row of payload.sentiment_distribution.slice(0, 6)) {
    lines.push(`${row.label}: ${row.count} (${row.percentage}%)`);
  }

  lines.push('', '--- Top Intents ---');
  for (const row of payload.intent_distribution.slice(0, 8)) {
    lines.push(`${row.label}: ${row.count} (${row.percentage}%)`);
  }

  lines.push('', `Generated: ${new Date().toISOString()}`);
  return lines.slice(0, 45);
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ExecutivePayload;

    if (!payload?.start_date || !payload?.end_date || !payload?.metrics) {
      return NextResponse.json({ error: 'Invalid report payload' }, { status: 400 });
    }

    const pdfBytes = buildMinimalPdf(buildPdfLines(payload));

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="genuinestack_executive_${payload.start_date}_${payload.end_date}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
