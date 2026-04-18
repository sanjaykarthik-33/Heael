'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

type Sample = {
  t: number;
  v: number;
};

const MIN_BPM = 40;
const MAX_BPM = 180;

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

function estimateBpmFromAutocorrelation(samples: Sample[]): number | null {
  if (samples.length < 40) {
    return null;
  }

  const values = samples.map((s) => s.v);
  const times = samples.map((s) => s.t);

  const avgDt =
    (times[times.length - 1] - times[0]) / Math.max(1, times.length - 1);
  if (!Number.isFinite(avgDt) || avgDt <= 0) {
    return null;
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const centered = values.map((v) => v - mean);

  const minLag = Math.max(2, Math.floor(300 / avgDt));
  const maxLag = Math.min(centered.length - 2, Math.floor(1500 / avgDt));
  if (maxLag <= minLag) {
    return null;
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
    return null;
  }

  const periodMs = bestLag * avgDt;
  const bpm = 60000 / periodMs;
  if (bpm < MIN_BPM || bpm > MAX_BPM) {
    return null;
  }

  return bpm;
}

function estimateBpm(samples: Sample[]): { bpm: number | null; quality: number } {
  if (samples.length < 30) {
    return { bpm: null, quality: 0 };
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
    return { bpm: null, quality: 10 };
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

  if (peaks.length < 2) {
    const autoBpm = estimateBpmFromAutocorrelation(samples);
    if (autoBpm !== null) {
      return { bpm: Math.round(autoBpm), quality: 40 };
    }
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
    const autoBpm = estimateBpmFromAutocorrelation(samples);
    if (autoBpm !== null) {
      return { bpm: Math.round(autoBpm), quality: 42 };
    }
    return { bpm: null, quality: 20 };
  }

  const bpms = intervals
    .map((delta) => 60000 / delta)
    .filter((bpm) => bpm >= MIN_BPM && bpm <= MAX_BPM);

  if (bpms.length < 2) {
    const autoBpm = estimateBpmFromAutocorrelation(samples);
    if (autoBpm !== null) {
      return { bpm: Math.round(autoBpm), quality: 45 };
    }
    return { bpm: null, quality: 25 };
  }

  const bpm = median(bpms);

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
  const smoothSignalRef = useRef<number | null>(null);
  const bpmHistoryRef = useRef<number[]>([]);
  const isRunningRef = useRef(false);

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

  const warning = useMemo(() => {
    if (bpm === null) {
      return null;
    }
    if (bpm < 50) {
      return 'Low heart rate detected. Please rest and re-check.';
    }
    if (bpm > 110) {
      return 'High heart rate detected. Please sit calmly and re-check.';
    }
    return null;
  }, [bpm]);

  const stopMonitoring = useCallback(() => {
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
    setIsRunning(false);
    setTorchEnabled(false);
    setTorchSupported(false);
    setIsFingerDetected(false);
    setStatus('Measurement stopped');
    setSampleCount(0);
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

    if (!video || !canvas || !isRunningRef.current) {
      return;
    }

    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
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

      if (estimate.bpm !== null) {
        bpmHistoryRef.current.push(estimate.bpm);
        if (bpmHistoryRef.current.length > 6) {
          bpmHistoryRef.current.shift();
        }
        setBpm(Math.round(median(bpmHistoryRef.current)));
      } else if (bpmHistoryRef.current.length === 0) {
        setBpm(null);
      }

      setQuality(estimate.quality);
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, []);

  const startMonitoring = useCallback(async () => {
    setError(null);
    setStatus('Requesting camera permission...');
    setBpm(null);
    setQuality(0);
    setSignalLevel(0);
    setSampleCount(0);
    samplesRef.current = [];
    bpmHistoryRef.current = [];
    smoothSignalRef.current = null;

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
            <p className="text-2xl font-bold text-foreground">{bpm ?? '--'}</p>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <p className="text-xs text-foreground/60">Signal Quality</p>
            <p className="text-2xl font-bold text-foreground">{quality}%</p>
          </div>
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
