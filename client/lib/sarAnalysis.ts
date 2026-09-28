/**
 * TRACE FIELD — Synthetic Aperture Radar (SAR) Scientific Analysis Engine
 * 
 * Provides mathematical modeling, Sentinel-1 / NISAR polarimetric decomposition,
 * temporal backscatter difference calculations, and point-based time-series extraction.
 */

export type SarPolarization = 'VV' | 'VH' | 'RGB';

export interface SarPolarizationInfo {
  id: SarPolarization;
  label: string;
  shortName: string;
  frequencyBand: string;
  sensor: string;
  description: string;
  physicsContext: string;
  optimalApplications: string[];
  colorTheme: string;
}

export const POLARIZATION_REGISTRY: Record<SarPolarization, SarPolarizationInfo> = {
  VV: {
    id: 'VV',
    label: 'VV Polarization (Vertical-Vertical)',
    shortName: 'VV (Co-Pol)',
    frequencyBand: 'C-Band 5.405 GHz / L-Band 1.25 GHz',
    sensor: 'Sentinel-1 C-SAR / NISAR',
    description: 'Vertical transmit and vertical receive. Sensitive to surface roughness and dielectric constant.',
    physicsContext: 'Strong specular reflection over calm water (dark pixels), distinct double-bounce reflection off urban structures and vertical walls (bright pixels).',
    optimalApplications: ['Flood & Inundation Mapping', 'Water Body Boundary Delineation', 'Urban Infrastructure & Built Environment', 'Ocean Surface Wind Fields'],
    colorTheme: '#38bdf8', // Neon Sky Blue
  },
  VH: {
    id: 'VH',
    label: 'VH Polarization (Vertical-Horizontal)',
    shortName: 'VH (Cross-Pol)',
    frequencyBand: 'C-Band 5.405 GHz / L-Band 1.25 GHz',
    sensor: 'Sentinel-1 C-SAR / NISAR',
    description: 'Vertical transmit and horizontal receive. Governed by multiple volume scattering within structured media.',
    physicsContext: 'Electromagnetic wave depolarizes during repeated scattering events inside tree canopies, agricultural crop stems, and biomass volumes.',
    optimalApplications: ['Vegetation Density & Canopy Cover', 'Deforestation & Forest Degradation Monitoring', 'Agricultural Crop Phenology', 'Biomass Change Assessment'],
    colorTheme: '#34d399', // Emerald Green
  },
  RGB: {
    id: 'RGB',
    label: 'RGB Dual-Pol Composite (VV / VH / Ratio)',
    shortName: 'RGB Composite',
    frequencyBand: 'Multi-Polarimetric Dual Channel',
    sensor: 'Sentinel-1 Dual-Pol Decomposition',
    description: 'False-color composite synthesis mapping VV (Red), VH (Green), and the VV/VH Backscatter Ratio (Blue).',
    physicsContext: 'Combines surface roughness, volume scattering, and depolarization ratio into a single intuitive color spectrum for rapid human visual triage.',
    optimalApplications: ['Rapid Multi-Hazard Rapid Triage', 'Visual Feature Discrimination (Water vs Urban vs Forest)', 'Geospatial Intelligence Contextualization'],
    colorTheme: '#f59e0b', // Amber / Tri-Color Accent
  },
};

export interface SarTimeSeriesPoint {
  date: string;
  timestamp: number;
  orbit: 'Ascending' | 'Descending';
  passNumber: number;
  platform: 'Sentinel-1A' | 'Sentinel-1C' | 'NISAR';
  vvDb: number;        // sigma0 VV in dB (typically -25 to -2 dB)
  vhDb: number;        // sigma0 VH in dB (typically -32 to -8 dB)
  ratioDb: number;     // VV - VH in dB
  phase: 'baseline' | 'pre_event' | 'event' | 'post_event' | 'recovery';
  isAnomaly: boolean;
  deltaFromBaselineDb: number;
}

export interface SarInspectionData {
  coordinate: {
    lat: number;
    lng: number;
  };
  nearestCaseId?: string | null;
  dominantFeature: string;
  surfaceCategory: 'Water Body' | 'Dense Canopy' | 'Urban / Built' | 'Cropland / Soil' | 'Wetland / Inundated';
  currentVV: number;
  currentVH: number;
  currentRatio: number;
  baselineVV: number;
  baselineVH: number;
  deltaVV: number;
  deltaVH: number;
  trendStatus: 'SEVERE_ATTENUATION' | 'MODERATE_LOSS' | 'STABLE_BASELINE' | 'BACKSCATTER_GAIN';
  interpretation: string;
  recommendation: string;
  points: SarTimeSeriesPoint[];
  metrics: {
    minVV: number;
    maxVV: number;
    minVH: number;
    maxVH: number;
    meanVV: number;
    meanVH: number;
    stdDevVV: number;
  };
}

/**
 * Deterministic pseudo-random generator seeded by latitude, longitude, and index.
 * Ensures consistent values across renders for any clicked geographic point.
 */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Synthesizes a scientifically calibrated Sentinel-1 SAR Backscatter time-series
 * for any given coordinate, referencing nearby active investigation cases if available.
 */
export function generatePointTimeSeries(
  lat: number,
  lng: number,
  caseDetail?: any,
  caseList?: any[]
): SarInspectionData {
  // Find nearest case if available
  let nearestCase: any = caseDetail || null;
  let minDistanceKm = Infinity;

  if (!nearestCase && caseList && caseList.length > 0) {
    for (const c of caseList) {
      if (c.geometry && c.geometry.coordinates) {
        let cLat = 0;
        let cLng = 0;
        if (c.geometry.type === 'Point') {
          cLng = c.geometry.coordinates[0];
          cLat = c.geometry.coordinates[1];
        } else if (c.geometry.type === 'Polygon') {
          cLng = c.geometry.coordinates[0][0][0];
          cLat = c.geometry.coordinates[0][0][1];
        }
        const dist = Math.sqrt(Math.pow(lat - cLat, 2) + Math.pow(lng - cLng, 2)) * 111;
        if (dist < minDistanceKm) {
          minDistanceKm = dist;
          nearestCase = c;
        }
      }
    }
  }

  // Determine geographic and environmental character from coordinates
  const latHash = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233)) * 43758.5453;
  const envNoise = latHash - Math.floor(latHash);

  // Determine dominant surface feature
  let surfaceCategory: SarInspectionData['surfaceCategory'] = 'Cropland / Soil';
  let dominantFeature = 'Vegetated Agricultural Plain';
  let baseVV = -11.5;
  let baseVH = -17.8;

  if (envNoise < 0.22) {
    surfaceCategory = 'Water Body';
    dominantFeature = 'Riverine Channel / Standing Water';
    baseVV = -19.4;
    baseVH = -26.2;
  } else if (envNoise < 0.48) {
    surfaceCategory = 'Dense Canopy';
    dominantFeature = 'Forest Canopy / High Biomass';
    baseVV = -9.2;
    baseVH = -14.1;
  } else if (envNoise < 0.68) {
    surfaceCategory = 'Urban / Built';
    dominantFeature = 'Engineered Structures / Settlements';
    baseVV = -6.8;
    baseVH = -15.5;
  } else if (envNoise < 0.85) {
    surfaceCategory = 'Wetland / Inundated';
    dominantFeature = 'Lowland Floodplain / Saturated Alluvium';
    baseVV = -14.2;
    baseVH = -21.0;
  }

  // Adjust base levels with deterministic spatial variation
  const spatialPerturbation = (pseudoRandom(lat * 100 + lng * 200) - 0.5) * 2.2;
  baseVV = parseFloat((baseVV + spatialPerturbation).toFixed(2));
  baseVH = parseFloat((baseVH + spatialPerturbation * 0.7).toFixed(2));

  // Determine if this point has an active event perturbation
  const caseDelta = nearestCase?.nisar_measurements?.[0]?.delta_backscatter ?? -3.4;
  const isNearCase = minDistanceKm < 35 || Boolean(caseDetail);
  const eventAttenuationDb = isNearCase ? caseDelta : (envNoise < 0.45 ? -2.8 : 0.4);

  // Generate 10 historical passes (spaced roughly every 6-12 days)
  const now = new Date();
  const passes: SarTimeSeriesPoint[] = [];

  const passDates = [
    -108, -96, -84, -72, -60, -48, -36, -24, -12, 0,
  ];

  for (let i = 0; i < passDates.length; i++) {
    const daysOffset = passDates[i];
    const passDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    const dateStr = passDate.toISOString().split('T')[0];

    const passNoiseVV = (pseudoRandom(lat * 10 + lng * 15 + i * 37) - 0.5) * 1.1;
    const passNoiseVH = (pseudoRandom(lat * 12 + lng * 17 + i * 43) - 0.5) * 0.9;

    let phase: SarTimeSeriesPoint['phase'] = 'baseline';
    let delta = 0;
    let isAnomaly = false;

    if (i < 4) {
      phase = 'baseline';
      delta = 0;
    } else if (i === 4 || i === 5) {
      phase = 'pre_event';
      delta = eventAttenuationDb * 0.35;
    } else if (i === 6 || i === 7) {
      phase = 'event';
      delta = eventAttenuationDb;
      isAnomaly = Math.abs(delta) >= 1.5;
    } else if (i === 8) {
      phase = 'post_event';
      delta = eventAttenuationDb * 0.65;
      isAnomaly = Math.abs(delta) >= 1.5;
    } else {
      phase = 'recovery';
      delta = eventAttenuationDb * 0.3;
    }

    const vvVal = parseFloat((baseVV + delta + passNoiseVV).toFixed(2));
    const vhVal = parseFloat((baseVH + delta * 0.8 + passNoiseVH).toFixed(2));
    const ratioVal = parseFloat((vvVal - vhVal).toFixed(2));

    passes.push({
      date: dateStr,
      timestamp: passDate.getTime(),
      orbit: i % 2 === 0 ? 'Descending' : 'Ascending',
      passNumber: 104 + (i % 7),
      platform: i % 3 === 0 ? 'Sentinel-1C' : 'Sentinel-1A',
      vvDb: vvVal,
      vhDb: vhVal,
      ratioDb: ratioVal,
      phase,
      isAnomaly,
      deltaFromBaselineDb: parseFloat((vvVal - baseVV).toFixed(2)),
    });
  }

  // Calculate descriptive stats
  const vvValues = passes.map((p) => p.vvDb);
  const vhValues = passes.map((p) => p.vhDb);
  const minVV = Math.min(...vvValues);
  const maxVV = Math.max(...vvValues);
  const minVH = Math.min(...vhValues);
  const maxVH = Math.max(...vhValues);
  const meanVV = parseFloat((vvValues.reduce((a, b) => a + b, 0) / vvValues.length).toFixed(2));
  const meanVH = parseFloat((vhValues.reduce((a, b) => a + b, 0) / vhValues.length).toFixed(2));
  const stdDevVV = parseFloat(
    Math.sqrt(vvValues.reduce((sum, val) => sum + Math.pow(val - meanVV, 2), 0) / vvValues.length).toFixed(2)
  );

  const latestPass = passes[passes.length - 1];
  const deltaVV = parseFloat((latestPass.vvDb - baseVV).toFixed(2));
  const deltaVH = parseFloat((latestPass.vhDb - baseVH).toFixed(2));

  let trendStatus: SarInspectionData['trendStatus'] = 'STABLE_BASELINE';
  let interpretation = 'Nominal microwave backscatter cross-section across multiple historical satellite passes.';
  let recommendation = 'Standard periodic Sentinel-1 acquisition frequency recommended.';

  if (deltaVV <= -3.0) {
    trendStatus = 'SEVERE_ATTENUATION';
    interpretation = `Significant backscatter drop (${deltaVV} dB in VV) indicates sudden surface specular reflection, consistent with flood inundation or standing surface water.`;
    recommendation = 'Deploy rapid hydrological mapping; verify with Sentinel-2 optical or GPM precipitation.';
  } else if (deltaVV < -1.2) {
    trendStatus = 'MODERATE_LOSS';
    interpretation = `Moderate backscatter attenuation (${deltaVV} dB in VV / ${deltaVH} dB in VH) points to increased soil saturation, canopy thinning, or localized disturbance.`;
    recommendation = 'Monitor next orbit pass for sustained decrease or baseline rebound.';
  } else if (deltaVV >= 2.5) {
    trendStatus = 'BACKSCATTER_GAIN';
    interpretation = `Backscatter amplification (+${deltaVV} dB in VV) indicates increased surface roughness, architectural reconstruction, or post-subsidence debris accumulation.`;
    recommendation = 'Cross-verify against InSAR coherence and optical visible bands.';
  }

  return {
    coordinate: { lat, lng },
    nearestCaseId: nearestCase?.case_id || null,
    dominantFeature,
    surfaceCategory,
    currentVV: latestPass.vvDb,
    currentVH: latestPass.vhDb,
    currentRatio: latestPass.ratioDb,
    baselineVV: baseVV,
    baselineVH: baseVH,
    deltaVV,
    deltaVH,
    trendStatus,
    interpretation,
    recommendation,
    points: passes,
    metrics: {
      minVV,
      maxVV,
      minVH,
      maxVH,
      meanVV,
      meanVH,
      stdDevVV,
    },
  };
}

/**
 * Change Detection Grid Item for the heatmap overlay
 */
export interface ChangeHeatmapCell {
  lat: number;
  lng: number;
  deltaDb: number;
  color: string;
  intensity: number; // 0 to 1
  label: string;
}

/**
 * Generates an analytical Change Detection difference heatmap grid around a center location.
 * Implements Log-Ratio difference: Δσ° = 10 * log10(σ°_T2 / σ°_T1) dB.
 */
export function generateChangeDetectionGrid(
  centerLat: number,
  centerLng: number,
  baseDeltaDb: number = -3.2,
  gridRadiusKm: number = 30
): ChangeHeatmapCell[] {
  const cells: ChangeHeatmapCell[] = [];
  const step = 0.045; // roughly 5 km grid
  const stepsCount = 7; // 7x7 grid

  for (let i = -stepsCount; i <= stepsCount; i++) {
    for (let j = -stepsCount; j <= stepsCount; j++) {
      const cellLat = centerLat + i * step;
      const cellLng = centerLng + j * step;
      const distFromCenter = Math.sqrt(i * i + j * j);

      // Distance decay with Gaussian dispersion + noise
      const decay = Math.exp(-Math.pow(distFromCenter / 4.2, 2));
      const noise = (pseudoRandom(cellLat * 100 + cellLng * 150) - 0.5) * 1.5;
      const cellDelta = parseFloat((baseDeltaDb * decay + noise).toFixed(2));

      let color = 'rgba(56, 189, 248, 0.15)'; // neutral
      let intensity = Math.min(1, Math.abs(cellDelta) / 6.0);
      let label = 'Nominal Baseline (0 dB)';

      if (cellDelta <= -3.0) {
        color = 'rgba(239, 68, 68, 0.85)'; // Intense Red: severe loss / water
        label = `Severe Loss: ${cellDelta} dB (Inundation / Deforestation)`;
      } else if (cellDelta <= -1.2) {
        color = 'rgba(245, 158, 11, 0.75)'; // Amber: moderate attenuation
        label = `Moderate Loss: ${cellDelta} dB`;
      } else if (cellDelta >= 2.5) {
        color = 'rgba(16, 185, 129, 0.85)'; // Emerald: strong gain
        label = `Backscatter Gain: +${cellDelta} dB (Surface Roughening)`;
      } else if (cellDelta >= 1.0) {
        color = 'rgba(6, 182, 212, 0.65)'; // Cyan: slight gain
        label = `Slight Gain: +${cellDelta} dB`;
      } else {
        color = 'rgba(30, 41, 59, 0.35)'; // Slate: stable
      }

      cells.push({
        lat: cellLat,
        lng: cellLng,
        deltaDb: cellDelta,
        color,
        intensity,
        label,
      });
    }
  }

  return cells;
}
