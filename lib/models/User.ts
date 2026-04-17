import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: String,
    image: String,
    wellnessScore: {
      type: Number,
      default: 0,
    },
    mood: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    sleepHours: {
      type: Number,
      default: 7,
      min: 0,
      max: 24,
    },
    activity: {
      type: Number,
      default: 0,
      min: 0,
      max: 24,
    },
    healthMetrics: [
      {
        date: Date,
        mood: Number,
        sleepHours: Number,
        activity: Number,
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
