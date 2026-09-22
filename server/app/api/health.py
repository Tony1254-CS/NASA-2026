from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, status, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db

router = APIRouter()


class HealthResponse(BaseModel):
    status: str = Field(default="ok", json_schema_extra={"example": "ok"})
    timestamp: str
    version: str = Field(default="0.1.0")
    service: str = Field(default="TRACE API Server")


class DatabaseHealthResponse(BaseModel):
    status: str = Field(json_schema_extra={"example": "healthy"})
    postgres_connected: bool
    postgis_available: bool
    postgis_version: Optional[str] = None
    timestamp: str
    details: Optional[Dict[str, Any]] = None


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
def get_health():
    """
    Service liveness probe endpoint.
    """
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version=settings.PROJECT_VERSION,
        service=settings.PROJECT_NAME,
    )


@router.get("/health/db", response_model=DatabaseHealthResponse)
def get_database_health(response: Response, db: Session = Depends(get_db)):
    """
    Database health check probe verifying PostgreSQL connectivity & PostGIS availability.
    """
    now = datetime.now(timezone.utc).isoformat()
    postgres_connected = False
    postgis_available = False
    postgis_version_str = None
    error_details = None

    try:
        # 1. Verify PostgreSQL connection
        res = db.execute(text("SELECT 1;")).fetchone()
        if res and res[0] == 1:
            postgres_connected = True

        # 2. Verify PostGIS availability
        postgis_res = db.execute(text("SELECT PostGIS_Full_Version();")).fetchone()
        if postgis_res and postgis_res[0]:
            postgis_available = True
            postgis_version_str = str(postgis_res[0])
    except Exception as e:
        error_details = {"error": str(e)}

    overall_status = "healthy" if (postgres_connected and postgis_available) else "degraded" if postgres_connected else "unhealthy"

    if overall_status != "healthy":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return DatabaseHealthResponse(
        status=overall_status,
        postgres_connected=postgres_connected,
        postgis_available=postgis_available,
        postgis_version=postgis_version_str,
        timestamp=now,
        details=error_details,
    )
