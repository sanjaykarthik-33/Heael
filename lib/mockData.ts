import { User, HealthMetric, AIInsight, HealthPattern, LeaderboardEntry, WeeklyChallenge, RiskAlert } from './types';

export const currentUser: User = {
  id: '1',
  name: 'Alex Chen',
  email: 'alex@example.com',
  avatar: '🧑‍💼',
  wellnessScore: 78,
  averageMood: 7.5,
  averageSleep: 7.2,
  weeklyActivityMinutes: 245,
  joinDate: new Date('2023-06-15'),
};

export const healthMetrics: HealthMetric[] = [
  {
    date: new Date('2024-04-11'),
    mood: 8,
    sleepHours: 7.5,
    activityMinutes: 45,
    waterIntake: 2.1,
    stressLevel: 3,
  },
  {
    date: new Date('2024-04-12'),
    mood: 7,
    sleepHours: 6.8,
    activityMinutes: 30,
    waterIntake: 1.9,
    stressLevel: 5,
  },
  {
    date: new Date('2024-04-13'),
    mood: 9,
    sleepHours: 8.1,
    activityMinutes: 60,
    waterIntake: 2.3,
    stressLevel: 2,
  },
  {
    date: new Date('2024-04-14'),
    mood: 6,
    sleepHours: 6.2,
    activityMinutes: 25,
    waterIntake: 1.7,
    stressLevel: 7,
  },
  {
    date: new Date('2024-04-15'),
    mood: 8,
    sleepHours: 7.8,
    activityMinutes: 50,
    waterIntake: 2.2,
    stressLevel: 4,
  },
  {
    date: new Date('2024-04-16'),
    mood: 7,
    sleepHours: 7.3,
    activityMinutes: 40,
    waterIntake: 2.0,
    stressLevel: 4,
  },
  {
    date: new Date('2024-04-17'),
    mood: 8,
    sleepHours: 7.6,
    activityMinutes: 55,
    waterIntake: 2.4,
    stressLevel: 3,
  },
];

export const aiInsights: AIInsight[] = [
  {
    id: '1',
    title: 'Sleep Improvement Detected',
    message: 'Your recent sleep patterns show a 12% improvement. Keep maintaining your evening routine!',
    icon: '😴',
    priority: 'low',
    timestamp: new Date(),
  },
  {
    id: '2',
    title: 'Stress Alert',
    message: 'Your stress levels have been elevated lately. Consider meditation or a 10-minute walk.',
    icon: '⚠️',
    priority: 'high',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '3',
    title: 'Hydration Goal Achieved',
    message: 'You&apos;re staying hydrated! Keep up this healthy habit.',
    icon: '💧',
    priority: 'low',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
];

export const healthPatterns: HealthPattern[] = [
  {
    id: '1',
    title: 'Morning Exercise Boost',
    description: 'Days with morning workouts show 23% higher mood scores',
    impact: 23,
    trend: 'improving',
  },
  {
    id: '2',
    title: 'Late Night Work Risk',
    description: 'Working after 10 PM correlates with 18% lower sleep quality',
    impact: -18,
    trend: 'declining',
  },
  {
    id: '3',
    title: 'Weekend Recovery',
    description: 'Weekend rest days lead to improved stress levels on Mondays',
    impact: 15,
    trend: 'stable',
  },
];

export const leaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Jordan Kim',
    score: 92,
    avatar: '🥇',
    weeklyTrend: 5,
    isCurrentUser: false,
  },
  {
    rank: 2,
    name: 'Casey Martinez',
    score: 87,
    avatar: '🥈',
    weeklyTrend: -2,
    isCurrentUser: false,
  },
  {
    rank: 3,
    name: 'Alex Chen',
    score: 78,
    avatar: '🥉',
    weeklyTrend: 8,
    isCurrentUser: true,
  },
  {
    rank: 4,
    name: 'Sam Thompson',
    score: 75,
    avatar: '👤',
    weeklyTrend: 3,
    isCurrentUser: false,
  },
  {
    rank: 5,
    name: 'Riley Park',
    score: 72,
    avatar: '👤',
    weeklyTrend: -1,
    isCurrentUser: false,
  },
];

export const weeklyChallenges: WeeklyChallenge[] = [
  {
    id: '1',
    title: '10K Steps',
    description: 'Walk 10,000 steps daily',
    goal: 70000,
    current: 52340,
    unit: 'steps',
    reward: 150,
    endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    title: '8 Hours Sleep',
    description: 'Get 8 hours of quality sleep',
    goal: 56,
    current: 42.5,
    unit: 'hours',
    reward: 200,
    endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    title: 'Meditation Streak',
    description: 'Meditate for 10 minutes daily',
    goal: 7,
    current: 5,
    unit: 'days',
    reward: 100,
    endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
];

export const riskAlerts: RiskAlert[] = [
  {
    id: '1',
    level: 'critical',
    title: 'High Stress Detected',
    description: 'Your stress levels have been consistently high. This may impact your health.',
    recommendation: 'Try a 15-minute meditation session or speak with a wellness coach.',
    icon: '⚠️',
  },
  {
    id: '2',
    level: 'warning',
    title: 'Sleep Deficit',
    description: 'You&apos;ve been averaging 6.5 hours when 7.5 is recommended.',
    recommendation: 'Establish a consistent sleep schedule. Aim for bed by 11 PM.',
    icon: '😴',
  },
];
