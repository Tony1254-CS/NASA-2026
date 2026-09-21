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

export interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

export interface CaseListItem {
  id: string;
  case_id: string;
  event_type: string;
  geometry?: GeoJSONGeometry | null;
  observation_start: string;
  observation_end: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedCasesResponse {
  items: CaseListItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface NisarMeasurementResponse {
  id: string;
  case_id: string;
  product_id: string;
  observation_time: string;
  delta_backscatter?: number | null;
  affected_area?: number | null;
  spatial_extent?: GeoJSONGeometry | null;
  change_metric?: string | null;
  raster_reference?: string | null;
  created_at: string;
}

export interface EvidenceResponse {
  id: string;
  case_id: string;
  source_type: string;
  collection_id?: string | null;
  granule_id?: string | null;
  time_start?: string | null;
  time_end?: string | null;
  spatial_extent?: GeoJSONGeometry | null;
  role?: string | null;
  status: string;
  visualization_uri?: string | null;
  created_at: string;
}

export interface ChallengeCheckResponse {
  id: string;
  case_id: string;
  check_type: string;
  status: string;
  value?: string | null;
  threshold?: string | null;
  rationale?: string | null;
  source?: string | null;
  created_at: string;
}

export interface InterpretationResponse {
  id: string;
  case_id: string;
  narrative: string;
  uncertainty?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProvenanceResponse {
  id: string;
  case_id: string;
  evidence_id?: string | null;
  collection_id?: string | null;
  granule_id?: string | null;
  product_id?: string | null;
  acquisition_time?: string | null;
  processing_method?: string | null;
  calculation_method?: string | null;
  source_reference?: string | null;
  created_at: string;
}

export interface FieldObservationResponse {
  id: string;
  case_id: string;
  photo_reference?: string | null;
  note?: string | null;
  observed_at: string;
  location?: GeoJSONGeometry | null;
  created_at: string;
}

export interface FieldObservationCreatePayload {
  photo_reference?: string | null;
  note?: string | null;
  observed_at: string;
  latitude: number;
  longitude: number;
}

export interface CaseDetailResponse {
  id: string;
  case_id: string;
  event_type: string;
  geometry?: GeoJSONGeometry | null;
  observation_start: string;
  observation_end: string;
  status: string;
  created_at: string;
  updated_at: string;
  nisar_measurements: NisarMeasurementResponse[];
  evidence: EvidenceResponse[];
  challenge_checks: ChallengeCheckResponse[];
  interpretations: InterpretationResponse[];
  provenance_records: ProvenanceResponse[];
  field_observations: FieldObservationResponse[];
}

export interface TimelineEventItem {
  id: string;
  case_id: string;
  timestamp: string;
  phase: 'before' | 'change' | 'after';
  event_type: string;
  title: string;
  details?: Record<string, any> | null;
}

export interface TimelineResponse {
  case_id: string;
  events: TimelineEventItem[];
}

/**
 * Fetch health status of backend server
 */
export async function fetchHealthStatus(): Promise<HealthResponse> {
  const url = getApiUrl('/health');
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch paginated list of TRACE cases
 */
export async function fetchCases(page: number = 1, pageSize: number = 20): Promise<PaginatedCasesResponse> {
  const url = getApiUrl(`/api/cases?page=${page}&page_size=${pageSize}`);
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch full case detail by case_id
 */
export async function fetchCaseDetail(caseId: string): Promise<CaseDetailResponse> {
  const url = getApiUrl(`/api/cases/${encodeURIComponent(caseId)}`);
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch chronological timeline for a case
 */
export async function fetchCaseTimeline(caseId: string): Promise<TimelineResponse> {
  const url = getApiUrl(`/api/cases/${encodeURIComponent(caseId)}/timeline`);
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Record a ground field observation for a specific case ID
 */
export async function createFieldObservation(
  caseId: string,
  payload: FieldObservationCreatePayload
): Promise<FieldObservationResponse> {
  const url = getApiUrl(`/api/cases/${encodeURIComponent(caseId)}/field-observations`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `HTTP ${res.status} failed to submit field observation`);
  }

  return res.json();
}
