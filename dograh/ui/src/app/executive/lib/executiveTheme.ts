/** GenuineStack executive dashboard chart palette */
export const EXECUTIVE_CHART_COLORS = {
  primary: '#F0AA46',
  primaryDark: '#D8942E',
  blue: '#3b82f6',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#64748b',
  grid: 'rgba(148, 163, 184, 0.15)',
} as const;

export const SENTIMENT_COLORS: Record<string, string> = {
  positive: EXECUTIVE_CHART_COLORS.emerald,
  neutral: EXECUTIVE_CHART_COLORS.blue,
  negative: EXECUTIVE_CHART_COLORS.amber,
  frustrated: EXECUTIVE_CHART_COLORS.rose,
};

export const DURATION_COLORS: Record<string, string> = {
  '0-10': '#dcfce7',
  '10-30': '#bbf7d0',
  '30-60': '#86efac',
  '60-120': '#4ade80',
  '120-180': '#22c55e',
  '>180': '#16a34a',
};

export const INTENT_COLORS = [
  EXECUTIVE_CHART_COLORS.primary,
  EXECUTIVE_CHART_COLORS.blue,
  EXECUTIVE_CHART_COLORS.emerald,
  EXECUTIVE_CHART_COLORS.violet,
  EXECUTIVE_CHART_COLORS.amber,
  EXECUTIVE_CHART_COLORS.rose,
  EXECUTIVE_CHART_COLORS.slate,
];
