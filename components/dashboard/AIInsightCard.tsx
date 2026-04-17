'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { AIInsight } from '@/lib/types';

interface AIInsightCardProps {
  insight: AIInsight;
}

export function AIInsightCard({ insight }: AIInsightCardProps) {
  const bgColor = {
    low: 'border-secondary/30',
    medium: 'border-accent/30',
    high: 'border-destructive/50',
  };

  const textColor = {
    low: 'text-secondary',
    medium: 'text-accent',
    high: 'text-destructive',
  };

  return (
    <GlassCard className={`border-l-4 ${bgColor[insight.priority]}`}>
      <div className="flex gap-4">
        <div className="text-3xl flex-shrink-0">{insight.icon}</div>
        <div className="flex-1">
          <h4 className={`font-semibold mb-1 ${textColor[insight.priority]}`}>
            {insight.title}
          </h4>
          <p className="text-sm text-foreground/70">{insight.message}</p>
        </div>
      </div>
    </GlassCard>
  );
}
