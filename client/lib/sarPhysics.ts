export const SAR_WAVELENGTHS = {
  'X-band': 3.0,
  'C-band': 5.6,
  'S-band': 9.4,
  'L-band': 24.0,
  'P-band': 70.0
};

/**
 * Calculates line-of-sight (LOS) displacement from unwrapped phase.
 * Formula: d = (λ * Ψ) / (4π)
 * 
 * @param wavelengthCm The radar wavelength in centimeters.
 * @param unwrappedPhaseRad The unwrapped interferometric phase in radians.
 * @returns Ground displacement in millimeters.
 */
export function calculateDisplacement(wavelengthCm: number, unwrappedPhaseRad: number): number {
  // Multiply by 10 to convert cm to mm
  return (wavelengthCm * 10 * unwrappedPhaseRad) / (4 * Math.PI);
}

/**
 * Calculates unwrapped phase from a given displacement.
 * Inverse of the displacement formula.
 * 
 * @param wavelengthCm The radar wavelength in centimeters.
 * @param displacementMm The ground displacement in millimeters.
 * @returns Unwrapped phase in radians.
 */
export function calculatePhaseFromDisplacement(wavelengthCm: number, displacementMm: number): number {
  return (displacementMm * 4 * Math.PI) / (wavelengthCm * 10);
}

export const POLARIZATIONS = [
  { id: 'HH', name: 'Horizontal-Horizontal', description: 'Sensitive to surface roughness and double-bounce scattering (e.g., flooded vegetation, urban areas).' },
  { id: 'HV', name: 'Horizontal-Vertical', description: 'Sensitive to volume scattering (e.g., forest canopy, dense vegetation). Cross-polarized.' },
  { id: 'VH', name: 'Vertical-Horizontal', description: 'Sensitive to volume scattering, similar to HV. Useful for biomass estimation.' },
  { id: 'VV', name: 'Vertical-Vertical', description: 'Sensitive to surface roughness and soil moisture. Good for bare earth and ocean surfaces.' }
];

