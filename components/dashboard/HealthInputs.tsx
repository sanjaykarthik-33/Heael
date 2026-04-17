'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

export function HealthInputs() {
  const [mood, setMood] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [activity, setActivity] = useState(30);

  const moodEmojis = ['😢', '😔', '😐', '🙂', '😊', '😄', '😄', '😍', '🤩', '🤩'];

  return (
    <GlassCard className="col-span-1 md:col-span-2">
      <h3 className="text-lg font-semibold text-foreground mb-6">Today&apos;s Health</h3>

      <div className="space-y-6">
        {/* Mood */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground/70">Mood</label>
            <span className="text-2xl">{moodEmojis[mood - 1]}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="text-xs text-foreground/50 mt-1">{mood} / 10</div>
        </div>

        {/* Sleep */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground/70">Sleep Hours</label>
            <span className="text-sm text-primary">{sleep.toFixed(1)}h</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={sleep}
            onChange={(e) => setSleep(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
          />
        </div>

        {/* Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground/70">Activity Minutes</label>
            <span className="text-sm text-secondary">{activity} min</span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            step="5"
            value={activity}
            onChange={(e) => setActivity(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
          />
        </div>

        <button className="w-full mt-4 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all duration-300">
          Log Data
        </button>
      </div>
    </GlassCard>
  );
}
