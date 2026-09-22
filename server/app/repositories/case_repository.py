from typing import List, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from geoalchemy2.elements import WKTElement
from app.models.case import (
    Case,
    Evidence,
    Provenance,
    FieldObservation,
    ChallengeCheck,
)


class CaseRepository:
    """
    Data-access repository layer handling database queries for TRACE investigation cases.
    """

    @staticmethod
    def get_cases(db: Session, page: int = 1, page_size: int = 20) -> Tuple[List[Case], int]:
        total = db.scalar(select(func.count(Case.id))) or 0
        offset = (page - 1) * page_size
        stmt = (
            select(Case)
            .order_by(Case.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        items = list(db.scalars(stmt).all())
        return items, total

    @staticmethod
    def get_case_by_case_id(db: Session, case_id: str) -> Optional[Case]:
        stmt = (
            select(Case)
            .where(Case.case_id == case_id)
            .options(
                joinedload(Case.nisar_measurements),
                joinedload(Case.evidence),
                joinedload(Case.challenge_checks),
                joinedload(Case.interpretations),
                joinedload(Case.provenance_records),
                joinedload(Case.field_observations),
            )
        )
        return db.scalars(stmt).unique().first()

    @staticmethod
    def get_evidence_for_case(db: Session, case_id: str) -> Optional[List[Evidence]]:
        # Verify case existence first
        case_exists = db.scalar(select(Case.id).where(Case.case_id == case_id))
        if not case_exists:
            return None
        stmt = select(Evidence).where(Evidence.case_id == case_id).order_by(Evidence.created_at.asc())
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_provenance_for_evidence(db: Session, case_id: str, evidence_id: str) -> Optional[Provenance]:
        stmt = (
            select(Provenance)
            .where(Provenance.case_id == case_id, Provenance.evidence_id == evidence_id)
        )
        return db.scalars(stmt).first()

    @staticmethod
    def get_challenge_checks_for_case(db: Session, case_id: str) -> Optional[List[ChallengeCheck]]:
        case_exists = db.scalar(select(Case.id).where(Case.case_id == case_id))
        if not case_exists:
            return None
        stmt = select(ChallengeCheck).where(ChallengeCheck.case_id == case_id).order_by(ChallengeCheck.created_at.asc())
        return list(db.scalars(stmt).all())

    @staticmethod
    def create_field_observation(
        db: Session,
        case_id: str,
        photo_reference: Optional[str],
        note: Optional[str],
        observed_at: datetime,
        latitude: float,
        longitude: float,
    ) -> Optional[FieldObservation]:
        case_exists = db.scalar(select(Case.id).where(Case.case_id == case_id))
        if not case_exists:
            return None

        wkt_location = f"POINT({longitude} {latitude})"
        field_obs = FieldObservation(
            case_id=case_id,
            photo_reference=photo_reference,
            note=note,
            observed_at=observed_at,
            location=WKTElement(wkt_location, srid=4326),
        )
        db.add(field_obs)
        db.commit()
        db.refresh(field_obs)
        return field_obs
