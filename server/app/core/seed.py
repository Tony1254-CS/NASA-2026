from datetime import datetime, timezone
from sqlalchemy.orm import Session
from geoalchemy2.elements import WKTElement
from server.app.models.case import (
    Case,
    NisarMeasurement,
    Evidence,
    ChallengeCheck,
    Interpretation,
    Provenance,
    FieldObservation,
)

def seed_initial_cases(db: Session):
    """
    Seed standard TRACE investigation cases if table is empty.
    """
    existing_count = db.query(Case).count()
    if existing_count > 0:
        return

    now = datetime.now(timezone.utc)

    # 1. CASE-017: Surface Water Change Case (Los Angeles / Salton Sea Region)
    case_017 = Case(
        case_id="CASE-017",
        event_type="surface_water_change",
        geometry=WKTElement("POLYGON((-118.3 34.0, -118.1 34.0, -118.1 34.2, -118.3 34.2, -118.3 34.0))", srid=4326),
        observation_start=now,
        observation_end=now,
        status="active",
    )
    db.add(case_017)
    db.commit()

    nisar_017 = NisarMeasurement(
        case_id=case_017.case_id,
        product_id="NISAR_L2_PR_GCOV_017",
        observation_time=now,
        delta_backscatter=-2.43,
        affected_area=45.2,
        change_metric="log_ratio",
        raster_reference="s3://asf-nisar-archive/GCOV_CASE_017.tif",
    )
    db.add(nisar_017)

    evidence_017 = Evidence(
        id="ev-017-gpm",
        case_id=case_017.case_id,
        source_type="gpm",
        collection_id="GPM_IMERG_V06",
        granule_id="3B-DAY.MS.MRG.3IMERG.20260921-S000000-E235959.V06B",
        role="baseline",
        status="supports",
    )
    db.add(evidence_017)

    # 2. TRACE-2026-001: Flood Debris Case
    case_001 = Case(
        case_id="TRACE-2026-001",
        event_type="flood",
        geometry=WKTElement("POLYGON((-95.4 29.7, -95.2 29.7, -95.2 29.9, -95.4 29.9, -95.4 29.7))", srid=4326),
        observation_start=now,
        observation_end=now,
        status="active",
    )
    db.add(case_001)
    db.commit()

    nisar_001 = NisarMeasurement(
        case_id=case_001.case_id,
        product_id="NISAR_L2_PR_GSLC_001",
        observation_time=now,
        delta_backscatter=-1.85,
        affected_area=120.5,
        change_metric="log_ratio",
        raster_reference="s3://asf-nisar-archive/GSLC_CASE_001.tif",
    )
    db.add(nisar_001)

    db.commit()
