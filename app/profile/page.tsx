'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { currentUser, healthMetrics } from '@/lib/mockData';
import { Calendar, Mail, TrendingUp, Award } from 'lucide-react';

export default function ProfilePage() {
  const avgMood = (healthMetrics.reduce((sum, m) => sum + m.mood, 0) / healthMetrics.length).toFixed(1);
  const avgSleep = (healthMetrics.reduce((sum, m) => sum + m.sleepHours, 0) / healthMetrics.length).toFixed(1);
  const totalActivity = healthMetrics.reduce((sum, m) => sum + m.activityMinutes, 0);

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-in">
          <h1 className="text-4xl font-bold mb-2">Your Profile</h1>
          <p className="text-foreground/60">Your wellness journey and achievements</p>
        </div>

        {/* Profile Header Card */}
        <GlassCard className="mb-8 neon-border-cyan">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl flex-shrink-0">
              {currentUser.avatar}
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground mb-2">{currentUser.name}</h2>
              <div className="space-y-1 mb-4">
                <div className="flex items-center gap-2 text-foreground/60">
                  <Mail className="w-4 h-4" />
                  {currentUser.email}
                </div>
                <div className="flex items-center gap-2 text-foreground/60">
                  <Calendar className="w-4 h-4" />
                  Member since {currentUser.joinDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <button className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all">
                Edit Profile
              </button>
            </div>

            <div className="text-right">
              <div className="text-4xl font-bold neon-glow-purple mb-2">{currentUser.wellnessScore}</div>
              <p className="text-sm text-foreground/60">Wellness Score</p>
            </div>
          </div>
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard>
            <div className="text-center py-6">
              <div className="text-4xl mb-3">😊</div>
              <p className="text-foreground/60 text-sm mb-2">Average Mood</p>
              <p className="text-3xl font-bold neon-glow-purple">{avgMood}</p>
              <p className="text-xs text-foreground/50 mt-2">/ 10</p>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center py-6">
              <div className="text-4xl mb-3">😴</div>
              <p className="text-foreground/60 text-sm mb-2">Average Sleep</p>
              <p className="text-3xl font-bold neon-glow-cyan">{avgSleep}</p>
              <p className="text-xs text-foreground/50 mt-2">hours</p>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🏃</div>
              <p className="text-foreground/60 text-sm mb-2">Total Activity</p>
              <p className="text-3xl font-bold text-accent">{totalActivity}</p>
              <p className="text-xs text-foreground/50 mt-2">minutes</p>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🔥</div>
              <p className="text-foreground/60 text-sm mb-2">Current Streak</p>
              <p className="text-3xl font-bold text-secondary">12</p>
              <p className="text-xs text-foreground/50 mt-2">days</p>
            </div>
          </GlassCard>
        </div>

        {/* Achievements */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Achievements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '🌟', label: 'First Week', description: 'Completed first week' },
              { emoji: '💪', label: 'Strong Start', description: '30-day streak' },
              { emoji: '🧘', label: 'Zen Master', description: '10 meditations' },
              { emoji: '🎯', label: 'Goal Getter', description: 'Hit all weekly goals' },
              { emoji: '⚡', label: 'Energy Boost', description: '5K steps daily' },
              { emoji: '🏆', label: 'Top Performer', description: 'Top 5 leaderboard' },
              { emoji: '🌱', label: 'Growth Mindset', description: 'Improved for 4 weeks' },
              { emoji: '❤️', label: 'Heart Healthy', description: 'Perfect BP reading' },
            ].map((achievement, idx) => (
              <GlassCard key={idx} className="flex flex-col items-center justify-center py-6">
                <div className="text-4xl mb-3">{achievement.emoji}</div>
                <h3 className="font-semibold text-foreground text-center text-sm mb-1">{achievement.label}</h3>
                <p className="text-xs text-foreground/50 text-center">{achievement.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Settings Section */}
        <GlassCard>
          <h3 className="text-lg font-bold text-foreground mb-4">Settings</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors">
              <span className="text-foreground/70">Privacy Settings</span>
              <span className="text-foreground/50">›</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors">
              <span className="text-foreground/70">Notification Preferences</span>
              <span className="text-foreground/50">›</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors">
              <span className="text-foreground/70">Data & Privacy</span>
              <span className="text-foreground/50">›</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors border-t border-white/10">
              <span className="text-destructive">Sign Out</span>
              <span className="text-foreground/50">›</span>
            </button>
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
