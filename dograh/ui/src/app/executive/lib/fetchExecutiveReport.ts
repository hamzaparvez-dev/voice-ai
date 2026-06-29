import type { ExecutiveReport, ExecutiveReportParams } from './types';

export async function fetchExecutiveReport(
  params: ExecutiveReportParams
): Promise<ExecutiveReport> {
  const search = new URLSearchParams({
    start_date: params.startDate,
    end_date: params.endDate,
    timezone: params.timezone,
  });

  if (params.workflowId !== undefined) {
    search.set('workflow_id', String(params.workflowId));
  }

  const response = await fetch(
    `/api/v1/organizations/reports/executive?${search.toString()}`,
    { credentials: 'include' }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Executive report failed (${response.status})`);
  }

  return response.json() as Promise<ExecutiveReport>;
}
