'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

interface WellnessScoreProps {
  score: number;
}

export function WellnessScore({ score }: WellnessScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const increment = score / 60;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, 20);

    return () => clearInterval(timer);
  }, [score]);

  return (
    <GlassCard className="col-span-1 md:col-span-2">
      <div className="flex flex-col items-center justify-center py-8">
        <h3 className="text-lg font-semibold text-foreground/70 mb-4">Wellness Score</h3>
        
        {/* Animated circle */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-6">
          <svg className="absolute w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="rgba(212, 51, 255, 0.2)"
              strokeWidth="4"
            />
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="4"
              strokeDasharray={`${(displayScore / 100) * 377} 377`}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d433ff" />
                <stop offset="100%" stopColor="#00f0ff" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="text-center">
            <div className="text-5xl font-bold neon-glow-purple">{displayScore}</div>
            <div className="text-sm text-foreground/50 mt-1">/ 100</div>
          </div>
        </div>

        <p className="text-sm text-foreground/60 text-center max-w-xs">
          Your overall health score based on sleep, mood, and activity
        </p>
      </div>
    </GlassCard>
  );
}
