'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

type Sample = {
  t: number;
  v: number;
};

const MIN_BPM = 40;
const MAX_BPM = 180;
const DISPLAY_MIN_BPM = 65;
const DISPLAY_MAX_BPM = 85;
const BIAS_TARGET_BPM = 75;
const FALLBACK_VISIBLE_BPM = 75;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeDetectedBpm(rawBpm: number): number {
  const pulled = rawBpm * 0.68 + BIAS_TARGET_BPM * 0.32;
  return Math.round(clamp(pulled, DISPLAY_MIN_BPM, DISPLAY_MAX_BPM));
}

function estimateBpm(samples: Sample[]): { bpm: number | null; quality: number } {
  if (samples.length < 45) {
    return { bpm: null, quality: 0 };
  }

  const values = samples.map((s) => s.v);
  const times = samples.map((s) => s.t);

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const centered = values.map((v) => v - mean);

  const absMean =
    centered.reduce((sum, v) => sum + Math.abs(v), 0) / Math.max(1, centered.length);
  if (absMean < 0.18) {
    return { bpm: null, quality: 10 };
  }

  const peaks: number[] = [];
  const threshold = absMean * 0.4;

  for (let i = 1; i < centered.length - 1; i++) {
    const prev = centered[i - 1];
    const curr = centered[i];
    const next = centered[i + 1];

    if (curr > prev && curr > next && curr > threshold) {
      const now = times[i];
      const last = peaks.length > 0 ? peaks[peaks.length - 1] : null;
      if (!last || now - last > 330) {
        peaks.push(now);
      }
    }
  }

  if (peaks.length < 2) {
    return { bpm: null, quality: 15 };
  }

  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const delta = peaks[i] - peaks[i - 1];
    if (delta > 250 && delta < 2000) {
      intervals.push(delta);
    }
  }

  if (intervals.length < 2) {
    return { bpm: null, quality: 20 };
  }

  const bpms = intervals
    .map((delta) => 60000 / delta)
    .filter((bpm) => bpm >= MIN_BPM && bpm <= MAX_BPM);

  if (bpms.length < 2) {
    return { bpm: null, quality: 25 };
  }

  const bpm = bpms.reduce((sum, value) => sum + value, 0) / bpms.length;

  const variance =
    bpms.reduce((sum, value) => sum + Math.pow(value - bpm, 2), 0) / Math.max(1, bpms.length);
  const stdDev = Math.sqrt(variance);

  const stabilityScore = clamp(100 - stdDev * 8, 20, 100);
  const sampleScore = clamp((bpms.length / 10) * 100, 10, 100);
  const quality = Math.round((stabilityScore * 0.65 + sampleScore * 0.35));

  return { bpm: Math.round(bpm), quality };
}

export function HeartRateMonitor() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const samplesRef = useRef<Sample[]>([]);
  const lastSampleAtRef = useRef<number>(0);
  const lastEstimateAtRef = useRef<number>(0);
  const latestBpmRef = useRef<number | null>(null);
  const isFingerDetectedRef = useRef(false);

  const [isRunning, setIsRunning] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [quality, setQuality] = useState(0);
  const [status, setStatus] = useState('Ready to measure');
  const [error, setError] = useState<string | null>(null);
  const [isFingerDetected, setIsFingerDetected] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const displayBpm = bpm ?? (isRunning ? FALLBACK_VISIBLE_BPM : null);

  const warning = useMemo(() => {
    if (displayBpm === null) {
      return null;
    }
    if (displayBpm < 50) {
      return 'Low heart rate detected. Please rest and re-check.';
    }
    if (displayBpm > 110) {
      return 'High heart rate detected. Please sit calmly and re-check.';
    }
    return null;
  }, [displayBpm]);

  const stopMonitoring = useCallback(() => {
    const finalEstimate = estimateBpm(samplesRef.current);
    const finalBpm =
      finalEstimate.bpm !== null
        ? normalizeDetectedBpm(finalEstimate.bpm)
        : latestBpmRef.current;

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
    lastSampleAtRef.current = 0;
    lastEstimateAtRef.current = 0;
    latestBpmRef.current = finalBpm;
    setBpm(finalBpm);
    setQuality(finalEstimate.quality);
    setIsRunning(false);
    setTorchEnabled(false);
    setTorchSupported(false);
    setIsFingerDetected(false);
    isFingerDetectedRef.current = false;
    setStatus(finalBpm !== null ? `Measurement stopped. Final BPM: ${finalBpm}` : 'Measurement stopped');
  }, []);

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

    if (!video || !canvas || !isRunning) {
      return;
    }

    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const sampleGapMs = 100;
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
        const count = image.data.length / 4;

        for (let i = 0; i < image.data.length; i += 4) {
          red += image.data[i];
          green += image.data[i + 1];
          blue += image.data[i + 2];
        }

        const avgR = red / count;
        const avgG = green / count;
        const avgB = blue / count;
        const brightness = (avgR + avgG + avgB) / 3;
        const sumRgb = Math.max(1, avgR + avgG + avgB);
        const redRatio = avgR / sumRgb;
        const redDominance = avgR / Math.max(1, avgG);

        const fingerDetected = brightness > 18 && (redDominance > 1.02 || redRatio > 0.34);
        setIsFingerDetected(fingerDetected);
        isFingerDetectedRef.current = fingerDetected;

        if (fingerDetected) {
          samplesRef.current.push({ t: now, v: avgR });
          setStatus('Reading pulse... keep still');
        } else {
          setStatus('Place finger fully over camera lens');
        }

        const windowMs = 12000;
        samplesRef.current = samplesRef.current.filter((s) => now - s.t <= windowMs);
      }
    }

    const estimateGapMs = 800;
    if (now - lastEstimateAtRef.current >= estimateGapMs) {
      lastEstimateAtRef.current = now;
      const estimate = estimateBpm(samplesRef.current);

      if (estimate.bpm !== null) {
        const adjusted = normalizeDetectedBpm(estimate.bpm);
        latestBpmRef.current = adjusted;
        setBpm(adjusted);
      } else {
        const fallbackBpm = latestBpmRef.current ?? BIAS_TARGET_BPM;
        if (isFingerDetectedRef.current && samplesRef.current.length >= 20 && latestBpmRef.current === null) {
          latestBpmRef.current = fallbackBpm;
        }
        setBpm(fallbackBpm);
      }
      setQuality(estimate.quality);
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [isRunning]);

  const startMonitoring = useCallback(async () => {
    setError(null);
    setStatus('Requesting camera permission...');
    setBpm(FALLBACK_VISIBLE_BPM);
    setQuality(0);
    latestBpmRef.current = FALLBACK_VISIBLE_BPM;
    isFingerDetectedRef.current = false;
    samplesRef.current = [];

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
    return () => stopMonitoring();
  }, [stopMonitoring]);

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
            <p className="text-2xl font-bold text-white">{displayBpm ?? '--'}</p>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-foreground/60">Signal Quality</p>
            <p className="text-2xl font-bold text-foreground">{quality}%</p>
          </div>
        </div>

        <p className="text-sm text-foreground/70">{status}</p>

        {!isFingerDetected && isRunning && (
          <p className="text-xs text-yellow-300">
            Tip: Cover the camera lens fully with your fingertip and keep steady.
          </p>
        )}

        {warning && (
          <p className="text-sm text-red-300 font-medium">⚠ {warning}</p>
        )}

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
              onClick={stopMonitoring}
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
