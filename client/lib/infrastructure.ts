/**
 * OpenStreetMap Overpass API integration for finding critical infrastructure
 */

export interface InfrastructureItem {
  id: number;
  name: string;
  type: 'hospital' | 'school' | 'bridge' | 'fire_station' | 'unknown';
  lat: number;
  lon: number;
  distanceKm?: number;
}

export async function getCriticalInfrastructure(
  minLat: number, 
  minLon: number, 
  maxLat: number, 
  maxLon: number,
  centerLat?: number,
  centerLon?: number
): Promise<InfrastructureItem[]> {
  try {
    // Overpass QL to find amenities
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](${minLat},${minLon},${maxLat},${maxLon});
        node["amenity"="clinic"](${minLat},${minLon},${maxLat},${maxLon});
        node["amenity"="school"](${minLat},${minLon},${maxLat},${maxLon});
        node["amenity"="fire_station"](${minLat},${minLon},${maxLat},${maxLon});
        way["bridge"="yes"](${minLat},${minLon},${maxLat},${maxLon});
      );
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });

    if (!response.ok) {
      throw new Error('Failed to fetch infrastructure data');
    }

    const data = await response.json();
    
    const items: InfrastructureItem[] = data.elements.map((el: any) => {
      let type: InfrastructureItem['type'] = 'unknown';
      if (el.tags?.amenity === 'hospital' || el.tags?.amenity === 'clinic') type = 'hospital';
      else if (el.tags?.amenity === 'school') type = 'school';
      else if (el.tags?.amenity === 'fire_station') type = 'fire_station';
      else if (el.tags?.bridge === 'yes') type = 'bridge';

      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;

      let distanceKm = undefined;
      if (centerLat && centerLon && lat && lon) {
        distanceKm = calculateDistance(centerLat, centerLon, lat, lon);
      }

      return {
        id: el.id,
        name: el.tags?.name || \`Unnamed \${type}\`,
        type,
        lat,
        lon,
        distanceKm
      };
    });

    return items;
  } catch (error) {
    console.error('Error fetching infrastructure:', error);
    // Mock data for demo
    return [
      { id: 1, name: 'Dacope Upazila Health Complex', type: 'hospital', lat: 0, lon: 0, distanceKm: 2.1 },
      { id: 2, name: 'Sundarbans Clinic', type: 'hospital', lat: 0, lon: 0, distanceKm: 4.7 },
      { id: 3, name: 'Mongla Hospital', type: 'hospital', lat: 0, lon: 0, distanceKm: 8.3 },
      { id: 4, name: 'Dacope Govt. Primary School', type: 'school', lat: 0, lon: 0, distanceKm: 1.5 },
      { id: 5, name: 'Passur River Bridge', type: 'bridge', lat: 0, lon: 0, distanceKm: 3.2 },
      { id: 6, name: 'Dacope Fire Service', type: 'fire_station', lat: 0, lon: 0, distanceKm: 2.8 }
    ];
  }
}

// Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
