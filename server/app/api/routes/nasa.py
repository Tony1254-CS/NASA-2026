from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Query, status
import httpx
from app.core.config import settings
from app.services.nasa.nisar import NisarDiscoveryService
from app.services.nasa.gpm import GpmDiscoveryService
from app.services.nasa.modis import ModisDiscoveryService
from app.services.nasa.firms import FirmsDiscoveryService

from app.services.nasa.schemas import (
    NASAObservationSearchResponse,
    NASAHealthResponse,
)

router = APIRouter(prefix="/nasa", tags=["nasa"])


@router.get("/nisar/search", response_model=NASAObservationSearchResponse, status_code=status.HTTP_200_OK)
def search_nisar_observations(
    bbox: Optional[str] = Query(None, description="Bounding box formatted as 'min_lon,min_lat,max_lon,max_lat'"),
    start_date: Optional[str] = Query(None, description="Start date ISO string"),
    end_date: Optional[str] = Query(None, description="End date ISO string"),
    product_type: Optional[str] = Query("GCOV", description="NISAR product type filter: GCOV, GSLC, GUNW, SME2"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    Discover candidate NISAR Earth observation metadata without downloading raster payloads.
    """
    service = NisarDiscoveryService()
    items = service.discover_nisar_observations(
        bbox=bbox,
        start_date=start_date,
        end_date=end_date,
        product_type=product_type,
        page_size=page_size,
    )
    return NASAObservationSearchResponse(
        items=items,
        total=len(items),
        source_query={
            "bbox": bbox,
            "start_date": start_date,
            "end_date": end_date,
            "product_type": product_type,
            "page_size": page_size,
        },
    )


@router.get("/gpm/search", response_model=NASAObservationSearchResponse, status_code=status.HTTP_200_OK)
def search_gpm_observations(
    bbox: Optional[str] = Query(None, description="Bounding box formatted as 'min_lon,min_lat,max_lon,max_lat'"),
    start_date: Optional[str] = Query(None, description="Start date ISO string"),
    end_date: Optional[str] = Query(None, description="End date ISO string"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    Discover GPM IMERG precipitation dataset metadata for independent baseline verification.
    """
    service = GpmDiscoveryService()
    items = service.discover_gpm_observations(
        bbox=bbox,
        start_date=start_date,
        end_date=end_date,
        page_size=page_size,
    )
    return NASAObservationSearchResponse(
        items=items,
        total=len(items),
        source_query={
            "bbox": bbox,
            "start_date": start_date,
            "end_date": end_date,
            "page_size": page_size,
        },
    )


@router.get("/modis/search", response_model=NASAObservationSearchResponse, status_code=status.HTTP_200_OK)
def search_modis_observations(
    bbox: Optional[str] = Query(None, description="Bounding box formatted as 'min_lon,min_lat,max_lon,max_lat'"),
    start_date: Optional[str] = Query(None, description="Start date ISO string"),
    end_date: Optional[str] = Query(None, description="End date ISO string"),
    product_type: Optional[str] = Query("MOD13A2", description="MODIS product type filter (MOD13A2, MYD13A2)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    Discover MODIS land-context dataset metadata for surface background context.
    """
    service = ModisDiscoveryService()
    items = service.discover_modis_observations(
        bbox=bbox,
        start_date=start_date,
        end_date=end_date,
        product_type=product_type,
        page_size=page_size,
    )
    return NASAObservationSearchResponse(
        items=items,
        total=len(items),
        source_query={
            "bbox": bbox,
            "start_date": start_date,
            "end_date": end_date,
            "product_type": product_type,
            "page_size": page_size,
        },
    )


@router.get("/firms/search", response_model=NASAObservationSearchResponse, status_code=status.HTTP_200_OK)
def search_firms_observations(
    bbox: Optional[str] = Query(None, description="Bounding box formatted as 'min_lon,min_lat,max_lon,max_lat'"),
    start_date: Optional[str] = Query(None, description="Start date ISO string"),
    end_date: Optional[str] = Query(None, description="End date ISO string"),
    source_product: Optional[str] = Query("VIIRS_NOAA20_NRT", description="FIRMS product filter: VIIRS_NOAA20_NRT, VIIRS_SNPP_NRT, MODIS_NRT"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    Discover NASA FIRMS active fire observation metadata for thermal anomaly evidence discovery.
    """
    service = FirmsDiscoveryService()
    items = service.discover_firms_observations(
        bbox=bbox,
        start_date=start_date,
        end_date=end_date,
        source_product=source_product or "VIIRS_NOAA20_NRT",
        page_size=page_size,
    )
    return NASAObservationSearchResponse(
        items=items,
        total=len(items),
        source_query={
            "bbox": bbox,
            "start_date": start_date,
            "end_date": end_date,
            "source_product": source_product,
            "page_size": page_size,
        },
    )


@router.get("/health", response_model=NASAHealthResponse, status_code=status.HTTP_200_OK)

def get_nasa_access_health():
    """
    Internal health check probe verifying NASA CMR API reachability and authentication status.
    Exposes NO secrets, credentials, or private tokens.
    """
    cmr_reachable = False
    try:
        with httpx.Client(timeout=3.0) as client:
            res = client.get(f"{settings.CMR_BASE_URL.rstrip('/')}/search/health")
            if res.status_code == 200:
                cmr_reachable = True
    except Exception:
        pass

    auth_status = "configured" if (settings.EARTHDATA_TOKEN or (settings.EARTHDATA_USERNAME and settings.EARTHDATA_PASSWORD)) else "anonymous"

    overall_status = "ok" if cmr_reachable else "degraded"

    return NASAHealthResponse(
        status=overall_status,
        cmr_reachable=cmr_reachable,
        earthdata_auth_status=auth_status,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
