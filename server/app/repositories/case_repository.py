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
    ThresholdAlert,
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
                joinedload(Case.threshold_alerts),
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
        source_type: str = "human_observation",
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
        db.flush()

        # Create corresponding Evidence record for cross-mission evidence integration
        ev = Evidence(
            case_id=case_id,
            source_type=source_type,
            collection_id="GROUND_FIELD_OBSERVATION",
            granule_id=field_obs.id,
            time_start=observed_at,
            time_end=observed_at,
            role="ground_truth",
            status="evaluated",
            visualization_uri=photo_reference,
        )
        db.add(ev)

        db.commit()
        db.refresh(field_obs)
        return field_obs

    @staticmethod
    def get_alerts_for_case(db: Session, case_id: str) -> Optional[List[ThresholdAlert]]:
        case_exists = db.scalar(select(Case.id).where(Case.case_id == case_id))
        if not case_exists:
            return None
        stmt = (
            select(ThresholdAlert)
            .where(ThresholdAlert.case_id == case_id)
            .order_by(ThresholdAlert.created_at.desc())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def create_or_update_alert(
        db: Session,
        case_id: str,
        metric_name: str,
        threshold_value: float,
        comparison: str = "less_than",
        is_active: bool = True,
    ) -> Optional[ThresholdAlert]:
        case_exists = db.scalar(select(Case.id).where(Case.case_id == case_id))
        if not case_exists:
            return None

        # Check if alert already exists for this case + metric
        stmt = select(ThresholdAlert).where(
            ThresholdAlert.case_id == case_id,
            ThresholdAlert.metric_name == metric_name,
        )
        existing = db.scalars(stmt).first()

        if existing:
            existing.threshold_value = threshold_value
            existing.comparison = comparison
            existing.is_active = is_active
            db.commit()
            db.refresh(existing)
            return existing
        else:
            alert = ThresholdAlert(
                case_id=case_id,
                metric_name=metric_name,
                threshold_value=threshold_value,
                comparison=comparison,
                is_active=is_active,
                triggered_state="ARMED",
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)
            return alert

    @staticmethod
    def update_alert(
        db: Session,
        alert_id: str,
        metric_name: Optional[str] = None,
        threshold_value: Optional[float] = None,
        comparison: Optional[str] = None,
        is_active: Optional[bool] = None,
        triggered_state: Optional[str] = None,
        last_evaluated_val: Optional[float] = None,
        last_triggered_at: Optional[datetime] = None,
    ) -> Optional[ThresholdAlert]:
        stmt = select(ThresholdAlert).where(ThresholdAlert.id == alert_id)
        alert = db.scalars(stmt).first()
        if not alert:
            return None

        if metric_name is not None:
            alert.metric_name = metric_name
        if threshold_value is not None:
            alert.threshold_value = threshold_value
        if comparison is not None:
            alert.comparison = comparison
        if is_active is not None:
            alert.is_active = is_active
        if triggered_state is not None:
            alert.triggered_state = triggered_state
        if last_evaluated_val is not None:
            alert.last_evaluated_val = last_evaluated_val
        if last_triggered_at is not None:
            alert.last_triggered_at = last_triggered_at

        db.commit()
        db.refresh(alert)
        return alert
