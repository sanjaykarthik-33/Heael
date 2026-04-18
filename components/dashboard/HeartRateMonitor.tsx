'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

type Sample = {
  t: number;
  v: number;
};

type BpmEstimate = {
  bpm: number | null;
  predictedBpm: number | null;
  quality: number;
};

type HeartRatePoint = {
  id: number;
  value: number;
};

type SavedReading = {
  id: number;
  bpm: number;
  quality: number;
  zone: Exclude<HeartRateZone, 'unknown'>;
  capturedAt: string;
};

type RiskInsight = {
  title: string;
  level: 'low' | 'moderate' | 'high';
  summary: string;
  possiblePatterns: string[];
  suggestions: string[];
};

type HeartRateZone = 'unknown' | 'low' | 'normal' | 'high';

type HeartRateGuidance = {
  title: string;
  summary: string;
  panelClass: string;
  immediateActions: string[];
  longerTermHabits: string[];
  seekCareNow: string[];
};

const MIN_BPM = 40;
const MAX_BPM = 180;
const MEASUREMENT_DURATION_SECONDS = 20;
const RESTING_LOW_THRESHOLD = 60;
const RESTING_HIGH_THRESHOLD = 100;
const SAVED_READINGS_STORAGE_KEY = 'heael-heart-rate-readings-v1';

function getZoneFromBpm(value: number): Exclude<HeartRateZone, 'unknown'> {
  if (value < RESTING_LOW_THRESHOLD) {
    return 'low';
  }
  if (value > RESTING_HIGH_THRESHOLD) {
    return 'high';
  }
  return 'normal';
}

function deriveFinalBpm(readingHistory: HeartRatePoint[], bpm: number | null): number | null {
  if (readingHistory.length >= 3) {
    const values = readingHistory.map((point) => point.value);
    return Math.round(median(values));
  }
  if (bpm !== null) {
    return bpm;
  }
  return null;
}

function getRiskInsight(savedReadings: SavedReading[]): RiskInsight {
  if (savedReadings.length === 0) {
    return {
      title: 'No Prediction Yet',
      level: 'low',
      summary: 'Complete a few measurements to detect heart-rate patterns and receive personalized wellness suggestions.',
      possiblePatterns: [
        'No stable trend yet. Collect at least 3 to 5 resting readings at similar times.',
      ],
      suggestions: [
        'Measure when seated and calm, preferably before caffeine.',
        'Keep the same posture and breathing pattern for each check.',
      ],
    };
  }

  const highs = savedReadings.filter((reading) => reading.zone === 'high').length;
  const lows = savedReadings.filter((reading) => reading.zone === 'low').length;
  const normals = savedReadings.filter((reading) => reading.zone === 'normal').length;
  const averageBpm =
    savedReadings.reduce((sum, reading) => sum + reading.bpm, 0) / Math.max(1, savedReadings.length);

  if (highs >= 3 && highs >= lows && highs >= normals) {
    return {
      title: 'Frequent High Resting BPM Pattern',
      level: 'high',
      summary:
        'Your recent readings often cross 100 bpm at rest. This can be linked to stress load, dehydration, stimulants, illness, or rhythm issues.',
      possiblePatterns: [
        'Possible persistent resting tachycardia pattern (not a diagnosis).',
        'Potential contributors: low sleep, anxiety, fever, excess caffeine, nicotine, or medication effects.',
      ],
      suggestions: [
        'Reduce caffeine/nicotine and improve hydration over the next week.',
        'Aim for regular sleep and gradual aerobic activity (at least 150 min/week total).',
        'Arrange a clinical check if resting values remain repeatedly above 100 bpm.',
      ],
    };
  }

  if (lows >= 3 && lows >= highs && lows >= normals) {
    return {
      title: 'Frequent Low Resting BPM Pattern',
      level: 'moderate',
      summary:
        'Your readings are often below 60 bpm. This can be normal in well-trained people, but symptoms require medical review.',
      possiblePatterns: [
        'Possible recurring low resting pulse pattern (not a diagnosis).',
        'May be fitness-related or associated with medication, thyroid, or conduction issues.',
      ],
      suggestions: [
        'Track symptoms (dizziness, fatigue, faintness) alongside your readings.',
        'Do not change regular medicines without clinician advice.',
        'If low readings persist with symptoms, seek same-day medical review.',
      ],
    };
  }

  return {
    title: 'Mostly Stable Resting BPM Pattern',
    level: averageBpm > 92 || averageBpm < 62 ? 'moderate' : 'low',
    summary:
      'Most readings are in or near the 60-100 bpm resting range. Continue preventive habits to maintain heart health.',
    possiblePatterns: [
      `Average resting BPM is ${Math.round(averageBpm)} across ${savedReadings.length} readings.`,
      'No dominant high-risk trend detected from current data (not a diagnosis).',
    ],
    suggestions: [
      'Maintain regular activity, sleep quality, and hydration.',
      'Repeat checks at the same time daily for cleaner trend tracking.',
      'Seek care if concerning symptoms occur even with normal-looking readings.',
    ],
  };
}

function getHeartRateGuidance(zone: HeartRateZone, bpm: number | null): HeartRateGuidance {
  if (zone === 'low') {
    return {
      title: 'Low BPM Guidance',
      summary:
        'A resting heart rate below 60 bpm can be normal in fit adults, but symptoms or very low readings should be checked by a clinician.',
      panelClass: 'border-amber-400/40 bg-amber-500/10',
      immediateActions: [
        'Sit or lie down and recheck after 3 to 5 minutes of calm breathing.',
        'Hydrate with water and avoid sudden standing or intense exertion.',
        'If your reading stays very low or you feel unwell, stop activity and seek medical help.',
      ],
      longerTermHabits: [
        'Track your morning resting pulse for 1 to 2 weeks and note symptoms.',
        'Review caffeine, alcohol, and medication timing with a clinician if readings are persistently low.',
        'Follow regular moderate activity and sleep routines to improve autonomic balance.',
      ],
      seekCareNow: [
        'Chest pain, shortness of breath, fainting, confusion, or severe weakness.',
        'Resting pulse below 50 bpm with symptoms, or below 40 bpm even without symptoms.',
      ],
    };
  }

  if (zone === 'high') {
    return {
      title: 'High BPM Guidance',
      summary:
        'A resting heart rate above 100 bpm can occur with stress, dehydration, fever, caffeine, or illness. Persistent high readings need medical review.',
      panelClass: 'border-rose-400/40 bg-rose-500/10',
      immediateActions: [
        'Stop activity, sit upright, and do slow paced breathing for 2 to 5 minutes.',
        'Hydrate and avoid caffeine, nicotine, energy drinks, and alcohol for the next few hours.',
        'Recheck after rest; if still high repeatedly at rest, arrange same-day medical advice.',
      ],
      longerTermHabits: [
        'Build up to at least 150 minutes/week of moderate activity, spread across the week.',
        'Use regular sleep, stress-management, and hydration routines to lower resting pulse over time.',
        'Discuss thyroid, anemia, infection, or medication effects if persistent resting tachycardia occurs.',
      ],
      seekCareNow: [
        'High pulse with chest pain, severe breathlessness, dizziness, or fainting.',
        'Resting pulse above 120 bpm that does not settle after several minutes of rest.',
      ],
    };
  }

  if (zone === 'normal') {
    return {
      title: 'Normal BPM Guidance',
      summary:
        'A resting BPM in the 60 to 100 range is generally expected in adults. Keep healthy routines to maintain stability.',
      panelClass: 'border-emerald-400/40 bg-emerald-500/10',
      immediateActions: [
        'Continue calm breathing and keep your body relaxed during measurement.',
        'Measure at a similar time daily for more consistent trend tracking.',
      ],
      longerTermHabits: [
        'Stay active weekly, including aerobic activity and muscle strengthening.',
        'Prioritize 7 to 9 hours sleep, hydration, and stress management habits.',
        'Limit high stimulant intake if your readings trend upward over time.',
      ],
      seekCareNow: [
        'Seek care if symptoms occur even when BPM appears normal (chest pain, breathlessness, fainting).',
      ],
    };
  }

  return {
    title: 'No Reading Yet',
    summary: 'Place your fingertip fully over the camera to get a stable resting BPM reading.',
    panelClass: 'border-white/15 bg-white/5',
    immediateActions: [
      'Keep your finger still and cover the lens completely.',
      'Avoid movement and bright background light while measuring.',
    ],
    longerTermHabits: [
      'Take measurements when seated and relaxed for better trend quality.',
    ],
    seekCareNow: [
      'If you have urgent symptoms, seek emergency care regardless of device reading.',
    ],
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function weightedAverage(items: Array<{ value: number; weight: number }>): number | null {
  if (items.length === 0) {
    return null;
  }

  let weightedSum = 0;
  let totalWeight = 0;
  for (const item of items) {
    weightedSum += item.value * item.weight;
    totalWeight += item.weight;
  }

  if (totalWeight <= 0) {
    return null;
  }

  return weightedSum / totalWeight;
}

function estimateBpmFromSpectrum(samples: Sample[]): { bpm: number | null; strength: number } {
  if (samples.length < 30) {
    return { bpm: null, strength: 0 };
  }

  const values = samples.map((s) => s.v);
  const durationMs = samples[samples.length - 1].t - samples[0].t;
  if (durationMs <= 0) {
    return { bpm: null, strength: 0 };
  }

  const dtSec = (durationMs / Math.max(1, values.length - 1)) / 1000;
  if (!Number.isFinite(dtSec) || dtSec <= 0) {
    return { bpm: null, strength: 0 };
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const centered = values.map((v) => v - mean);

  const minHz = MIN_BPM / 60;
  const maxHz = MAX_BPM / 60;
  const stepHz = 0.02;

  let bestHz = 0;
  let bestPower = 0;
  let secondPower = 0;
  let totalPower = 0;

  for (let hz = minHz; hz <= maxHz; hz += stepHz) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < centered.length; i++) {
      const phase = 2 * Math.PI * hz * i * dtSec;
      re += centered[i] * Math.cos(phase);
      im -= centered[i] * Math.sin(phase);
    }

    const power = re * re + im * im;
    totalPower += power;

    if (power > bestPower) {
      secondPower = bestPower;
      bestPower = power;
      bestHz = hz;
    } else if (power > secondPower) {
      secondPower = power;
    }
  }

  if (bestHz <= 0 || bestPower <= 0) {
    return { bpm: null, strength: 0 };
  }

  const separation = bestPower / Math.max(1e-6, secondPower);
  const dominance = bestPower / Math.max(1e-6, totalPower);
  const strength = clamp((separation * 0.6 + dominance * 80) / 2, 0, 1);

  return { bpm: bestHz * 60, strength };
}

function estimateBpmFromAutocorrelation(samples: Sample[]): { bpm: number | null; corr: number } {
  if (samples.length < 40) {
    return { bpm: null, corr: 0 };
  }

  const values = samples.map((s) => s.v);
  const times = samples.map((s) => s.t);

  const avgDt =
    (times[times.length - 1] - times[0]) / Math.max(1, times.length - 1);
  if (!Number.isFinite(avgDt) || avgDt <= 0) {
    return { bpm: null, corr: 0 };
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const centered = values.map((v) => v - mean);

  const minLag = Math.max(2, Math.floor(300 / avgDt));
  const maxLag = Math.min(centered.length - 2, Math.floor(1500 / avgDt));
  if (maxLag <= minLag) {
    return { bpm: null, corr: 0 };
  }

  let bestLag = 0;
  let bestCorr = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < centered.length - lag; i++) {
      const a = centered[i];
      const b = centered[i + lag];
      corr += a * b;
      normA += a * a;
      normB += b * b;
    }

    const norm = Math.sqrt(normA * normB);
    const score = norm > 0 ? corr / norm : -Infinity;

    if (score > bestCorr) {
      bestCorr = score;
      bestLag = lag;
    }
  }

  if (bestLag <= 0 || bestCorr < 0.08) {
    return { bpm: null, corr: bestCorr };
  }

  const periodMs = bestLag * avgDt;
  const bpm = 60000 / periodMs;
  if (bpm < MIN_BPM || bpm > MAX_BPM) {
    return { bpm: null, corr: bestCorr };
  }

  return { bpm, corr: bestCorr };
}

function estimateBpm(samples: Sample[]): BpmEstimate {
  if (samples.length < 30) {
    return { bpm: null, predictedBpm: null, quality: 0 };
  }

  const values = samples.map((s) => s.v);
  const times = samples.map((s) => s.t);

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const centered = values.map((v) => v - mean);

  const detrended = centered.map((_, i) => {
    const start = Math.max(0, i - 3);
    const end = Math.min(centered.length - 1, i + 3);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= end; j++) {
      sum += centered[j];
      count++;
    }
    const localMean = count > 0 ? sum / count : 0;
    return centered[i] - localMean;
  });

  const absMean =
    detrended.reduce((sum, v) => sum + Math.abs(v), 0) / Math.max(1, detrended.length);
  if (absMean < 0.03) {
    return { bpm: null, predictedBpm: null, quality: 10 };
  }

  const rms = Math.sqrt(
    detrended.reduce((sum, v) => sum + v * v, 0) / Math.max(1, detrended.length)
  );

  const peaks: number[] = [];
  const threshold = Math.max(absMean * 0.45, rms * 0.35);

  for (let i = 1; i < detrended.length - 1; i++) {
    const prev = detrended[i - 1];
    const curr = detrended[i];
    const next = detrended[i + 1];

    if (curr > prev && curr > next && curr > threshold) {
      const now = times[i];
      const last = peaks.length > 0 ? peaks[peaks.length - 1] : null;
      if (!last || now - last > 330) {
        peaks.push(now);
      }
    }
  }

  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const delta = peaks[i] - peaks[i - 1];
    if (delta > 250 && delta < 2000) {
      intervals.push(delta);
    }
  }

  const bpms = intervals
    .map((delta) => 60000 / delta)
    .filter((bpm) => bpm >= MIN_BPM && bpm <= MAX_BPM);

  const peakBpm = bpms.length >= 2 ? median(bpms) : null;
  const peakVariance =
    bpms.length >= 2
      ? bpms.reduce((sum, value) => sum + Math.pow(value - peakBpm!, 2), 0) / bpms.length
      : 0;
  const peakStdDev = Math.sqrt(peakVariance);

  const auto = estimateBpmFromAutocorrelation(samples);
  const spectrum = estimateBpmFromSpectrum(samples);

  const candidates: Array<{ value: number; weight: number }> = [];
  if (peakBpm !== null) {
    const peakWeight = clamp(1.15 - peakStdDev / 25, 0.25, 1.1);
    candidates.push({ value: peakBpm, weight: peakWeight });
  }
  if (auto.bpm !== null) {
    candidates.push({ value: auto.bpm, weight: clamp(auto.corr * 2.5, 0.2, 0.9) });
  }
  if (spectrum.bpm !== null) {
    candidates.push({ value: spectrum.bpm, weight: clamp(spectrum.strength * 1.6, 0.15, 0.8) });
  }

  const blended = weightedAverage(candidates);
  if (blended === null) {
    return { bpm: null, predictedBpm: null, quality: 15 };
  }

  const disagreements = candidates.map((c) => Math.abs(c.value - blended));
  const disagreement = disagreements.length > 0 ? median(disagreements) : 25;
  const agreementScore = clamp(100 - disagreement * 7, 10, 100);
  const sampleScore = clamp((samples.length / 150) * 100, 15, 100);
  const amplitudeScore = clamp(absMean * 220, 15, 100);
  const quality = Math.round((agreementScore * 0.5 + sampleScore * 0.25 + amplitudeScore * 0.25));

  const rounded = Math.round(blended);
  const isHighConfidence = quality >= 55;

  return {
    bpm: isHighConfidence ? rounded : null,
    predictedBpm: rounded,
    quality,
  };
}

export function HeartRateMonitor() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const samplesRef = useRef<Sample[]>([]);
  const lastSampleAtRef = useRef<number>(0);
  const lastEstimateAtRef = useRef<number>(0);
  const smoothSignalRef = useRef<number | null>(null);
  const bpmHistoryRef = useRef<number[]>([]);
  const isRunningRef = useRef(false);
  const isFingerDetectedRef = useRef(false);
  const measurementStartedAtRef = useRef<number | null>(null);
  const remainingSecondsRef = useRef(MEASUREMENT_DURATION_SECONDS);

  const [isRunning, setIsRunning] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [quality, setQuality] = useState(0);
  const [status, setStatus] = useState('Ready to measure');
  const [error, setError] = useState<string | null>(null);
  const [isFingerDetected, setIsFingerDetected] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [signalLevel, setSignalLevel] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [isPredicted, setIsPredicted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(MEASUREMENT_DURATION_SECONDS);
  const [readingHistory, setReadingHistory] = useState<HeartRatePoint[]>([]);
  const [savedReadings, setSavedReadings] = useState<SavedReading[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_READINGS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as SavedReading[];
      if (Array.isArray(parsed)) {
        setSavedReadings(
          parsed.filter(
            (item) =>
              typeof item.id === 'number' &&
              typeof item.bpm === 'number' &&
              typeof item.quality === 'number' &&
              typeof item.capturedAt === 'string' &&
              (item.zone === 'low' || item.zone === 'normal' || item.zone === 'high')
          )
        );
      }
    } catch {
      // Ignore storage parse errors and start with empty history.
      setSavedReadings([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SAVED_READINGS_STORAGE_KEY, JSON.stringify(savedReadings));
    } catch {
      // Ignore storage write errors.
    }
  }, [savedReadings]);

  const warning = useMemo(() => {
    if (bpm === null) {
      return null;
    }
    if (bpm < RESTING_LOW_THRESHOLD) {
      return 'Low heart rate detected. Please rest and re-check.';
    }
    if (bpm > RESTING_HIGH_THRESHOLD) {
      return 'High heart rate detected. Please sit calmly and re-check.';
    }
    return null;
  }, [bpm]);

  const bpmZone = useMemo<HeartRateZone>(() => {
    if (bpm === null) {
      return 'unknown';
    }
    if (bpm < RESTING_LOW_THRESHOLD) {
      return 'low';
    }
    if (bpm > RESTING_HIGH_THRESHOLD) {
      return 'high';
    }
    return 'normal';
  }, [bpm]);

  const guidance = useMemo(() => getHeartRateGuidance(bpmZone, bpm), [bpmZone, bpm]);

  const stopMonitoring = useCallback((
    statusMessage = 'Measurement stopped',
    options?: { shouldSaveReading?: boolean }
  ) => {
    if (options?.shouldSaveReading) {
      const finalBpm = deriveFinalBpm(readingHistory, bpm);
      if (finalBpm !== null) {
        setSavedReadings((prev) => {
          const nextId = prev.length > 0 ? prev[prev.length - 1].id + 1 : 1;
          const next: SavedReading = {
            id: nextId,
            bpm: finalBpm,
            quality,
            zone: getZoneFromBpm(finalBpm),
            capturedAt: new Date().toISOString(),
          };
          return [...prev, next].slice(-120);
        });
      }
    }

    isRunningRef.current = false;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    samplesRef.current = [];
    bpmHistoryRef.current = [];
    lastSampleAtRef.current = 0;
    lastEstimateAtRef.current = 0;
    smoothSignalRef.current = null;
    isFingerDetectedRef.current = false;
    measurementStartedAtRef.current = null;
    remainingSecondsRef.current = MEASUREMENT_DURATION_SECONDS;
    setIsRunning(false);
    setTorchEnabled(false);
    setTorchSupported(false);
    setIsFingerDetected(false);
    setStatus(statusMessage);
    setSampleCount(0);
    setIsPredicted(false);
    setRemainingSeconds(MEASUREMENT_DURATION_SECONDS);
  }, [bpm, quality, readingHistory]);

  const toggleTorch = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream) {
      return;
    }

    const [videoTrack] = stream.getVideoTracks();
    if (!videoTrack) {
      return;
    }

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !torchEnabled } as MediaTrackConstraintSet],
      });
      setTorchEnabled((v) => !v);
    } catch {
      setError('Torch control is not available on this browser/device.');
    }
  }, [torchEnabled]);

  const processFrame = useCallback((now: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isRunningRef.current) {
      return;
    }

    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (measurementStartedAtRef.current !== null) {
      const elapsedMs = now - measurementStartedAtRef.current;
      const remaining = clamp(
        Math.ceil((MEASUREMENT_DURATION_SECONDS * 1000 - elapsedMs) / 1000),
        0,
        MEASUREMENT_DURATION_SECONDS
      );
      if (remaining !== remainingSecondsRef.current) {
        remainingSecondsRef.current = remaining;
        setRemainingSeconds(remaining);
      }

      if (remaining === 0) {
        stopMonitoring('Measurement complete and saved', { shouldSaveReading: true });
        return;
      }
    }

    const sampleGapMs = 66;
    if (now - lastSampleAtRef.current >= sampleGapMs) {
      lastSampleAtRef.current = now;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const roiSize = 56;
        const x = Math.max(0, Math.floor(video.videoWidth / 2 - roiSize / 2));
        const y = Math.max(0, Math.floor(video.videoHeight / 2 - roiSize / 2));

        canvas.width = roiSize;
        canvas.height = roiSize;

        ctx.drawImage(video, x, y, roiSize, roiSize, 0, 0, roiSize, roiSize);
        const image = ctx.getImageData(0, 0, roiSize, roiSize);

        let red = 0;
        let green = 0;
        let blue = 0;
        let redDominantPixels = 0;
        const count = image.data.length / 4;

        for (let i = 0; i < image.data.length; i += 4) {
          const r = image.data[i];
          const g = image.data[i + 1];
          const b = image.data[i + 2];
          red += r;
          green += g;
          blue += b;
          if (r > g && r > b) {
            redDominantPixels++;
          }
        }

        const avgR = red / count;
        const avgG = green / count;
        const avgB = blue / count;
        const brightness = (avgR + avgG + avgB) / 3;
        const sumRgb = Math.max(1, avgR + avgG + avgB);

        const redRatio = avgR / sumRgb;
        const redDominance = avgR / Math.max(1, avgG);
        const redCoverage = redDominantPixels / Math.max(1, count);

        const fingerDetected =
          brightness > 12 && (redCoverage > 0.34 || redDominance > 1.03 || redRatio > 0.33);
        isFingerDetectedRef.current = fingerDetected;
        setIsFingerDetected(fingerDetected);

        const canSample = brightness > 10 && redRatio > 0.26;
        if (canSample) {
          const rawSignal = redRatio * 10000;
          const prev = smoothSignalRef.current;
          const smoothed = prev === null ? rawSignal : prev * 0.7 + rawSignal * 0.3;
          smoothSignalRef.current = smoothed;
          samplesRef.current.push({ t: now, v: smoothed });
          setSampleCount(samplesRef.current.length);

          const normalizedLevel = clamp((Math.abs(smoothed - (prev ?? smoothed)) / 1.2) * 100, 0, 100);
          setSignalLevel(Math.round(normalizedLevel));
          if (fingerDetected) {
            setStatus('Reading pulse... keep still');
          } else {
            setStatus('Signal detected. Cover lens fully for better reading');
          }
        } else {
          setSignalLevel(0);
          setSampleCount(0);
          setStatus('Place finger fully over camera lens');
          samplesRef.current = [];
          bpmHistoryRef.current = [];
        }

        const windowMs = 18000;
        samplesRef.current = samplesRef.current.filter((s) => now - s.t <= windowMs);
      }
    }

    const estimateGapMs = 500;
    if (now - lastEstimateAtRef.current >= estimateGapMs) {
      lastEstimateAtRef.current = now;
      const estimate = estimateBpm(samplesRef.current);

      if (estimate.predictedBpm !== null) {
        bpmHistoryRef.current.push(estimate.predictedBpm);
        if (bpmHistoryRef.current.length > 6) {
          bpmHistoryRef.current.shift();
        }
        const stable = Math.round(median(bpmHistoryRef.current));
        const displayBpm = clamp(stable, MIN_BPM, MAX_BPM);
        setBpm(displayBpm);
        if (isFingerDetectedRef.current) {
          setReadingHistory((prev) => {
            const nextPoint: HeartRatePoint = {
              id: prev.length > 0 ? prev[prev.length - 1].id + 1 : 1,
              value: displayBpm,
            };
            return [...prev, nextPoint].slice(-20);
          });
        }
        setIsPredicted(estimate.bpm === null);
      } else if (bpmHistoryRef.current.length === 0) {
        setBpm(null);
        setIsPredicted(false);
      }

      setQuality(estimate.quality);
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [stopMonitoring]);

  const startMonitoring = useCallback(async () => {
    setError(null);
    setStatus('Requesting camera permission...');
    setBpm(null);
    setQuality(0);
    setSignalLevel(0);
    setSampleCount(0);
    setIsPredicted(false);
    setRemainingSeconds(MEASUREMENT_DURATION_SECONDS);
    setReadingHistory([]);
    samplesRef.current = [];
    bpmHistoryRef.current = [];
    smoothSignalRef.current = null;
    isFingerDetectedRef.current = false;
    measurementStartedAtRef.current = null;
    remainingSecondsRef.current = MEASUREMENT_DURATION_SECONDS;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element is unavailable.');
      }

      video.srcObject = stream;
      await video.play();

      const [track] = stream.getVideoTracks();
      const capabilities = track?.getCapabilities?.();
      const supportsTorch = Boolean(capabilities && 'torch' in capabilities);
      setTorchSupported(supportsTorch);

      isRunningRef.current = true;
      measurementStartedAtRef.current = performance.now();
      remainingSecondsRef.current = MEASUREMENT_DURATION_SECONDS;
      setIsRunning(true);
      setStatus('Place finger over camera to start measuring');
      rafRef.current = requestAnimationFrame(processFrame);
    } catch (e) {
      setIsRunning(false);
      const message = e instanceof Error ? e.message : 'Unable to access camera.';
      setError(`Camera start failed: ${message}`);
      setStatus('Unable to start');
    }
  }, [processFrame]);

  useEffect(() => {
    return () => stopMonitoring('Measurement stopped');
  }, [stopMonitoring]);

  const previousReading = readingHistory.length >= 2 ? readingHistory[readingHistory.length - 2].value : null;
  const currentReading = readingHistory.length >= 1 ? readingHistory[readingHistory.length - 1].value : null;
  const trendRange = useMemo<[number, number]>(() => {
    if (readingHistory.length < 2) {
      return [55, 105];
    }

    const values = readingHistory.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const paddedMin = clamp(Math.floor(minValue - 6), MIN_BPM, MAX_BPM - 5);
    const paddedMax = clamp(Math.ceil(maxValue + 6), paddedMin + 5, MAX_BPM);
    return [paddedMin, paddedMax];
  }, [readingHistory]);

  const savedTrendRange = useMemo<[number, number]>(() => {
    if (savedReadings.length < 2) {
      return [55, 105];
    }

    const values = savedReadings.map((reading) => reading.bpm);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const paddedMin = clamp(Math.floor(minValue - 6), MIN_BPM, MAX_BPM - 5);
    const paddedMax = clamp(Math.ceil(maxValue + 6), paddedMin + 5, MAX_BPM);
    return [paddedMin, paddedMax];
  }, [savedReadings]);

  const riskInsight = useMemo(() => getRiskInsight(savedReadings), [savedReadings]);

  const riskLevelClass = useMemo(() => {
    if (riskInsight.level === 'high') {
      return 'border-rose-400/40 bg-rose-500/10';
    }
    if (riskInsight.level === 'moderate') {
      return 'border-amber-400/40 bg-amber-500/10';
    }
    return 'border-emerald-400/40 bg-emerald-500/10';
  }, [riskInsight.level]);

  return (
    <GlassCard>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Heart Rate Monitor (PPG)</h3>
          <span className="text-xs text-foreground/60">Mobile camera based</span>
        </div>

        <p className="text-xs text-foreground/60">
          Informational only. This is not a medical diagnosis tool.
        </p>

        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-36 rounded-lg object-cover bg-black/40"
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-foreground/60">BPM</p>
            <p className="text-2xl font-bold text-foreground">
              {bpm !== null ? `${isPredicted ? '~' : ''}${bpm}` : '--'}
            </p>
            {bpm !== null && isPredicted && (
              <p className="text-[11px] text-amber-300">Predicted from signal samples</p>
            )}
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-foreground/60">Signal Quality</p>
            <p className="text-2xl font-bold text-foreground">{quality}%</p>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground/60">Hold Finger Timer</p>
            <p className="text-sm font-semibold text-foreground">{remainingSeconds}s</p>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-400 transition-all duration-300"
              style={{ width: `${(remainingSeconds / MEASUREMENT_DURATION_SECONDS) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-foreground/60">
            Keep your finger steady on camera until the timer reaches 0 seconds.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 p-3">
          <p className="text-xs text-foreground/60">Live Signal</p>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${signalLevel}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground/60">Saved Readings Trend</p>
            <p className="text-[11px] text-foreground/60">Total saved: {savedReadings.length}</p>
          </div>

          <div className="mt-2 h-40 w-full">
            {savedReadings.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={savedReadings}>
                  <XAxis
                    dataKey="id"
                    stroke="rgba(245, 245, 245, 0.45)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    domain={savedTrendRange}
                    stroke="rgba(245, 245, 245, 0.45)"
                    width={34}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value, _name, entry) => {
                      const record = entry?.payload as SavedReading;
                      return [`${value} BPM`, `${record.zone.toUpperCase()} (${record.quality}% quality)`];
                    }}
                    labelFormatter={(label, payload) => {
                      const record = payload && payload[0]?.payload as SavedReading;
                      if (!record?.capturedAt) {
                        return `Reading ${label}`;
                      }
                      return `Reading ${label} • ${new Date(record.capturedAt).toLocaleString()}`;
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(26, 26, 46, 0.92)',
                      border: '1px solid rgba(245, 245, 245, 0.22)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bpm"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-foreground/60">
                Complete at least 2 full measurements to visualize saved trend.
              </div>
            )}
          </div>
        </div>

        <div className={`rounded-lg border p-3 ${riskLevelClass}`}>
          <p className="text-sm font-semibold text-foreground">{riskInsight.title}</p>
          <p className="mt-1 text-xs text-foreground/80">{riskInsight.summary}</p>

          <div className="mt-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Possible pattern</p>
            {riskInsight.possiblePatterns.map((item) => (
              <p key={`pattern-${item}`} className="text-xs text-foreground/85">• {item}</p>
            ))}
          </div>

          <div className="mt-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Healthy-heart plan</p>
            {riskInsight.suggestions.map((item) => (
              <p key={`suggestion-${item}`} className="text-xs text-foreground/85">• {item}</p>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-foreground/60">
            Prediction is wellness-oriented pattern detection, not medical diagnosis.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground/60">Heart Rate Trend</p>
            <p className="text-[11px] text-foreground/60">BPM range: {trendRange[0]}-{trendRange[1]}</p>
          </div>

          <div className="mt-2 h-36 w-full">
            {readingHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readingHistory}>
                  <XAxis
                    dataKey="id"
                    tick={false}
                    axisLine={false}
                    stroke="rgba(245, 245, 245, 0.45)"
                  />
                  <YAxis
                    domain={trendRange}
                    stroke="rgba(245, 245, 245, 0.45)"
                    width={34}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} BPM`, 'Reading']}
                    labelFormatter={(label) => `Sample ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(26, 26, 46, 0.92)',
                      border: '1px solid rgba(0, 217, 255, 0.35)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00d9ff"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-foreground/60">
                Keep your finger steady to capture previous and current readings.
              </div>
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-white/10 p-2">
              <p className="text-foreground/60">Previous</p>
              <p className="text-sm font-semibold text-foreground">
                {previousReading !== null ? `${previousReading} BPM` : '--'}
              </p>
            </div>
            <div className="rounded-md border border-white/10 p-2">
              <p className="text-foreground/60">Current</p>
              <p className="text-sm font-semibold text-foreground">
                {currentReading !== null ? `${currentReading} BPM` : '--'}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-foreground/60">Captured samples: {sampleCount}</p>

        <p className="text-sm text-foreground/70">{status}</p>

        {!isFingerDetected && isRunning && (
          <p className="text-xs text-yellow-300">
            Tip: Cover the camera lens fully with your fingertip and keep steady.
          </p>
        )}

        {warning && (
          <p className="text-sm text-red-300 font-medium">⚠ {warning}</p>
        )}

        <div className={`rounded-lg border p-3 ${guidance.panelClass}`}>
          <p className="text-sm font-semibold text-foreground">{guidance.title}</p>
          <p className="mt-1 text-xs text-foreground/80">{guidance.summary}</p>

          <div className="mt-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Do now</p>
            {guidance.immediateActions.map((item) => (
              <p key={`now-${item}`} className="text-xs text-foreground/85">• {item}</p>
            ))}
          </div>

          <div className="mt-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Build routine</p>
            {guidance.longerTermHabits.map((item) => (
              <p key={`habit-${item}`} className="text-xs text-foreground/85">• {item}</p>
            ))}
          </div>

          <div className="mt-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Seek urgent care if</p>
            {guidance.seekCareNow.map((item) => (
              <p key={`urgent-${item}`} className="text-xs text-rose-200">• {item}</p>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-foreground/60">
            Guidance basis: global public-health references (WHO physical activity), and clinical arrhythmia summaries from government-backed sources such as Healthdirect Australia. This app is for wellness support, not diagnosis.
          </p>
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {!isRunning ? (
            <button
              onClick={startMonitoring}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium"
            >
              Start Measurement
            </button>
          ) : (
            <button
              onClick={() => stopMonitoring('Measurement stopped and saved', { shouldSaveReading: true })}
              className="px-4 py-2 rounded-md bg-destructive/80 text-white font-medium"
            >
              Stop
            </button>
          )}

          {torchSupported && isRunning && (
            <button
              onClick={toggleTorch}
              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium"
            >
              {torchEnabled ? 'Torch Off' : 'Torch On'}
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
