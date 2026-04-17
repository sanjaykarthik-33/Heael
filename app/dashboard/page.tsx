'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/layout/AppLayout';
import { WellnessScore } from '@/components/dashboard/WellnessScore';
import { HealthInputs } from '@/components/dashboard/HealthInputs';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { aiInsights } from '@/lib/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setError(null);
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Network error. Check console.');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  if (!session) {
    return <AppLayout><div className="p-4">Not signed in</div></AppLayout>;
  }

  if (loading) {
    return <AppLayout><div className="p-4">Loading your wellness data...</div></AppLayout>;
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-200">⚠️ {error}</p>
          <p className="text-sm text-red-200/70 mt-2">Make sure MONGODB_URI is added to Vercel environment variables</p>
        </div>
      </AppLayout>
    );
  }

  const chartData = (userData?.healthMetrics || []).map((metric: any) => ({
    date: new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: metric.mood,
    sleep: metric.sleepHours,
  })).slice(-7); // Last 7 days

  const stats = {
    averageMood: Number(userData?.averageMood ?? userData?.mood ?? 0),
    averageSleep: Number(userData?.averageSleep ?? userData?.sleepHours ?? 0),
    weeklyActivityMinutes: Number(userData?.weeklyActivityMinutes ?? userData?.activity ?? 0),
    memberSinceYear: userData?.createdAt
      ? new Date(userData.createdAt).getFullYear()
      : new Date().getFullYear(),
  };

  return (
    <AppLayout>
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 md:mb-8 animate-slide-in">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">
            Welcome back, <span className="neon-glow-purple">{session.user?.name || 'User'}</span>
          </h1>
          <p className="text-sm md:text-base text-foreground/60">Let&apos;s check on your wellness journey</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <WellnessScore score={userData?.wellnessScore || 0} />
          <HealthInputs />
        </div>

        {/* AI Insights */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">AI Insights</h2>
          <div className="space-y-3 md:space-y-4">
            {aiInsights.slice(0, 3).map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Mood Trend */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-foreground mb-4">Mood Trend (7 days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 51, 255, 0.1)" />
                <XAxis 
                  dataKey="date" 
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
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#d433ff"
                  strokeWidth={2}
                  dot={{ fill: '#d433ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Sleep Trend */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-foreground mb-4">Sleep Hours (7 days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 217, 255, 0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(245, 245, 245, 0.5)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="rgba(245, 245, 245, 0.5)" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(26, 26, 46, 0.9)',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#00d9ff' }}
                />
                <Line
                  type="monotone"
                  dataKey="sleep"
                  stroke="#00d9ff"
                  strokeWidth={2}
                  dot={{ fill: '#00d9ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard>
            <div className="text-center py-4">
              <p className="text-foreground/60 text-sm mb-2">Avg Mood</p>
              <p className="text-2xl font-bold neon-glow-purple">{stats.averageMood.toFixed(1)}</p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="text-center py-4">
              <p className="text-foreground/60 text-sm mb-2">Avg Sleep</p>
              <p className="text-2xl font-bold neon-glow-cyan">{stats.averageSleep.toFixed(1)}h</p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="text-center py-4">
              <p className="text-foreground/60 text-sm mb-2">Weekly Activity</p>
              <p className="text-2xl font-bold text-accent">{stats.weeklyActivityMinutes} min</p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="text-center py-4">
              <p className="text-foreground/60 text-sm mb-2">Member Since</p>
              <p className="text-lg font-bold text-secondary">{stats.memberSinceYear}</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}
