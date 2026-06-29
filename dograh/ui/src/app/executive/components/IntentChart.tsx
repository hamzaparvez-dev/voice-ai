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

import { INTENT_COLORS } from '../lib/executiveTheme';
import type { DistributionItem } from '../lib/types';

interface IntentChartProps {
  data: DistributionItem[];
}

export function IntentChart({ data }: IntentChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    displayLabel: item.label.replace(/_/g, ' '),
    fill: INTENT_COLORS[index % INTENT_COLORS.length],
  }));

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Top Intents</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            No intent data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="displayLabel"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number, _name, item) => [
                  `${value} calls (${item.payload.percentage}%)`,
                  'Count',
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.label} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
