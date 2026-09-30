/**
 * Wraps a continuous phase value into the interval [-π, π].
 * 
 * @param phase Continuous (unwrapped) phase in radians.
 * @returns Wrapped phase in radians [-π, π].
 */
export function wrapPhase(phase: number): number {
  const twoPi = 2 * Math.PI;
  let wrapped = (phase + Math.PI) % twoPi;
  if (wrapped < 0) {
    wrapped += twoPi;
  }
  return wrapped - Math.PI;
}

/**
 * Simple 1D Itoh algorithm for phase unwrapping.
 * 
 * @param wrappedPhase Array of wrapped phase values in [-π, π].
 * @returns Array of continuous, unwrapped phase values.
 */
export function unwrapPhase1D(wrappedPhase: number[]): number[] {
  if (wrappedPhase.length === 0) return [];
  
  const unwrapped = new Array(wrappedPhase.length);
  unwrapped[0] = wrappedPhase[0];
  
  for (let i = 1; i < wrappedPhase.length; i++) {
    const diff = wrappedPhase[i] - wrappedPhase[i - 1];
    const wrappedDiff = wrapPhase(diff);
    unwrapped[i] = unwrapped[i - 1] + wrappedDiff;
  }
  
  return unwrapped;
}

/**
 * Generates a 1D representation of a 2D wrapped phase interferogram grid.
 */
export function generateInterferogramGrid(
  rows: number,
  cols: number,
  phaseFn: (r: number, c: number) => number
): number[] {
  const grid = new Float32Array(rows * cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      grid[i * cols + j] = wrapPhase(phaseFn(i, j));
    }
  }
  return Array.from(grid);
}

/**
 * Generates a 1D representation of a 2D continuous/unwrapped grid.
 */
export function generateUnwrappedGrid(
  rows: number,
  cols: number,
  valueFn: (r: number, c: number) => number
): number[] {
  const grid = new Float32Array(rows * cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      grid[i * cols + j] = valueFn(i, j);
    }
  }
  return Array.from(grid);
}
