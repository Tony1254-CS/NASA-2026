/**
 * Centralized API client utility
 * Reads process.env.NEXT_PUBLIC_API_URL dynamically
 */

export function getApiUrl(path: string = ''): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
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
