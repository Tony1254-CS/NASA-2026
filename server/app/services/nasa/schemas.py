from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class GeoJSONGeometry(BaseModel):
    type: str
    coordinates: Any


class NASAObservation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    source: str = "NASA"
    mission: str
    product_id: str
    granule_id: str
    collection_id: str
    observation_time: datetime
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    spatial_extent: Optional[GeoJSONGeometry] = None
    product_type: str
    access_links: List[str] = Field(default_factory=list)
    visualization_uri: Optional[str] = None
    metadata_reference: Optional[str] = None


class NASAObservationSearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[NASAObservation]
    total: int
    source_query: Dict[str, Any] = Field(default_factory=dict)


class NASAHealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    cmr_reachable: bool
    earthdata_auth_status: str
    timestamp: str
