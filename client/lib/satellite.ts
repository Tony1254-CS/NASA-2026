import * as satellite from 'satellite.js';

// Cache for TLE data
interface TleCache {
  lines: [string, string];
  timestamp: number;
}

let tleCache: TleCache | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetches the latest TLE data for NISAR (NORAD ID 65053) from CelesTrak
 */
export async function getNisarTle(): Promise<[string, string]> {
  if (tleCache && Date.now() - tleCache.timestamp < CACHE_DURATION) {
    return tleCache.lines;
  }

  try {
    const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=65053&FORMAT=TLE');
    if (!response.ok) {
      throw new Error('Failed to fetch TLE data');
    }
    const text = await response.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length >= 3) {
      tleCache = {
        lines: [lines[1], lines[2]],
        timestamp: Date.now()
      };
      return tleCache.lines;
    } else if (lines.length === 2) {
      tleCache = {
        lines: [lines[0], lines[1]],
        timestamp: Date.now()
      };
      return tleCache.lines;
    }
    throw new Error('Invalid TLE format received');
  } catch (error) {
    console.error('Error fetching TLE:', error);
    // Fallback TLE for NISAR (placeholder, in case API fails)
    return [
      '1 65053U 24016A   24140.50000000  .00000000  00000-0  00000-0 0  9997',
      '2 65053  98.4000   0.0000 0001000   0.0000   0.0000 14.00000000    10'
    ];
  }
}

export async function getSatellitePosition(date: Date = new Date()) {
  const tle = await getNisarTle();
  const satrec = satellite.twoline2satrec(tle[0], tle[1]);
  
  const positionAndVelocity = satellite.propagate(satrec, date);
  const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
  
  if (!positionEci) {
    throw new Error('Failed to propagate satellite position');
  }

  const gmst = satellite.gstime(date);
  const positionGd = satellite.eciToGeodetic(positionEci, gmst);
  
  return {
    longitude: satellite.degreesLong(positionGd.longitude),
    latitude: satellite.degreesLat(positionGd.latitude),
    height: positionGd.height,
  };
}

export async function getNextPass(userLat: number, userLon: number): Promise<Date> {
  const tle = await getNisarTle();
  const satrec = satellite.twoline2satrec(tle[0], tle[1]);
  
  let currentDate = new Date();
  const maxSearchDays = 7;
  const maxSearchTime = currentDate.getTime() + maxSearchDays * 24 * 60 * 60 * 1000;
  
  const userObserver = {
    longitude: userLon * Math.PI / 180,
    latitude: userLat * Math.PI / 180,
    height: 0
  };

  while (currentDate.getTime() < maxSearchTime) {
    const positionAndVelocity = satellite.propagate(satrec, currentDate);
    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
    
    if (positionEci) {
      const gmst = satellite.gstime(currentDate);
      const positionEcf = satellite.eciToEcf(positionEci, gmst);
      const lookAngles = satellite.ecfToLookAngles(userObserver, positionEcf);
      
      const elevationDeg = lookAngles.elevation * 180 / Math.PI;
      if (elevationDeg > 10) {
        return currentDate;
      }
    }
    currentDate = new Date(currentDate.getTime() + 60 * 1000);
  }
  
  throw new Error('No pass found within the search window');
}
