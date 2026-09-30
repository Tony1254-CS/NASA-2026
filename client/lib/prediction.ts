import { TimeSeriesPoint } from './sampleTimeSeries';

export interface PredictionResult {
  slope: number; // Represents velocity
  intercept: number;
  rSquared: number;
  projectedPoints: {
    date: string;
    displacement_mm: number;
    uncertainty_upper_mm: number;
    uncertainty_lower_mm: number;
  }[];
}

/**
 * Calculates a linear regression and projects future values with expanding uncertainty cone.
 * Used for estimating time-to-failure thresholds for structures.
 * 
 * @param historicalPoints Array of measured time-series points.
 * @param projectionMonths How many months ahead to forecast.
 */
export function calculateLinearRegression(
  historicalPoints: TimeSeriesPoint[],
  projectionMonths: number
): PredictionResult {
  if (historicalPoints.length < 2) {
    throw new Error('Need at least 2 points for regression');
  }

  // Use fractional years relative to first point
  const firstTime = new Date(historicalPoints[0].date).getTime();
  const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
  
  const xs = historicalPoints.map(p => (new Date(p.date).getTime() - firstTime) / msPerYear);
  const ys = historicalPoints.map(p => p.displacement_mm);
  
  const n = xs.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumX2 += xs[i] * xs[i];
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared and standard error
  let ssTot = 0, ssRes = 0;
  const meanY = sumY / n;
  for (let i = 0; i < n; i++) {
    const predicted = slope * xs[i] + intercept;
    ssTot += Math.pow(ys[i] - meanY, 2);
    ssRes += Math.pow(ys[i] - predicted, 2);
  }
  const rSquared = 1 - (ssRes / ssTot);
  const standardError = Math.sqrt(ssRes / (n - 2));

  // Generate projected points
  const projectedPoints = [];
  const lastPointTimeMs = new Date(historicalPoints[historicalPoints.length - 1].date).getTime();
  const meanX = sumX / n;
  
  for (let i = 1; i <= projectionMonths; i++) {
    const projTimeMs = lastPointTimeMs + (i * 30.44 * 24 * 60 * 60 * 1000); // avg month ms
    const tYears = (projTimeMs - firstTime) / msPerYear;
    
    const disp = slope * tYears + intercept;
    
    // Expanding uncertainty cone formula for linear regression projection
    const uncertaintyMultiplier = Math.sqrt(1 + 1/n + Math.pow(tYears - meanX, 2) / (sumX2 - sumX*sumX/n));
    // 95% confidence interval (approx 1.96 * SE)
    const marginOfError = 1.96 * standardError * uncertaintyMultiplier;
    
    projectedPoints.push({
      date: new Date(projTimeMs).toISOString(),
      displacement_mm: disp,
      uncertainty_upper_mm: disp + marginOfError,
      uncertainty_lower_mm: disp - marginOfError
    });
  }
  
  return {
    slope,
    intercept,
    rSquared,
    projectedPoints
  };
}
