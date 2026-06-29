'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { EXECUTIVE_CHART_COLORS } from '../lib/executiveTheme';
import type { DailyVolumePoint } from '../lib/types';

interface EscalationTrendChartProps {
  data: DailyVolumePoint[];
}

export function EscalationTrendChart({ data }: EscalationTrendChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: point.date.slice(5),
  }));

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Call Volume & Escalations</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            No daily volume data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(_label, payload) =>
                  payload?.[0]?.payload?.date ?? ''
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="calls"
                name="Total Calls"
                stroke={EXECUTIVE_CHART_COLORS.blue}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="escalations"
                name="Escalations"
                stroke={EXECUTIVE_CHART_COLORS.primary}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
