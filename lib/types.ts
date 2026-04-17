export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  wellnessScore: number;
  averageMood: number;
  averageSleep: number;
  weeklyActivityMinutes: number;
  joinDate: Date;
}

export interface HealthMetric {
  date: Date;
  mood: number; // 1-10
  sleepHours: number;
  activityMinutes: number;
  waterIntake: number; // liters
  stressLevel: number; // 1-10
}

export interface AIInsight {
  id: string;
  title: string;
  message: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface HealthPattern {
  id: string;
  title: string;
  description: string;
  impact: number; // -100 to 100
  trend: 'improving' | 'declining' | 'stable';
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatar: string;
  weeklyTrend: number; // percentage change
  isCurrentUser: boolean;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  unit: string;
  reward: number;
  endsAt: Date;
}

export interface RiskAlert {
  id: string;
  level: 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  icon: string;
}
