/**
 * Pre-computed prediction data for the Predict screen demo.
 */

export const PREDICTIONS = {
  jakartaSubsidence: {
    velocity_mm_per_year: -34,
    current_cumulative_mm: -28,
    threshold_structural: -50,  // mm
    threshold_foundation: -100, // mm
    date_structural: '2027-03-15',
    date_foundation: '2027-11-22',
    affected_population: 23147,
    schools: 7,
    hospitals: 2,
  },
  chilmariErosion: {
    velocity_mm_per_year: -18,
    current_cumulative_mm: -12,
    threshold_structural: -40,
    date_structural: '2027-08-01',
    affected_population: 8241,
    schools: 4,
    hospitals: 1,
  },
};
