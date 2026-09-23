from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.case_service import CaseService
from app.services.storage_service import StorageService
from app.schemas.case import (
    PaginatedCasesResponse,
    CaseDetailResponse,
    EvidenceResponse,
    TimelineResponse,
    ProvenanceResponse,
    ChallengeCheckResponse,
    FieldObservationCreate,
    FieldObservationResponse,
)

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("", response_model=PaginatedCasesResponse, status_code=status.HTTP_200_OK)
def get_cases(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """
    Retrieve a paginated list of TRACE investigation cases.
    """
    return CaseService.list_cases(db=db, page=page, page_size=page_size)


@router.get("/{case_id}", response_model=CaseDetailResponse, status_code=status.HTTP_200_OK)
def get_case_detail(case_id: str, db: Session = Depends(get_db)):
    """
    Retrieve full stored investigation state for a given case ID.
    """
    return CaseService.get_case_detail(db=db, case_id=case_id)


@router.get("/{case_id}/evidence", response_model=List[EvidenceResponse], status_code=status.HTTP_200_OK)
def get_case_evidence(case_id: str, db: Session = Depends(get_db)):
    """
    Retrieve evidence records associated with a specific case ID.
    """
    return CaseService.get_evidence(db=db, case_id=case_id)


@router.get("/{case_id}/timeline", response_model=TimelineResponse, status_code=status.HTTP_200_OK)
def get_case_timeline(case_id: str, db: Session = Depends(get_db)):
    """
    Retrieve chronologically indexed observations (BEFORE -> CHANGE -> AFTER) for a case ID.
    """
    return CaseService.get_timeline(db=db, case_id=case_id)


@router.get(
    "/{case_id}/provenance/{evidence_id}",
    response_model=ProvenanceResponse,
    status_code=status.HTTP_200_OK,
)
def get_evidence_provenance(case_id: str, evidence_id: str, db: Session = Depends(get_db)):
    """
    Retrieve source provenance lineage details for a specific evidence item within a case.
    """
    return CaseService.get_provenance(db=db, case_id=case_id, evidence_id=evidence_id)


@router.get("/{case_id}/challenge", response_model=List[ChallengeCheckResponse], status_code=status.HTTP_200_OK)
def get_case_challenge_checks(case_id: str, db: Session = Depends(get_db)):
    """
    Retrieve stored challenge check records for a case. (READ-safe endpoint; engine computation occurs separately).
    """
    return CaseService.get_challenge_checks(db=db, case_id=case_id)


@router.post(
    "/{case_id}/field-observations",
    response_model=FieldObservationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_field_observation(
    case_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Record a ground field observation for a specific case ID.
    Supports both multipart/form-data with photo upload and application/json.
    """
    content_type = request.headers.get("content-type", "")
    final_photo_ref: Optional[str] = None
    final_note: Optional[str] = None
    final_observed_at: Optional[datetime] = None
    final_latitude: Optional[float] = None
    final_longitude: Optional[float] = None

    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        file_obj = form.get("file")

        note_val = form.get("note")
        final_note = str(note_val) if note_val is not None and str(note_val).strip() != "" else None

        obs_val = form.get("observed_at")
        if obs_val:
            try:
                final_observed_at = datetime.fromisoformat(str(obs_val).replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid observed_at timestamp format.",
                )

        lat_val = form.get("latitude")
        if lat_val is not None and str(lat_val).strip() != "":
            try:
                final_latitude = float(lat_val)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid latitude coordinate.",
                )

        lon_val = form.get("longitude")
        if lon_val is not None and str(lon_val).strip() != "":
            try:
                final_longitude = float(lon_val)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid longitude coordinate.",
                )

        photo_ref_val = form.get("photo_reference")
        if photo_ref_val is not None and str(photo_ref_val).strip() != "":
            final_photo_ref = str(photo_ref_val)

        # Upload file binary if provided
        if file_obj and hasattr(file_obj, "read"):
            file_bytes = await file_obj.read()
            filename = getattr(file_obj, "filename", "photo.jpg") or "photo.jpg"
            file_mime = getattr(file_obj, "content_type", None)
            final_photo_ref = StorageService.upload_field_photo(
                file_bytes=file_bytes,
                filename=filename,
                content_type=file_mime,
                case_id=case_id,
            )
    else:
        body = await request.json()
        try:
            payload = FieldObservationCreate(**body)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(e),
            )
        final_photo_ref = payload.photo_reference
        final_note = payload.note
        final_observed_at = payload.observed_at
        final_latitude = payload.latitude
        final_longitude = payload.longitude


    if final_latitude is None or final_longitude is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude and longitude coordinates are required.",
        )

    if final_observed_at is None:
        final_observed_at = datetime.now(timezone.utc)

    create_payload = FieldObservationCreate(
        photo_reference=final_photo_ref,
        note=final_note,
        observed_at=final_observed_at,
        latitude=final_latitude,
        longitude=final_longitude,
    )

    return CaseService.create_field_observation(db=db, case_id=case_id, payload=create_payload)

