'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { EXECUTIVE_CHART_COLORS, SENTIMENT_COLORS } from '../lib/executiveTheme';
import type { DistributionItem } from '../lib/types';

interface SentimentChartProps {
  data: DistributionItem[];
}

export function SentimentChart({ data }: SentimentChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    name: item.label.charAt(0).toUpperCase() + item.label.slice(1),
    fill: SENTIMENT_COLORS[item.label] ?? EXECUTIVE_CHART_COLORS.slate,
  }));

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Sentiment Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            No sentiment data — wire extraction variable <code className="text-xs">call_sentiment</code> in workflows
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.label} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, item) => [
                  `${value} (${item.payload.percentage}%)`,
                  item.payload.name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
