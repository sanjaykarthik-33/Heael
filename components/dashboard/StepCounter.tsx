'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

type MotionPermissionResult = 'granted' | 'denied' | 'unsupported';

const STEP_MIN_INTERVAL_MS = 300;
const STEP_MAX_INTERVAL_MS = 2000;
const INACTIVITY_REMINDER_MS = 90000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function StepCounter() {
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [status, setStatus] = useState('Ready to track steps');
  const [distanceKm, setDistanceKm] = useState(0);
  const [calories, setCalories] = useState(0);
  const [cadenceSpm, setCadenceSpm] = useState(0);
  const [strideLengthCm, setStrideLengthCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const motionHandlerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const gravityRef = useRef<number | null>(null);
  const smoothRef = useRef(0);
  const adaptiveLevelRef = useRef(0.9);
  const lastStepAtRef = useRef(0);
  const stepTimesRef = useRef<number[]>([]);
  const isTrackingRef = useRef(false);

  const canStartTracking = strideLengthCm !== '' && weightKg !== '';

  const strideMeters = useMemo(() => {
    if (strideLengthCm === '') {
      return 0.75;
    }
    return clamp(strideLengthCm / 100, 0.35, 1.5);
  }, [strideLengthCm]);

  const updateDerivedMetrics = useCallback((nextSteps: number) => {
    const nextDistanceKm = (nextSteps * strideMeters) / 1000;
    const kcalPerKmPerKg = 0.75;
    const effectiveWeight = weightKg === '' ? 70 : weightKg;
    const nextCalories = nextDistanceKm * clamp(effectiveWeight, 30, 220) * kcalPerKmPerKg;
    setDistanceKm(nextDistanceKm);
    setCalories(nextCalories);
  }, [strideMeters, weightKg]);

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false;
    setIsTracking(false);

    if (motionHandlerRef.current) {
      window.removeEventListener('devicemotion', motionHandlerRef.current as EventListener);
      motionHandlerRef.current = null;
    }

    setStatus('Tracking stopped');
  }, []);

  const requestMotionPermission = useCallback(async (): Promise<MotionPermissionResult> => {
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
      return 'unsupported';
    }

    const motionEventWithPermission = DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof motionEventWithPermission.requestPermission === 'function') {
      try {
        const result = await motionEventWithPermission.requestPermission();
        return result === 'granted' ? 'granted' : 'denied';
      } catch {
        return 'denied';
      }
    }

    return 'granted';
  }, []);

  const startTracking = useCallback(async () => {
    setError(null);

    if (!canStartTracking) {
      setError('Please enter stride length and weight before starting step tracking.');
      return;
    }

    const permission = await requestMotionPermission();
    if (permission === 'unsupported') {
      setError('Motion sensor is not supported on this browser/device.');
      return;
    }
    if (permission === 'denied') {
      setError('Motion permission denied. Enable motion access in browser settings.');
      return;
    }

    gravityRef.current = null;
    smoothRef.current = 0;
    adaptiveLevelRef.current = 0.9;
    lastStepAtRef.current = 0;
    stepTimesRef.current = [];

    isTrackingRef.current = true;
    setIsTracking(true);
    setStatus('Tracking steps... walk naturally with phone in pocket/hand');

    const handler = (event: DeviceMotionEvent) => {
      if (!isTrackingRef.current) {
        return;
      }

      const accel = event.accelerationIncludingGravity;
      if (!accel) {
        return;
      }

      const ax = accel.x ?? 0;
      const ay = accel.y ?? 0;
      const az = accel.z ?? 0;
      const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

      const previousGravity = gravityRef.current ?? magnitude;
      const gravity = previousGravity * 0.9 + magnitude * 0.1;
      gravityRef.current = gravity;

      const dynamic = magnitude - gravity;
      const smoothed = smoothRef.current * 0.7 + dynamic * 0.3;
      const previousSmoothed = smoothRef.current;
      smoothRef.current = smoothed;

      const adaptive = adaptiveLevelRef.current * 0.92 + Math.abs(smoothed) * 0.08;
      adaptiveLevelRef.current = adaptive;

      const threshold = clamp(adaptive * 1.35, 0.75, 2.6);

      const now = performance.now();
      const interval = now - lastStepAtRef.current;
      const crossedUp = previousSmoothed < threshold && smoothed >= threshold;
      const validGap = interval >= STEP_MIN_INTERVAL_MS && interval <= STEP_MAX_INTERVAL_MS;

      if (crossedUp && (lastStepAtRef.current === 0 || validGap)) {
        lastStepAtRef.current = now;

        setSteps((prev) => {
          const next = prev + 1;
          updateDerivedMetrics(next);
          return next;
        });

        stepTimesRef.current.push(now);
        stepTimesRef.current = stepTimesRef.current.filter((t) => now - t <= 60000);
        setCadenceSpm(stepTimesRef.current.length);
      }
    };

    motionHandlerRef.current = handler;
    window.addEventListener('devicemotion', handler, { passive: true });
  }, [canStartTracking, requestMotionPermission, updateDerivedMetrics]);

  const resetCounter = useCallback(() => {
    setSteps(0);
    setDistanceKm(0);
    setCalories(0);
    setCadenceSpm(0);
    setStatus(isTracking ? 'Tracking steps... walk naturally with phone in pocket/hand' : 'Ready to track steps');
    lastStepAtRef.current = 0;
    stepTimesRef.current = [];
  }, [isTracking]);

  useEffect(() => {
    if (!isTracking) {
      return;
    }

    const id = window.setInterval(() => {
      const now = performance.now();
      if (lastStepAtRef.current > 0 && now - lastStepAtRef.current > INACTIVITY_REMINDER_MS) {
        setStatus('No recent movement detected. Walk a bit to keep active.');
      }
    }, 4000);

    return () => {
      window.clearInterval(id);
    };
  }, [isTracking]);

  useEffect(() => {
    return () => {
      isTrackingRef.current = false;
      if (motionHandlerRef.current) {
        window.removeEventListener('devicemotion', motionHandlerRef.current as EventListener);
        motionHandlerRef.current = null;
      }
    };
  }, []);

  return (
    <GlassCard>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Step Counter (Mobile Motion)</h3>
          <span className="text-xs text-foreground/60">Browser sensor based</span>
        </div>

        <p className="text-xs text-foreground/60">
          Wellness tracking only. Accuracy can vary by device, placement, and walking style.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-foreground/60">Steps</p>
            <p className="text-2xl font-bold text-foreground">{steps}</p>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-foreground/60">Distance</p>
            <p className="text-2xl font-bold text-foreground">{distanceKm.toFixed(2)} km</p>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-foreground/60">Calories</p>
            <p className="text-2xl font-bold text-foreground">{Math.round(calories)} kcal</p>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-foreground/60">Cadence</p>
            <p className="text-2xl font-bold text-foreground">{cadenceSpm} spm</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="rounded-lg border border-white/10 p-3 text-sm text-foreground/80">
            Stride length (cm)
            <input
              type="number"
              min={35}
              max={150}
              value={strideLengthCm}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setStrideLengthCm('');
                  return;
                }
                setStrideLengthCm(Number(value));
              }}
              placeholder="Enter your stride length"
              className="mt-2 w-full rounded-md bg-black/20 border border-white/15 px-3 py-2 text-foreground"
            />
          </label>
          <label className="rounded-lg border border-white/10 p-3 text-sm text-foreground/80">
            Weight (kg)
            <input
              type="number"
              min={30}
              max={220}
              value={weightKg}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setWeightKg('');
                  return;
                }
                setWeightKg(Number(value));
              }}
              placeholder="Enter your weight"
              className="mt-2 w-full rounded-md bg-black/20 border border-white/15 px-3 py-2 text-foreground"
            />
          </label>
        </div>

        {!canStartTracking && (
          <p className="text-xs text-amber-300">
            Enter stride length and weight to enable Start Step Tracking.
          </p>
        )}

        <p className="text-sm text-foreground/70">{status}</p>
        {error && <p className="text-sm text-red-300">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {!isTracking ? (
            <button
              onClick={startTracking}
              disabled={!canStartTracking}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Step Tracking
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="px-4 py-2 rounded-md bg-destructive/80 text-white font-medium"
            >
              Stop Tracking
            </button>
          )}

          <button
            onClick={resetCounter}
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium"
          >
            Reset
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
