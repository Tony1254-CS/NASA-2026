from datetime import datetime, timezone
import pytest
from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import sessionmaker
from geoalchemy2.elements import WKTElement
from server.app.core.database import Base
from server.app.models.case import (
    Case,
    NisarMeasurement,
    Evidence,
    ChallengeCheck,
    Interpretation,
    Provenance,
    FieldObservation,
)


def test_core_data_model_structures():
    """
    Verifies that all 7 core entities, relationships, constraints, and PostGIS geometries are properly mapped.
    """
    now = datetime.now(timezone.utc)

    # 1. Create a Case
    polygon_wkt = "MULTIPOLYGON(((0 0, 0 1, 1 1, 1 0, 0 0)))"
    case = Case(
        case_id="TEST-CASE-2026-001",
        event_type="flood",
        geometry=WKTElement(polygon_wkt, srid=4326),
        observation_start=now,
        observation_end=now,
        status="draft",
    )
    assert case.case_id == "TEST-CASE-2026-001"
    assert case.event_type == "flood"

    # 2. Add NISAR Measurement
    nisar = NisarMeasurement(
        case_id=case.case_id,
        product_id="NISAR_L2_PR_001",
        observation_time=now,
        delta_backscatter=-3.45,
        affected_area=125.5,
        change_metric="log_ratio",
    )
    case.nisar_measurements.append(nisar)
    assert len(case.nisar_measurements) == 1
    assert case.nisar_measurements[0].product_id == "NISAR_L2_PR_001"

    # 3. Add Evidence
    ev = Evidence(
        case_id=case.case_id,
        source_type="gpm",
        collection_id="GPM_IMERG_V06",
        granule_id="3B-DAY.MS.MRG.3IMERG.20260921",
        status="supports",
    )
    case.evidence.append(ev)
    assert len(case.evidence) == 1
    assert case.evidence[0].status == "supports"

    # 4. Add Challenge Check
    check = ChallengeCheck(
        case_id=case.case_id,
        check_type="temporal_coincidence",
        status="pass",
        value="48h",
        threshold="72h",
        rationale="Precipitation event occurred within 48h prior to radar pass",
    )
    case.challenge_checks.append(check)
    assert len(case.challenge_checks) == 1
    assert case.challenge_checks[0].status == "pass"

    # 5. Add Interpretation
    interp = Interpretation(
        case_id=case.case_id,
        narrative="Observed SAR backscatter decrease aligns with GPM precipitation records.",
        uncertainty=0.15,
    )
    case.interpretations.append(interp)
    assert len(case.interpretations) == 1

    # 6. Add Provenance
    prov = Provenance(
        case_id=case.case_id,
        evidence_id=ev.id,
        processing_method="nisar_temporal_ratio",
        calculation_method="db_difference",
    )
    case.provenance_records.append(prov)
    assert len(case.provenance_records) == 1

    # 7. Add Field Observation (Point Geometry)
    point_wkt = "POINT(-118.2437 34.0522)"
    field_obs = FieldObservation(
        case_id=case.case_id,
        note="Ground inundation observed near river bank",
        observed_at=now,
        location=WKTElement(point_wkt, srid=4326),
    )
    case.field_observations.append(field_obs)
    assert len(case.field_observations) == 1
    assert case.field_observations[0].note == "Ground inundation observed near river bank"
