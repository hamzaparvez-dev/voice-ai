export interface ExecutiveMetrics {
  total_calls: number;
  avg_duration_seconds: number;
  escalation_count: number;
  escalation_rate: number;
  transfer_count: number;
}

export interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

export interface DurationBucket {
  bucket: string;
  count: number;
  percentage: number;
}

export interface DailyVolumePoint {
  date: string;
  calls: number;
  escalations: number;
}

export interface ExecutiveRunRow {
  run_id: number;
  workflow_id: number;
  workflow_name: string;
  created_at: string;
  duration_seconds: number;
  sentiment: string;
  intent: string;
  escalated: boolean;
  disposition: string;
  phone_number: string;
}

export interface ExecutiveReport {
  start_date: string;
  end_date: string;
  timezone: string;
  workflow_id: number | null;
  metrics: ExecutiveMetrics;
  sentiment_distribution: DistributionItem[];
  intent_distribution: DistributionItem[];
  duration_distribution: DurationBucket[];
  daily_volume: DailyVolumePoint[];
  runs: ExecutiveRunRow[];
}

export interface ExecutiveReportParams {
  startDate: string;
  endDate: string;
  timezone: string;
  workflowId?: number;
}
