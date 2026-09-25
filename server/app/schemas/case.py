from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator


class GeoJSONGeometry(BaseModel):
    type: str
    coordinates: Any


class CaseListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    event_type: str
    geometry: Optional[GeoJSONGeometry] = None
    observation_start: datetime
    observation_end: datetime
    status: str
    created_at: datetime
    updated_at: datetime


class PaginatedCasesResponse(BaseModel):
    items: List[CaseListItem]
    page: int
    page_size: int
    total: int


class NisarMeasurementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    product_id: str
    observation_time: datetime
    delta_backscatter: Optional[float] = None
    affected_area: Optional[float] = None
    spatial_extent: Optional[GeoJSONGeometry] = None
    change_metric: Optional[str] = None
    raster_reference: Optional[str] = None
    created_at: datetime


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    source_type: str
    collection_id: Optional[str] = None
    granule_id: Optional[str] = None
    time_start: Optional[datetime] = None
    time_end: Optional[datetime] = None
    spatial_extent: Optional[GeoJSONGeometry] = None
    role: Optional[str] = None
    status: str
    visualization_uri: Optional[str] = None
    created_at: datetime


class ChallengeCheckResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    check_type: str
    status: str
    value: Optional[str] = None
    threshold: Optional[str] = None
    rationale: Optional[str] = None
    source: Optional[str] = None
    created_at: datetime


class InterpretationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    narrative: str
    uncertainty: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class ProvenanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    evidence_id: Optional[str] = None
    collection_id: Optional[str] = None
    granule_id: Optional[str] = None
    product_id: Optional[str] = None
    acquisition_time: Optional[datetime] = None
    processing_method: Optional[str] = None
    calculation_method: Optional[str] = None
    source_reference: Optional[str] = None
    created_at: datetime


class FieldObservationCreate(BaseModel):
    user_id: Optional[str] = "community_sentinel_anon"
    photo_reference: Optional[str] = None
    note: Optional[str] = None
    observed_at: datetime
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    source_type: Optional[str] = "community_sentinel"


class FieldObservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    user_id: Optional[str] = None
    photo_reference: Optional[str] = None
    note: Optional[str] = None
    observed_at: datetime
    location: Optional[GeoJSONGeometry] = None
    source_type: str = "community_sentinel"
    source: str = "COMMUNITY_OBSERVATION"
    verification_state: str = "PENDING"  # PENDING | USER_CONFIRMED | CROSS_CHECKED | SUPPORTED | REJECTED
    sentinel_tier: str = "ACTIVE_REPORTER"  # NEW_REPORTER | ACTIVE_REPORTER | VERIFIED_CONTRIBUTOR
    created_at: datetime



class TimelineEventItem(BaseModel):
    id: str
    case_id: str
    timestamp: datetime
    phase: str  # "before" | "change" | "after"
    event_type: str
    title: str
    details: Optional[Dict[str, Any]] = None


class TimelineResponse(BaseModel):
    case_id: str
    events: List[TimelineEventItem]


class ThresholdAlertCreate(BaseModel):
    metric_name: str = "delta_backscatter"
    threshold_value: float = -2.0
    comparison: str = "less_than"
    is_active: bool = True


class ThresholdAlertUpdate(BaseModel):
    metric_name: Optional[str] = None
    threshold_value: Optional[float] = None
    comparison: Optional[str] = None
    is_active: Optional[bool] = None
    triggered_state: Optional[str] = None
    acknowledgement_status: Optional[str] = None


class AlertAcknowledgePayload(BaseModel):
    acknowledgement_status: Optional[str] = None
    status: Optional[str] = None

    @field_validator("status", "acknowledgement_status", mode="before")
    @classmethod
    def validate_status_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v_upper = str(v).upper()
        if v_upper not in {"UNREAD", "READ", "ACKNOWLEDGED"}:
            raise ValueError("Invalid acknowledgement status. Must be UNREAD, READ, or ACKNOWLEDGED.")
        return v_upper

    def get_status(self) -> str:
        val = self.acknowledgement_status or self.status or "ACKNOWLEDGED"
        val_upper = str(val).upper()
        if val_upper not in {"UNREAD", "READ", "ACKNOWLEDGED"}:
            raise ValueError("Invalid acknowledgement status. Must be UNREAD, READ, or ACKNOWLEDGED.")
        return val_upper



class ThresholdAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    evidence_id: Optional[str] = None
    metric_name: str
    threshold_value: float
    comparison: str
    is_active: bool
    triggered_state: str
    alert_state: str = "UNAVAILABLE"  # OBSERVED CHANGE | POTENTIAL CHANGE | INCONCLUSIVE | REJECTED | UNAVAILABLE
    acknowledgement_status: str = "UNREAD"  # UNREAD | READ | ACKNOWLEDGED
    safe_message: Optional[str] = None
    last_evaluated_val: Optional[float] = None
    last_triggered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime



class CaseDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    event_type: str
    geometry: Optional[GeoJSONGeometry] = None
    observation_start: datetime
    observation_end: datetime
    status: str
    created_at: datetime
    updated_at: datetime
    nisar_measurements: List[NisarMeasurementResponse] = []
    evidence: List[EvidenceResponse] = []
    challenge_checks: List[ChallengeCheckResponse] = []
    interpretations: List[InterpretationResponse] = []
    provenance_records: List[ProvenanceResponse] = []
    field_observations: List[FieldObservationResponse] = []
    threshold_alerts: List[ThresholdAlertResponse] = []


class GlobalEventItem(BaseModel):
    case_id: str
    event_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    observation_start: datetime
    observation_end: datetime
    status: str
    evidence_status: str  # "SUPPORTED" | "INCONCLUSIVE" | "REJECTED" | "UNAVAILABLE"
    audit_verdict: str     # "SUPPORTED" | "INCONCLUSIVE" | "REJECTED" | "UNAVAILABLE"
    ground_truth_count: int = 0
    provenance_count: int = 0
    created_at: datetime


class GlobalEventsResponse(BaseModel):
    items: List[GlobalEventItem]
    total: int


class GroundTruthAggregation(BaseModel):
    total_reports: int = 0
    confirmed_reports: int = 0
    denied_reports: int = 0
    pending_reports: int = 0


class CharHistoryResponse(BaseModel):
    case_id: str
    event_type: str
    char_name_or_id: str
    geometry: Optional[GeoJSONGeometry] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    observation_start: datetime
    observation_end: datetime
    status: str
    change_status: str  # "OBSERVED CHANGE" | "POTENTIAL CHANGE" | "INCONCLUSIVE" | "NO SUFFICIENT EVIDENCE" | "UNAVAILABLE"
    latest_delta_backscatter: Optional[float] = None
    latest_affected_area: Optional[float] = None
    evidence_status: str
    audit_verdict: str
    ground_truth: GroundTruthAggregation
    historical_observations: List[TimelineEventItem] = []
    provenance_records: List[ProvenanceResponse] = []
    alerts: List[ThresholdAlertResponse] = []

