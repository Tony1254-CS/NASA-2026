export interface RGB { r: number; g: number; b: number; }

/**
 * Converts HSV to RGB.
 * @param h Hue [0, 1]
 * @param s Saturation [0, 1]
 * @param v Value [0, 1]
 */
export function hsvToRgb(h: number, s: number, v: number): RGB {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Maps a wrapped phase value to a continuous cyclical color map (HSV).
 * 
 * @param phase Wrapped phase in radians [-π, π].
 */
export function phaseToColor(phase: number): RGB {
  // Map phase from [-π, π] to Hue in [0, 1]
  const normalized = (phase + Math.PI) / (2 * Math.PI);
  return hsvToRgb(normalized, 1.0, 1.0);
}

/**
 * Diverging colormap: Blue (negative/uplift) -> White (zero) -> Red (positive/subsidence).
 * 
 * @param value Current value.
 * @param min Minimum possible bound.
 * @param max Maximum possible bound.
 */
export function divergingColorMap(value: number, min: number, max: number): RGB {
  const bound = Math.max(Math.abs(min), Math.abs(max));
  if (bound === 0) return { r: 255, g: 255, b: 255 };
  
  const norm = Math.max(-1, Math.min(1, value / bound));
  
  if (norm < 0) {
    // Blue to white (uplift)
    const intensity = Math.round(255 * (1 + norm));
    return { r: intensity, g: intensity, b: 255 };
  } else {
    // White to red (subsidence)
    const intensity = Math.round(255 * (1 - norm));
    return { r: 255, g: intensity, b: intensity };
  }
}

/**
 * Sequential heatmap for coherence: Dark Blue (0) -> Cyan -> Yellow -> Red (1).
 * 
 * @param coherence Value in [0, 1].
 */
export function coherenceColorMap(coherence: number): RGB {
  const v = Math.max(0, Math.min(1, coherence));
  // 0.66 is roughly blue, 0.0 is red in HSV hue
  const h = (1.0 - v) * 0.66;
  return hsvToRgb(h, 1.0, 1.0);
}

/**
 * Simple grayscale colormap for radar amplitude backscatter.
 */
export function amplitudeColorMap(value: number): RGB {
  const v = Math.max(0, Math.min(1, value));
  const intensity = Math.round(v * 255);
  return { r: intensity, g: intensity, b: intensity };
}

export const displacementToColor = (value: number, bound: number) => divergingColorMap(value, -bound, bound);
export const coherenceToColor = coherenceColorMap;

