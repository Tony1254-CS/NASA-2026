/**
 * Centralized API client utility
 * Environment-driven URL helper (process.env.NEXT_PUBLIC_API_URL)
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getApiUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export interface HealthResponse {
  status: string;
  service: string;
  version?: string;
  timestamp?: string;
}

export async function fetchHealthStatus(): Promise<HealthResponse> {
  const url = getApiUrl('/health');
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}
