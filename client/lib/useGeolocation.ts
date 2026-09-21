'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export type LocationStatus = 'prompt' | 'loading' | 'granted' | 'denied' | 'unavailable';

export interface UseGeolocationReturn {
  location: LocationCoordinates | null;
  status: LocationStatus;
  error: string | null;
  requestLocation: () => void;
}

/**
 * Calculates Haversine distance between two sets of GPS coordinates in kilometers.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Helper to extract centroid (latitude, longitude) from GeoJSON geometry
 */
export function getGeometryCentroid(geometry: any): { latitude: number; longitude: number } | null {
  if (!geometry || !geometry.coordinates) return null;

  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
    return {
      longitude: geometry.coordinates[0],
      latitude: geometry.coordinates[1],
    };
  }

  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0) {
    const ring = geometry.coordinates[0];
    if (!Array.isArray(ring) || ring.length === 0) return null;

    let sumLat = 0;
    let sumLon = 0;
    let count = 0;

    for (const pt of ring) {
      if (Array.isArray(pt) && pt.length >= 2) {
        sumLon += pt[0];
        sumLat += pt[1];
        count++;
      }
    }

    if (count === 0) return null;
    return {
      longitude: sumLon / count,
      latitude: sumLat / count,
    };
  }

  return null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [status, setStatus] = useState<LocationStatus>('prompt');
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unavailable');
      setError('Geolocation is not supported by your browser or device.');
      return;
    }

    setStatus('loading');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setStatus('granted');
        setError(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          setError('Location permission was denied.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus('unavailable');
          setError('Location information is unavailable.');
        } else {
          setStatus('unavailable');
          setError('Timed out fetching location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  useEffect(() => {
    // Attempt automatic soft check on mount
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      requestLocation();
    } else {
      setStatus('unavailable');
      setError('Geolocation unavailable');
    }
  }, [requestLocation]);

  return {
    location,
    status,
    error,
    requestLocation,
  };
}
