import { generateInterferogramGrid, generateUnwrappedGrid } from './interferogram';
import { calculatePhaseFromDisplacement } from './sarPhysics';

export interface InterferogramSample {
  id: string;
  region: string;
  satellite: 'NISAR' | 'Sentinel-1';
  band: 'L-band' | 'C-band';
  wavelength_cm: number;
  temporal_baseline_days: number;
  perpendicular_baseline_m: number;
  acquisition_date_1: string;
  acquisition_date_2: string;
  grid_size: [number, number]; // [rows, cols]
  wrapped_phase: number[];     // values in [-π, π]
  coherence: number[];         // values in [0, 1]
  amplitude: number[];         // normalized [0, 1]
  displacement_mm: number[];   // unwrapped displacement
  peak_displacement_mm: number;
  mean_coherence: number;
  fringe_count: number;
  description: string;
}

const ROWS = 200;
const COLS = 200;

function createUniformGrid(val: number): number[] {
  return new Array(ROWS * COLS).fill(val);
}

function createNoiseGrid(baseVal: number, variance: number): number[] {
  const grid = new Array(ROWS * COLS);
  for (let i = 0; i < grid.length; i++) {
    const noise = (Math.random() - 0.5) * variance;
    grid[i] = Math.max(0, Math.min(1, baseVal + noise));
  }
  return grid;
}

export const CASE_STUDIES: InterferogramSample[] = [
  {
    id: 'volcano',
    region: 'Sierra Negra, Galápagos',
    satellite: 'NISAR',
    band: 'L-band',
    wavelength_cm: 24.0,
    temporal_baseline_days: 12,
    perpendicular_baseline_m: 127,
    acquisition_date_1: '2026-04-10T00:00:00Z',
    acquisition_date_2: '2026-04-22T00:00:00Z',
    grid_size: [ROWS, COLS],
    description: 'Volcanic Inflation (Uplift)',
    peak_displacement_mm: 600, // +600mm uplift -> 5 fringes at L-band
    mean_coherence: 0.85,
    fringe_count: 5,
    wrapped_phase: generateInterferogramGrid(ROWS, COLS, (r, c) => {
      const cy = ROWS / 2;
      const cx = COLS / 2;
      const dist = Math.sqrt(Math.pow(r - cy, 2) + Math.pow(c - cx, 2));
      const maxDist = Math.sqrt(Math.pow(ROWS/2, 2) + Math.pow(COLS/2, 2));
      const dispMm = 600 * Math.exp(-Math.pow(dist / (maxDist / 3), 2));
      return calculatePhaseFromDisplacement(24.0, dispMm);
    }),
    displacement_mm: generateUnwrappedGrid(ROWS, COLS, (r, c) => {
      const cy = ROWS / 2;
      const cx = COLS / 2;
      const dist = Math.sqrt(Math.pow(r - cy, 2) + Math.pow(c - cx, 2));
      const maxDist = Math.sqrt(Math.pow(ROWS/2, 2) + Math.pow(COLS/2, 2));
      return 600 * Math.exp(-Math.pow(dist / (maxDist / 3), 2));
    }),
    coherence: createNoiseGrid(0.85, 0.1),
    amplitude: createNoiseGrid(0.6, 0.2)
  },
  {
    id: 'subsidence',
    region: 'Jakarta, Indonesia',
    satellite: 'NISAR',
    band: 'L-band',
    wavelength_cm: 24.0,
    temporal_baseline_days: 365,
    perpendicular_baseline_m: 45,
    acquisition_date_1: '2025-01-01T00:00:00Z',
    acquisition_date_2: '2026-01-01T00:00:00Z',
    grid_size: [ROWS, COLS],
    description: 'Urban Subsidence',
    peak_displacement_mm: -120, // -120mm subsidence -> 1 fringe
    mean_coherence: 0.92,
    fringe_count: 1,
    wrapped_phase: generateInterferogramGrid(ROWS, COLS, (r, c) => {
      const cy = ROWS / 3;
      const cx = COLS / 2;
      const dist = Math.sqrt(Math.pow((r - cy)*1.5, 2) + Math.pow(c - cx, 2));
      const maxDist = COLS / 1.5;
      const dispMm = -120 * Math.exp(-Math.pow(dist / (maxDist / 2), 2));
      return calculatePhaseFromDisplacement(24.0, dispMm);
    }),
    displacement_mm: generateUnwrappedGrid(ROWS, COLS, (r, c) => {
      const cy = ROWS / 3;
      const cx = COLS / 2;
      const dist = Math.sqrt(Math.pow((r - cy)*1.5, 2) + Math.pow(c - cx, 2));
      const maxDist = COLS / 1.5;
      return -120 * Math.exp(-Math.pow(dist / (maxDist / 2), 2));
    }),
    coherence: createNoiseGrid(0.92, 0.05),
    amplitude: createNoiseGrid(0.8, 0.1)
  },
  {
    id: 'flood',
    region: 'Sundarbans, Bangladesh',
    satellite: 'Sentinel-1',
    band: 'C-band',
    wavelength_cm: 5.6,
    temporal_baseline_days: 12,
    perpendicular_baseline_m: 88,
    acquisition_date_1: '2026-08-10T00:00:00Z',
    acquisition_date_2: '2026-08-22T00:00:00Z',
    grid_size: [ROWS, COLS],
    description: 'Flood Inundation',
    peak_displacement_mm: 0,
    mean_coherence: 0.2, // Decorrelated
    fringe_count: 0,
    wrapped_phase: generateInterferogramGrid(ROWS, COLS, () => (Math.random() - 0.5) * 2 * Math.PI),
    displacement_mm: createUniformGrid(0),
    coherence: generateUnwrappedGrid(ROWS, COLS, (r, c) => {
      // Decorrelated in flooded area (bottom half)
      return r > ROWS / 2 ? Math.random() * 0.15 : 0.8 + Math.random() * 0.1;
    }),
    amplitude: generateUnwrappedGrid(ROWS, COLS, (r, c) => {
      // Specular reflection (dark) in flooded area
      return r > ROWS / 2 ? 0.1 + Math.random() * 0.05 : 0.5 + Math.random() * 0.2;
    })
  },
  {
    id: 'glacier',
    region: 'Alaska Glacier',
    satellite: 'NISAR',
    band: 'L-band',
    wavelength_cm: 24.0,
    temporal_baseline_days: 12,
    perpendicular_baseline_m: 15,
    acquisition_date_1: '2026-01-10T00:00:00Z',
    acquisition_date_2: '2026-01-22T00:00:00Z',
    grid_size: [ROWS, COLS],
    description: 'Glacier Flow',
    peak_displacement_mm: 480,
    mean_coherence: 0.6,
    fringe_count: 4,
    wrapped_phase: generateInterferogramGrid(ROWS, COLS, (r, c) => {
      // Parallel bands
      const flow = (c / COLS);
      const dispMm = flow * 480; 
      return calculatePhaseFromDisplacement(24.0, dispMm);
    }),
    displacement_mm: generateUnwrappedGrid(ROWS, COLS, (r, c) => {
      const flow = (c / COLS);
      return flow * 480;
    }),
    coherence: createNoiseGrid(0.6, 0.15),
    amplitude: createNoiseGrid(0.5, 0.2)
  }
];

export const SAMPLE_CASES = CASE_STUDIES;

