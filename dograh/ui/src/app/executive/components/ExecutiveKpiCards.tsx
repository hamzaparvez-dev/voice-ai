import { AlertTriangle, Clock, Phone, PhoneForwarded } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { ExecutiveMetrics } from '../lib/types';

interface ExecutiveKpiCardsProps {
  metrics: ExecutiveMetrics;
}

export function ExecutiveKpiCards({ metrics }: ExecutiveKpiCardsProps) {
  const cards = [
    {
      title: 'Total Calls',
      value: metrics.total_calls.toLocaleString(),
      hint: 'Voice agent sessions in period',
      icon: Phone,
    },
    {
      title: 'Avg Duration',
      value: `${metrics.avg_duration_seconds.toFixed(1)}s`,
      hint: 'Mean call length',
      icon: Clock,
    },
    {
      title: 'Escalation Rate',
      value: `${metrics.escalation_rate.toFixed(1)}%`,
      hint: `${metrics.escalation_count} escalations`,
      icon: AlertTriangle,
    },
    {
      title: 'Transfers',
      value: metrics.transfer_count.toLocaleString(),
      hint: 'Blind transfers (XFER)',
      icon: PhoneForwarded,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-cta" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
