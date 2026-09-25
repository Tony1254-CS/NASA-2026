from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from geoalchemy2.elements import WKTElement
import shapely.wkt

from app.main import app
from app.core.database import Base, get_db
from app.models.case import Case, NisarMeasurement, FieldObservation, Evidence, ChallengeCheck, Provenance


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
        case_id="TRACE-ONETAP-TEST-01",
        event_type="WILDFIRE",
        geometry=WKTElement("POLYGON((-120.5 37.5, -120.0 37.5, -120.0 38.0, -120.5 38.0, -120.5 37.5))", srid=4326),
        observation_start=datetime(2026, 8, 1, 0, 0, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, 0, 0, tzinfo=timezone.utc),
        status="active",
    )
    db.add(case)
    db.commit()

    nisar_m = NisarMeasurement(
        case_id="TRACE-ONETAP-TEST-01",
        product_id="NISAR_L2_PR_GCOV_20260805",
        observation_time=datetime(2026, 8, 5, 12, 0, tzinfo=timezone.utc),
        delta_backscatter=-3.4,
        affected_area=150.0,
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


# ==================== STEP 8 ONE-TAP GROUND TRUTH TESTS ====================

def test_one_tap_yes_submission(client):
    """Test one-tap YES ground observation submission triggers closed-loop evaluation."""
    payload = {
        "note": "One-tap ground truth: Change present in target area",
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "latitude": 37.75,
        "longitude": -120.25,
    }
    res = client.post("/api/cases/TRACE-ONETAP-TEST-01/field-observations", json=payload)
    assert res.status_code in {200, 201}
    data = res.json()
    assert data["case_id"] == "TRACE-ONETAP-TEST-01"
    assert data["note"] == "One-tap ground truth: Change present in target area"

    # Verify closed-loop audit status re-evaluated
    audit_res = client.post("/api/cases/TRACE-ONETAP-TEST-01/self-audit")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    ground_check = next(c for c in audit_data["checks"] if c["check_type"] == "GROUND_TRUTH_CONSISTENCY_CHECK")
    assert ground_check["status"] == "PASS"


def test_one_tap_no_submission(client):
    """Test one-tap NO ground observation submission (false positive) triggers REJECTED state."""
    payload = {
        "note": "One-tap ground truth: No damage observed, false positive",
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "latitude": 37.75,
        "longitude": -120.25,
    }
    res = client.post("/api/cases/TRACE-ONETAP-TEST-01/field-observations", json=payload)
    assert res.status_code in {200, 201}


    # Verify closed-loop audit state is updated to REJECTED due to explicit contradiction
    audit_res = client.post("/api/cases/TRACE-ONETAP-TEST-01/self-audit")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["overall_audit_state"] == "REJECTED"
    ground_check = next(c for c in audit_data["checks"] if c["check_type"] == "GROUND_TRUTH_CONSISTENCY_CHECK")
    assert ground_check["status"] == "FAIL"


def test_one_tap_invalid_gps_coordinates(client):
    """Test submission with invalid latitude/longitude returns 422 or 400 Bad Request."""
    payload = {
        "note": "One-tap test invalid GPS",
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "latitude": 999.0,  # Invalid latitude!
        "longitude": -120.25,
    }
    res = client.post("/api/cases/TRACE-ONETAP-TEST-01/field-observations", json=payload)
    assert res.status_code in {400, 422}


def test_one_tap_unknown_event_case_id(client):
    """Test submission for non-existent case ID returns 404 Not Found."""
    payload = {
        "note": "One-tap test unknown case",
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "latitude": 37.75,
        "longitude": -120.25,
    }
    res = client.post("/api/cases/INVALID-CASE-999/field-observations", json=payload)
    assert res.status_code == 404
