'use client';

import { useState, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

interface HealthInputsProps {
  onSaved?: (data: any) => void;
}

export function HealthInputs({ onSaved }: HealthInputsProps) {
  const [mood, setMood] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [activity, setActivity] = useState(30);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const moodEmojis = ['😢', '😔', '😐', '🙂', '😊', '😄', '😄', '😍', '🤩', '🤩'];

  const saveHealthData = useCallback(async () => {
    try {
      setLoading(true);
      setMessage('');

      const response = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          sleepHours: sleep,
          activity: activity / 60, // Convert minutes to hours
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(`✗ ${data?.error || 'Failed to save health data'}`);
        return;
      }

      if (data?.saved === false || data?.dbUnavailable) {
        setMessage(`⚠ ${data?.warning || 'Saved locally only (database unavailable)'}`);
        return;
      }

      onSaved?.(data);
      setMessage('✓ Saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('✗ Failed to save');
      console.error('Error saving health data:', error);
    } finally {
      setLoading(false);
    }
  }, [mood, sleep, activity]);

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

        {message && (
          <div className={`text-sm font-medium ${
            message.includes('success') ? 'text-green-400' : 'text-red-400'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={saveHealthData}
          disabled={loading}
          className="w-full mt-4 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Log Data'}
        </button>
      </div>
    </GlassCard>
  );
}
