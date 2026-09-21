/**
 * Deterministic mapping layer converting backend scientific measurements (e.g. NISAR delta_backscatter dB)
 * into physical haptic vibration patterns and Web Audio tone frequencies.
 */

export interface FeelMappingResult {
  pattern: number[];
  pulseMs: number;
  pauseMs: number;
  frequencyHz: number;
  normalizedMagnitude: number;
  description: string;
}

/**
 * Check if the current browser/device environment supports navigator.vibrate
 */
export function isHapticsSupported(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/**
 * Pure deterministic mapping function:
 * Converts a scientific measurement (dB) into a haptic pattern and audio frequency.
 */
export function computeFeelMapping(
  measurement: number,
  sensitivity: number = 1.0
): FeelMappingResult {
  // 1. Calculate absolute change magnitude
  const mag = Math.abs(measurement);
  const clampedMag = Math.min(10.0, Math.max(0.1, mag));
  const normalizedMagnitude = Math.round((clampedMag / 10.0) * 100) / 100;

  // 2. Deterministic pulse & rhythm calculation
  // Higher magnitude = longer pulse duration, shorter pause interval
  const pulseMs = Math.round(Math.min(350, Math.max(40, (40 + clampedMag * 30) * sensitivity)));
  const pauseMs = Math.round(Math.max(50, 320 - clampedMag * 25));

  // Pattern sequence: [pulse, pause, pulse, pause * 1.2, pulse * 1.5, pause * 0.8]
  const pattern = [
    pulseMs,
    pauseMs,
    pulseMs,
    Math.round(pauseMs * 1.2),
    Math.round(pulseMs * 1.3),
    Math.round(pauseMs * 0.8),
  ];

  // 3. Audio frequency synthesis (Hz)
  // Negative backscatter (water inundation) -> deeper sub-bass frequencies (100–220 Hz)
  // Positive backscatter (structure/vegetation) -> higher mid frequencies (220–500 Hz)
  const baseFreq = 220;
  const rawFreq = baseFreq - measurement * 25; // Negative dB raises pitch, positive lowers
  const frequencyHz = Math.round(Math.min(600, Math.max(80, rawFreq)));

  // 4. Descriptive label
  let description = 'Moderate Radar Backscatter Shift';
  if (clampedMag > 4.0) description = 'High Surface Radar Alteration';
  else if (clampedMag < 1.0) description = 'Subtle Radar Signal Variance';

  return {
    pattern,
    pulseMs,
    pauseMs,
    frequencyHz,
    normalizedMagnitude,
    description,
  };
}
