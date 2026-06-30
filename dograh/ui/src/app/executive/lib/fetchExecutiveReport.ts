import { client } from '@/client/client.gen';
import { detailFromError } from '@/lib/apiError';

import type { ExecutiveReport, ExecutiveReportParams } from './types';

export async function fetchExecutiveReport(
  params: ExecutiveReportParams
): Promise<ExecutiveReport> {
  const response = await client.get({
    url: '/api/v1/organizations/reports/executive',
    query: {
      start_date: params.startDate,
      end_date: params.endDate,
      timezone: params.timezone,
      ...(params.workflowId !== undefined && { workflow_id: params.workflowId }),
    },
  });

  if (response.error) {
    throw new Error(detailFromError(response.error, 'Executive report failed'));
  }

  return response.data as ExecutiveReport;
}
