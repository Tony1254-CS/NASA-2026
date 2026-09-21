from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.app.core.database import get_db
from server.app.services.case_service import CaseService
from server.app.schemas.case import (
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
def create_field_observation(
    case_id: str, payload: FieldObservationCreate, db: Session = Depends(get_db)
):
    """
    Record a ground field observation for a specific case ID.
    """
    return CaseService.create_field_observation(db=db, case_id=case_id, payload=payload)
