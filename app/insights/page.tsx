'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { healthPatterns, healthMetrics } from '@/lib/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function InsightsPage() {
  const chartData = healthMetrics.map((metric, idx) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx] || `Day ${idx + 1}`,
    mood: metric.mood,
    stress: metric.stressLevel,
    activity: metric.activityMinutes / 10, // Scaled for visibility
  }));

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-secondary" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-destructive" />;
    return <Minus className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-in">
          <h1 className="text-4xl font-bold mb-2">Health Insights</h1>
          <p className="text-foreground/60">Discover patterns in your wellness data</p>
        </div>

        {/* Pattern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {healthPatterns.map((pattern) => (
            <GlassCard key={pattern.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{pattern.title}</h3>
                  <p className="text-sm text-foreground/60">{pattern.description}</p>
                </div>
                {getTrendIcon(pattern.trend)}
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <div className={`text-2xl font-bold ${
                  pattern.impact > 0 ? 'text-secondary' : pattern.impact < 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {pattern.impact > 0 ? '+' : ''}{pattern.impact}%
                </div>
                <p className="text-xs text-foreground/50 mt-1">Health Impact</p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Main Chart */}
        <GlassCard className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Weekly Health Overview</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 51, 255, 0.1)" />
              <XAxis 
                dataKey="day" 
                stroke="rgba(245, 245, 245, 0.5)"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="rgba(245, 245, 245, 0.5)" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(26, 26, 46, 0.9)',
                  border: '1px solid rgba(212, 51, 255, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#d433ff' }}
              />
              <Legend />
              <Bar dataKey="mood" fill="#d433ff" radius={[8, 8, 0, 0]} />
              <Bar dataKey="stress" fill="#ff006e" radius={[8, 8, 0, 0]} />
              <Bar dataKey="activity" fill="#00f0ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="text-2xl">📈</span> Top Performance Areas
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-foreground/70">Sleep consistency</span>
                <span className="text-secondary font-semibold">92%</span>
              </li>
              <li className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-foreground/70">Mood stability</span>
                <span className="text-secondary font-semibold">85%</span>
              </li>
              <li className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-foreground/70">Hydration adherence</span>
                <span className="text-secondary font-semibold">78%</span>
              </li>
            </ul>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> Areas for Improvement
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-foreground/70">Stress management</span>
                <span className="text-destructive font-semibold">62%</span>
              </li>
              <li className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-foreground/70">Daily activity goal</span>
                <span className="text-destructive font-semibold">71%</span>
              </li>
              <li className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-foreground/70">Evening routine</span>
                <span className="text-destructive font-semibold">58%</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}
