from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


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
    photo_reference: Optional[str] = None
    note: Optional[str] = None
    observed_at: datetime
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class FieldObservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    photo_reference: Optional[str] = None
    note: Optional[str] = None
    observed_at: datetime
    location: Optional[GeoJSONGeometry] = None
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
