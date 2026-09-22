from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.case_repository import CaseRepository
from app.utils.geo import shape_to_geojson
from app.schemas.case import (
    CaseListItem,
    PaginatedCasesResponse,
    CaseDetailResponse,
    NisarMeasurementResponse,
    EvidenceResponse,
    ChallengeCheckResponse,
    InterpretationResponse,
    ProvenanceResponse,
    FieldObservationResponse,
    FieldObservationCreate,
    TimelineResponse,
    TimelineEventItem,
)


class CaseService:
    """
    Business logic layer assembling investigation cases, converting PostGIS geometries into GeoJSON,
    and structuring temporal timeline responses.
    """

    @staticmethod
    def list_cases(db: Session, page: int = 1, page_size: int = 20) -> PaginatedCasesResponse:
        items, total = CaseRepository.get_cases(db, page=page, page_size=page_size)
        case_list = [
            CaseListItem(
                id=c.id,
                case_id=c.case_id,
                event_type=c.event_type,
                geometry=shape_to_geojson(c.geometry),
                observation_start=c.observation_start,
                observation_end=c.observation_end,
                status=c.status,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in items
        ]
        return PaginatedCasesResponse(
            items=case_list,
            page=page,
            page_size=page_size,
            total=total,
        )

    @staticmethod
    def get_case_detail(db: Session, case_id: str) -> CaseDetailResponse:
        case = CaseRepository.get_case_by_case_id(db, case_id)
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case with ID '{case_id}' not found",
            )

        return CaseDetailResponse(
            id=case.id,
            case_id=case.case_id,
            event_type=case.event_type,
            geometry=shape_to_geojson(case.geometry),
            observation_start=case.observation_start,
            observation_end=case.observation_end,
            status=case.status,
            created_at=case.created_at,
            updated_at=case.updated_at,
            nisar_measurements=[
                NisarMeasurementResponse(
                    id=m.id,
                    case_id=m.case_id,
                    product_id=m.product_id,
                    observation_time=m.observation_time,
                    delta_backscatter=m.delta_backscatter,
                    affected_area=m.affected_area,
                    spatial_extent=shape_to_geojson(m.spatial_extent),
                    change_metric=m.change_metric,
                    raster_reference=m.raster_reference,
                    created_at=m.created_at,
                )
                for m in case.nisar_measurements
            ],
            evidence=[
                EvidenceResponse(
                    id=e.id,
                    case_id=e.case_id,
                    source_type=e.source_type,
                    collection_id=e.collection_id,
                    granule_id=e.granule_id,
                    time_start=e.time_start,
                    time_end=e.time_end,
                    spatial_extent=shape_to_geojson(e.spatial_extent),
                    role=e.role,
                    status=e.status,
                    visualization_uri=e.visualization_uri,
                    created_at=e.created_at,
                )
                for e in case.evidence
            ],
            challenge_checks=[
                ChallengeCheckResponse(
                    id=cc.id,
                    case_id=cc.case_id,
                    check_type=cc.check_type,
                    status=cc.status,
                    value=cc.value,
                    threshold=cc.threshold,
                    rationale=cc.rationale,
                    source=cc.source,
                    created_at=cc.created_at,
                )
                for cc in case.challenge_checks
            ],
            interpretations=[
                InterpretationResponse(
                    id=i.id,
                    case_id=i.case_id,
                    narrative=i.narrative,
                    uncertainty=i.uncertainty,
                    created_at=i.created_at,
                    updated_at=i.updated_at,
                )
                for i in case.interpretations
            ],
            provenance_records=[
                ProvenanceResponse(
                    id=p.id,
                    case_id=p.case_id,
                    evidence_id=p.evidence_id,
                    collection_id=p.collection_id,
                    granule_id=p.granule_id,
                    product_id=p.product_id,
                    acquisition_time=p.acquisition_time,
                    processing_method=p.processing_method,
                    calculation_method=p.calculation_method,
                    source_reference=p.source_reference,
                    created_at=p.created_at,
                )
                for p in case.provenance_records
            ],
            field_observations=[
                FieldObservationResponse(
                    id=fo.id,
                    case_id=fo.case_id,
                    photo_reference=fo.photo_reference,
                    note=fo.note,
                    observed_at=fo.observed_at,
                    location=shape_to_geojson(fo.location),
                    created_at=fo.created_at,
                )
                for fo in case.field_observations
            ],
        )

    @staticmethod
    def get_evidence(db: Session, case_id: str) -> List[EvidenceResponse]:
        evidence_list = CaseRepository.get_evidence_for_case(db, case_id)
        if evidence_list is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case with ID '{case_id}' not found",
            )
        return [
            EvidenceResponse(
                id=e.id,
                case_id=e.case_id,
                source_type=e.source_type,
                collection_id=e.collection_id,
                granule_id=e.granule_id,
                time_start=e.time_start,
                time_end=e.time_end,
                spatial_extent=shape_to_geojson(e.spatial_extent),
                role=e.role,
                status=e.status,
                visualization_uri=e.visualization_uri,
                created_at=e.created_at,
            )
            for e in evidence_list
        ]

    @staticmethod
    def get_timeline(db: Session, case_id: str) -> TimelineResponse:
        case = CaseRepository.get_case_by_case_id(db, case_id)
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case with ID '{case_id}' not found",
            )

        events: List[TimelineEventItem] = []

        # 1. Observation Window Start (BEFORE phase)
        events.append(
            TimelineEventItem(
                id=f"evt-start-{case.id[:8]}",
                case_id=case.case_id,
                timestamp=case.observation_start,
                phase="before",
                event_type="observation_start",
                title="Baseline Observation Window Start",
                details={"event_type": case.event_type},
            )
        )

        # 2. NISAR Measurements (CHANGE phase)
        for m in case.nisar_measurements:
            phase = "change" if case.observation_start <= m.observation_time <= case.observation_end else "after" if m.observation_time > case.observation_end else "before"
            events.append(
                TimelineEventItem(
                    id=m.id,
                    case_id=m.case_id,
                    timestamp=m.observation_time,
                    phase=phase,
                    event_type="nisar_measurement",
                    title=f"NISAR Pass ({m.product_id})",
                    details={
                        "delta_backscatter": m.delta_backscatter,
                        "affected_area": m.affected_area,
                        "change_metric": m.change_metric,
                    },
                )
            )

        # 3. Independent Evidence
        for e in case.evidence:
            if e.time_start:
                phase = "change" if case.observation_start <= e.time_start <= case.observation_end else "after" if e.time_start > case.observation_end else "before"
                events.append(
                    TimelineEventItem(
                        id=e.id,
                        case_id=e.case_id,
                        timestamp=e.time_start,
                        phase=phase,
                        event_type="evidence_observation",
                        title=f"{e.source_type.upper()} Evidence Acquired ({e.collection_id or 'Data'})",
                        details={"status": e.status, "role": e.role},
                    )
                )

        # 4. Field Observations
        for fo in case.field_observations:
            phase = "after" if fo.observed_at > case.observation_end else "change" if fo.observed_at >= case.observation_start else "before"
            events.append(
                TimelineEventItem(
                    id=fo.id,
                    case_id=fo.case_id,
                    timestamp=fo.observed_at,
                    phase=phase,
                    event_type="field_observation",
                    title="Ground Field Observation Recorded",
                    details={"note": fo.note, "photo_reference": fo.photo_reference},
                )
            )

        # 5. Observation Window End (AFTER phase)
        events.append(
            TimelineEventItem(
                id=f"evt-end-{case.id[:8]}",
                case_id=case.case_id,
                timestamp=case.observation_end,
                phase="after",
                event_type="observation_end",
                title="Observation Window Close",
                details={"status": case.status},
            )
        )

        # Sort events chronologically
        events.sort(key=lambda x: x.timestamp)

        return TimelineResponse(case_id=case.case_id, events=events)

    @staticmethod
    def get_provenance(db: Session, case_id: str, evidence_id: str) -> ProvenanceResponse:
        case = CaseRepository.get_case_by_case_id(db, case_id)
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case with ID '{case_id}' not found",
            )

        prov = CaseRepository.get_provenance_for_evidence(db, case_id, evidence_id)
        if not prov:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Provenance record for evidence '{evidence_id}' in case '{case_id}' not found",
            )

        return ProvenanceResponse(
            id=prov.id,
            case_id=prov.case_id,
            evidence_id=prov.evidence_id,
            collection_id=prov.collection_id,
            granule_id=prov.granule_id,
            product_id=prov.product_id,
            acquisition_time=prov.acquisition_time,
            processing_method=prov.processing_method,
            calculation_method=prov.calculation_method,
            source_reference=prov.source_reference,
            created_at=prov.created_at,
        )

    @staticmethod
    def get_challenge_checks(db: Session, case_id: str) -> List[ChallengeCheckResponse]:
        checks = CaseRepository.get_challenge_checks_for_case(db, case_id)
        if checks is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case with ID '{case_id}' not found",
            )
        return [
            ChallengeCheckResponse(
                id=cc.id,
                case_id=cc.case_id,
                check_type=cc.check_type,
                status=cc.status,
                value=cc.value,
                threshold=cc.threshold,
                rationale=cc.rationale,
                source=cc.source,
                created_at=cc.created_at,
            )
            for cc in checks
        ]

    @staticmethod
    def create_field_observation(
        db: Session, case_id: str, payload: FieldObservationCreate
    ) -> FieldObservationResponse:
        obs = CaseRepository.create_field_observation(
            db=db,
            case_id=case_id,
            photo_reference=payload.photo_reference,
            note=payload.note,
            observed_at=payload.observed_at,
            latitude=payload.latitude,
            longitude=payload.longitude,
        )
        if not obs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Case with ID '{case_id}' not found",
            )

        return FieldObservationResponse(
            id=obs.id,
            case_id=obs.case_id,
            photo_reference=obs.photo_reference,
            note=obs.note,
            observed_at=obs.observed_at,
            location=shape_to_geojson(obs.location),
            created_at=obs.created_at,
        )
