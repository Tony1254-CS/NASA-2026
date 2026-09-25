from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from geoalchemy2.elements import WKTElement
import shapely.wkt

from app.main import app
from app.core.database import Base, get_db
from app.models.case import Case, NisarMeasurement, Evidence, FieldObservation
from app.services.self_audit_engine import SelfAuditEngine, SelfAuditResult


# Setup In-Memory Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def mock_geom_from_ewkt(val):
    if not val:
        return None
    wkt_str = str(val).split(";")[-1]
    try:
        return shapely.wkt.loads(wkt_str).wkb_hex
    except Exception:
        return str(val)


@event.listens_for(engine, "connect")
def connect(dbapi_connection, connection_record):
    dbapi_connection.create_function("GeomFromEWKT", 1, mock_geom_from_ewkt)
    dbapi_connection.create_function("GeomFromWKT", 1, mock_geom_from_ewkt)
    dbapi_connection.create_function("GeomFromText", 1, mock_geom_from_ewkt)
    dbapi_connection.create_function("ST_AsBinary", 1, lambda val: val)
    dbapi_connection.create_function("ST_GeomFromText", 1, mock_geom_from_ewkt)
    dbapi_connection.create_function("ST_GeomFromWKT", 1, mock_geom_from_ewkt)
    dbapi_connection.create_function("AsEWKB", 1, lambda val: val)
    dbapi_connection.create_function("AsText", 1, lambda val: val)
    dbapi_connection.create_function("PostGIS_Full_Version", 0, lambda: "POSTGIS 3.4.0")


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    case = Case(
        case_id="TRACE-AUDIT-TEST-01",
        event_type="WILDFIRE",
        geometry=WKTElement("POLYGON((-120.5 37.5, -120.0 37.5, -120.0 38.0, -120.5 38.0, -120.5 37.5))", srid=4326),
        observation_start=datetime(2026, 8, 1, 0, 0, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, 0, 0, tzinfo=timezone.utc),
        status="active",
    )
    db.add(case)
    db.commit()

    nisar_m = NisarMeasurement(
        case_id="TRACE-AUDIT-TEST-01",
        product_id="NISAR_L2_PR_GCOV_20260805",
        observation_time=datetime(2026, 8, 5, 12, 0, tzinfo=timezone.utc),
        delta_backscatter=-3.4,
        affected_area=150.0,
        change_metric="GCOV_LOG_RATIO",
    )
    db.add(nisar_m)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(setup_db):
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ==================== STEP 7 UNIT & SELF-AUDIT TESTS ====================

def test_self_audit_supported_case():
    """Test self-audit produces SUPPORTED state when all quality checks pass with supporting evidence."""
    engine = SelfAuditEngine()
    result = engine.evaluate_audit(
        case_id="TRACE-AUDIT-TEST-01",
        event_type="WILDFIRE",
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        bbox="-120.5,37.5,-120.0,38.0",
        delta_backscatter=-3.4,
        affected_area=150.0,
        change_metric="GCOV_LOG_RATIO",
        evidence_records=[
            {"id": "ev-1", "source_type": "nasa_firms", "status": "SUPPORTING"},
            {"id": "ev-2", "source_type": "nasa_modis", "status": "SUPPORTING"},
        ],
        field_observations=[
            {"id": "fo-1", "note": "Active burn scars and charred vegetation observed in field."}
        ],
    )

    assert result.overall_audit_state == "SUPPORTED"
    assert result.confidence_score >= 0.75
    assert any(c.check_type == "DATA_QUALITY_CHECK" and c.status == "PASS" for c in result.checks)
    assert any(c.check_type == "GROUND_TRUTH_CONSISTENCY_CHECK" and c.status == "PASS" for c in result.checks)


def test_self_audit_inconclusive_case_missing_evidence():
    """Test self-audit produces INCONCLUSIVE state when independent evidence is missing (missing != pass)."""
    engine = SelfAuditEngine()
    result = engine.evaluate_audit(
        case_id="TRACE-AUDIT-TEST-01",
        event_type="WILDFIRE",
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        bbox="-120.5,37.5,-120.0,38.0",
        delta_backscatter=-3.4,
        affected_area=150.0,
        evidence_records=[],  # Missing evidence!
        field_observations=[],
    )

    assert result.overall_audit_state == "INCONCLUSIVE"
    # Missing evidence must NOT be converted to PASS
    avail_check = next(c for c in result.checks if c.check_type == "INDEPENDENT_EVIDENCE_AVAILABILITY_CHECK")
    assert avail_check.status in {"NOT_EVALUATED", "WARNING"}



def test_self_audit_rejected_case_ground_truth_contradiction():
    """Test self-audit produces REJECTED state when ground field observation explicitly contradicts change."""
    engine = SelfAuditEngine()
    result = engine.evaluate_audit(
        case_id="TRACE-AUDIT-TEST-01",
        event_type="WILDFIRE",
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        bbox="-120.5,37.5,-120.0,38.0",
        delta_backscatter=-3.4,
        affected_area=150.0,
        evidence_records=[],
        field_observations=[
            {"id": "fo-1", "note": "Ground inspection confirmed normal vegetation, no damage, false positive."}
        ],
    )

    assert result.overall_audit_state == "REJECTED"
    ground_check = next(c for c in result.checks if c.check_type == "GROUND_TRUTH_CONSISTENCY_CHECK")
    assert ground_check.status == "FAIL"


def test_self_audit_low_quality_measurement():
    """Test self-audit flags DATA_QUALITY_CHECK as FAIL when SAR measurement is null/insignificant."""
    engine = SelfAuditEngine()
    result = engine.evaluate_audit(
        case_id="TRACE-AUDIT-TEST-01",
        event_type="WILDFIRE",
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        bbox="-120.5,37.5,-120.0,38.0",
        delta_backscatter=None,
        affected_area=None,
    )

    assert result.overall_audit_state == "REJECTED"
    dq_check = next(c for c in result.checks if c.check_type == "DATA_QUALITY_CHECK")
    assert dq_check.status == "FAIL"


def test_api_self_audit_endpoint(client):
    """Test POST /api/cases/{case_id}/self-audit API endpoint integration."""
    res = client.post("/api/cases/TRACE-AUDIT-TEST-01/self-audit")
    assert res.status_code == 200
    data = res.json()
    assert data["case_id"] == "TRACE-AUDIT-TEST-01"
    assert "overall_audit_state" in data
    assert "confidence_score" in data
    assert "summary_explanation" in data
    assert "checks" in data
    assert len(data["checks"]) == 7
