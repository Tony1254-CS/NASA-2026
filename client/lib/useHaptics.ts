'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  computeFeelMapping,
  isHapticsSupported,
  type FeelMappingResult,
} from './feelMapping';

export interface UseHapticsReturn {
  isPlaying: boolean;
  hapticsSupported: boolean;
  sensitivity: number;
  setSensitivity: (val: number) => void;
  isAudioMuted: boolean;
  setIsAudioMuted: (val: boolean) => void;
  feelDetails: FeelMappingResult | null;
  startFeel: (measurement: number) => void;
  stopFeel: () => void;
}

export function useHaptics(): UseHapticsReturn {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<number>(1.0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [hapticsSupported, setHapticsSupported] = useState<boolean>(false);
  const [feelDetails, setFeelDetails] = useState<FeelMappingResult | null>(null);

  const loopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    setHapticsSupported(isHapticsSupported());
  }, []);

  const stopFeel = useCallback(() => {
    // 1. Stop vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(0);
    }

    // 2. Clear timer
    if (loopTimerRef.current) {
      clearInterval(loopTimerRef.current);
      loopTimerRef.current = null;
    }

    // 3. Stop audio synthesizer
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch (e) {
        // Ignored
      }
      oscRef.current = null;
    }

    if (gainRef.current) {
      try {
        gainRef.current.disconnect();
      } catch (e) {
        // Ignored
      }
      gainRef.current = null;
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch (e) {
        // Ignored
      }
      audioCtxRef.current = null;
    }

    setIsPlaying(false);
  }, []);

  const startFeel = useCallback(
    (measurement: number) => {
      stopFeel();

      const details = computeFeelMapping(measurement, sensitivity);
      setFeelDetails(details);
      setIsPlaying(true);

      // A. Trigger Haptic Vibration
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(details.pattern);

        const totalPatternDuration = details.pattern.reduce((acc, curr) => acc + curr, 0);

        loopTimerRef.current = setInterval(() => {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(details.pattern);
          }
        }, totalPatternDuration + 200);
      }

      // B. Trigger Web Audio Synthesizer (if unmuted)
      if (!isAudioMuted && typeof window !== 'undefined') {
        try {
          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) {
            const ctx = new AudioCtxClass();
            audioCtxRef.current = ctx;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(details.frequencyHz, ctx.currentTime);

            // Pulsing Gain envelope matching haptic rhythm
            gain.gain.setValueAtTime(0.01, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            oscRef.current = osc;
            gainRef.current = gain;
          }
        } catch (e) {
          console.warn('Web Audio playback failed or blocked by browser policy', e);
        }
      }
    },
    [sensitivity, isAudioMuted, stopFeel]
  );

  useEffect(() => {
    return () => {
      stopFeel();
    };
  }, [stopFeel]);

  return {
    isPlaying,
    hapticsSupported,
    sensitivity,
    setSensitivity,
    isAudioMuted,
    setIsAudioMuted,
    feelDetails,
    startFeel,
    stopFeel,
  };
}
