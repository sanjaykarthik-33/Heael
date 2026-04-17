import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { getSession } from 'next-auth/react';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get session
    const session = await getSession({ req: request });
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mood, sleepHours, activity } = body;

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
    if (activity !== undefined) user.activity = activity;

    // Calculate wellness score
    user.wellnessScore = Math.round(
      (user.mood * 0.4 + (user.sleepHours / 24) * 100 * 0.3 + (user.activity / 24) * 100 * 0.3)
    );

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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating health data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getSession({ req: request });
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
