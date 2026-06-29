'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { DURATION_COLORS } from '../lib/executiveTheme';
import type { DurationBucket } from '../lib/types';

interface ExecutiveDurationChartProps {
  data: DurationBucket[];
}

export function ExecutiveDurationChart({ data }: ExecutiveDurationChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    label: `${item.bucket}s`,
    fill: DURATION_COLORS[item.bucket] ?? '#6b7280',
  }));

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Duration Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {data.every((d) => d.count === 0) ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            No duration data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number, _name, item) => [
                  `${value} calls (${item.payload.percentage}%)`,
                  'Count',
                ]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.bucket} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
