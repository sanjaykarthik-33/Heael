import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { mood, sleepHours, activity } = body;

    // Accept activity in either hours (preferred) or minutes (legacy payloads).
    const normalizedActivityHours =
      activity !== undefined
        ? Number(activity) > 5
          ? Number(activity) / 60
          : Number(activity)
        : undefined;

    // Find or create user
    let user = await User.findOne({ email: session.user.email });

    if (!user) {
      user = new User({
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      });
    }

    // Update health data
    if (mood !== undefined) user.mood = mood;
    if (sleepHours !== undefined) user.sleepHours = sleepHours;
    if (normalizedActivityHours !== undefined) user.activity = normalizedActivityHours;

    // Calculate wellness score
    const moodScore = Math.min(Number(user.mood) / 8, 1) * 100; // target: mood 8
    const sleepScore = Math.min(Number(user.sleepHours) / 8, 1) * 100; // target: 8h
    const activityScore = Math.min(Number(user.activity) / 1, 1) * 100; // target: 1h (60 min)

    user.wellnessScore = Math.round(moodScore * 0.4 + sleepScore * 0.3 + activityScore * 0.3);

    // Add to health metrics history
    user.healthMetrics.push({
      date: new Date(),
      mood: user.mood,
      sleepHours: user.sleepHours,
      activity: user.activity,
    });

    // Keep only last 30 days
    if (user.healthMetrics.length > 30) {
      user.healthMetrics = user.healthMetrics.slice(-30);
    }

    await user.save();

    return NextResponse.json({
      ...user.toObject(),
      saved: true,
    });
  } catch (error) {
    console.error('Error updating health data:', error);

    const reason = error instanceof Error ? error.message : 'Unknown error';
    const isDbIssue = /mongo|database|serverselection|auth/i.test(reason);

    // Return a non-throwing fallback so UI can keep working during temporary DB outages.
    return NextResponse.json({
      saved: false,
      dbUnavailable: isDbIssue,
      warning: isDbIssue
        ? `Database unavailable. ${reason}`
        : 'Failed to save health data.',
      reason,
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      // Return default data for new user
      return NextResponse.json({
        wellnessScore: 0,
        mood: 5,
        sleepHours: 7,
        activity: 0,
        healthMetrics: [],
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);

    // Fallback payload keeps dashboard usable when DB is temporarily unavailable.
    return NextResponse.json({
      wellnessScore: 0,
      mood: 5,
      sleepHours: 7,
      activity: 0,
      healthMetrics: [],
      dbUnavailable: true,
      warning: 'Using fallback data because database is unavailable.',
    });
  }
}
