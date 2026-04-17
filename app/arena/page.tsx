'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { leaderboard, weeklyChallenges } from '@/lib/mockData';
import { Medal, TrendingUp, Clock } from 'lucide-react';

export default function ArenaPage() {
  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-in">
          <h1 className="text-4xl font-bold mb-2">Wellness Arena</h1>
          <p className="text-foreground/60">Compete with others and climb the leaderboard</p>
        </div>

        {/* Main Leaderboard */}
        <GlassCard className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Medal className="w-6 h-6 text-primary" />
            Wellness Leaderboard
          </h2>

          <div className="overflow-x-auto">
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    entry.isCurrentUser
                      ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/50 neon-border-purple'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-lg">
                      #{entry.rank}
                    </div>
                    <div className="text-2xl">{entry.avatar}</div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        entry.isCurrentUser ? 'text-primary' : 'text-foreground'
                      }`}>
                        {entry.name}
                        {entry.isCurrentUser && <span className="text-xs ml-2 text-secondary">(You)</span>}
                      </h3>
                      <p className="text-sm text-foreground/50">Weekly member</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        entry.weeklyTrend > 0 ? 'text-secondary' : entry.weeklyTrend < 0 ? 'text-destructive' : 'text-foreground/50'
                      }`}>
                        {entry.weeklyTrend > 0 ? '+' : ''}{entry.weeklyTrend}%
                      </div>
                      <p className="text-xs text-foreground/50">Weekly trend</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold neon-glow-cyan">{entry.score}</div>
                      <p className="text-xs text-foreground/50">Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Weekly Challenges */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Weekly Challenges</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {weeklyChallenges.map((challenge) => {
              const progress = (challenge.current / challenge.goal) * 100;
              const daysLeft = Math.ceil(
                (challenge.endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
              );

              return (
                <GlassCard key={challenge.id}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{challenge.title}</h3>
                      <p className="text-sm text-foreground/60">{challenge.description}</p>
                    </div>
                    <div className="text-2xl">🎯</div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground/70">
                        {challenge.current} / {challenge.goal} {challenge.unit}
                      </span>
                      <span className="text-sm font-semibold text-secondary">{Math.floor(progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm text-foreground/60">
                      <Clock className="w-4 h-4" />
                      {daysLeft} days left
                    </div>
                    <div className="text-sm font-semibold text-accent">+{challenge.reward} pts</div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Motivation Card */}
        <GlassCard className="bg-gradient-to-r from-primary/10 to-secondary/10 border-l-4 border-primary">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🔥</div>
            <div>
              <h3 className="text-lg font-bold text-primary mb-2">Keep That Streak Going!</h3>
              <p className="text-foreground/70 mb-4">
                You&apos;re on a 12-day wellness streak. That&apos;s amazing progress! Continue logging your daily health metrics to stay at the top of the leaderboard.
              </p>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all">
                View My Streak
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
