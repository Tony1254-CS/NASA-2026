export interface TimeSeriesPoint {
  date: string;
  displacement_mm: number;
  uncertainty_mm: number;
  coherence: number;
}

export interface CaseStudyTimeSeries {
  id: string;
  region: string;
  points: TimeSeriesPoint[];
  velocity_mm_per_yr: number;
  acceleration_mm_per_yr2: number;
}

/**
 * Generates synthetic displacement time-series points with applied physics modeling.
 */
function generateTimeSeries(
  startDate: string,
  months: number,
  velocity_mm_per_yr: number,
  acceleration_mm_per_yr2: number,
  baseUncertainty: number
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < months; i++) {
    const tYears = i / 12;
    // Kinematic formula for displacement over time
    const disp = velocity_mm_per_yr * tYears + 0.5 * acceleration_mm_per_yr2 * tYears * tYears;
    
    // Simulate natural variance/noise
    const noise = (Math.random() - 0.5) * 2 * baseUncertainty;
    
    points.push({
      date: currentDate.toISOString(),
      displacement_mm: disp + noise,
      uncertainty_mm: baseUncertainty * (1 + tYears * 0.1), // atmospheric noise and decorrelation slightly increases uncertainty over time
      coherence: Math.max(0, Math.min(1, 0.7 + Math.random() * 0.2))
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  return points;
}

export const TIME_SERIES_DATA: Record<string, CaseStudyTimeSeries> = {
  'subsidence': {
    id: 'subsidence',
    region: 'Jakarta, Indonesia',
    points: generateTimeSeries('2024-01-01T00:00:00Z', 36, -100, -5, 3.2), // Base uncertainty representing residual atmospheric noise (±3.2mm)
    velocity_mm_per_yr: -100,
    acceleration_mm_per_yr2: -5
  },
  'volcano': {
    id: 'volcano',
    region: 'Sierra Negra, Galápagos',
    points: generateTimeSeries('2024-01-01T00:00:00Z', 36, 250, 50, 4.0),
    velocity_mm_per_yr: 250,
    acceleration_mm_per_yr2: 50
  }
};
