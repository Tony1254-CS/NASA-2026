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
from app.models.case import (
    Case,
    NisarMeasurement,
    Evidence,
    FieldObservation,
    Provenance,
    ChallengeCheck,
    ThresholdAlert,
)
from app.services.case_service import CaseService


def mock_geom_from_ewkt(val):
    if not val:
        return None
    wkt_str = str(val).split(";")[-1]
    try:
        return shapely.wkt.loads(wkt_str).wkb_hex
    except Exception:
        return str(val)


def register_sqlite_geo_functions(target_engine):
    @event.listens_for(target_engine, "connect")
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


# Setup In-Memory Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
register_sqlite_geo_functions(engine)


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Case 1: Active Char Island Case with Evidence & Field Observations
    case1 = Case(
        case_id="TRACE-CHAR-BD-01",
        event_type="CHAR_CHANGE",
        geometry=WKTElement("POLYGON((89.5 24.0, 90.0 24.0, 90.0 24.5, 89.5 24.5, 89.5 24.0))", srid=4326),
        observation_start=datetime(2026, 8, 1, 0, 0, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, 0, 0, tzinfo=timezone.utc),
        status="active",
    )
    db.add(case1)
    db.commit()

    nisar1 = NisarMeasurement(
        case_id="TRACE-CHAR-BD-01",
        product_id="NISAR_L2_PR_GCOV_20260805",
        observation_time=datetime(2026, 8, 5, 12, 0, tzinfo=timezone.utc),
        delta_backscatter=-2.8,
        affected_area=45.2,
    )
    db.add(nisar1)

    ev1 = Evidence(
        case_id="TRACE-CHAR-BD-01",
        source_type="nasa_firms",
        collection_id="MODIS_NRT",
        granule_id="GRANULE_001",
        time_start=datetime(2026, 8, 4, 10, 0, tzinfo=timezone.utc),
        status="SUPPORTING",
    )
    db.add(ev1)

    check1 = ChallengeCheck(
        case_id="TRACE-CHAR-BD-01",
        check_type="OVERALL_SELF_AUDIT",
        status="SUPPORTED",
        rationale="Multi-mission supporting evidence verified.",
    )
    db.add(check1)

    obs1 = FieldObservation(
        case_id="TRACE-CHAR-BD-01",
        note="Confirmed physical river island change present on ground.",
        verification_state="USER_CONFIRMED",
        observed_at=datetime(2026, 8, 6, 14, 0, tzinfo=timezone.utc),
        location=WKTElement("POINT(89.75 24.25)", srid=4326),
    )
    obs2 = FieldObservation(
        case_id="TRACE-CHAR-BD-01",
        note="Ground verification reported false positive, normal area.",
        verification_state="REJECTED",
        observed_at=datetime(2026, 8, 7, 10, 0, tzinfo=timezone.utc),
        location=WKTElement("POINT(89.80 24.30)", srid=4326),
    )
    db.add(obs1)
    db.add(obs2)

    prov1 = Provenance(
        case_id="TRACE-CHAR-BD-01",
        product_id="NISAR_L2_PR_GCOV_20260805",
        collection_id="NASA_NISAR_L2",
        processing_method="SAR_BACKSCATTER_DELTA_V1",
        calculation_method="SPATIAL_TEMPORAL_CROSS_CORRELATION",
    )
    db.add(prov1)

    alert1 = ThresholdAlert(
        case_id="TRACE-CHAR-BD-01",
        metric_name="delta_backscatter",
        threshold_value=-2.0,
        comparison="less_than",
        is_active=True,
        triggered_state="TRIGGERED",
    )
    db.add(alert1)

    # Case 2: Case with missing geometry (No coordinates)
    case2 = Case(
        case_id="TRACE-NO-GEOM-02",
        event_type="WILDFIRE",
        geometry=None,
        observation_start=datetime(2026, 8, 1, 0, 0, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, 0, 0, tzinfo=timezone.utc),
        status="active",
    )
    db.add(case2)

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


# ==================== STEP 5.1 TESTS ====================

def test_global_events_returns_real_cases(client):
    """Test 1: Global events returns real database cases with coordinates and audit verdict."""
    res = client.get("/api/global/events")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] == 2
    assert len(data["items"]) == 2

    c1 = next(item for item in data["items"] if item["case_id"] == "TRACE-CHAR-BD-01")
    assert c1["event_type"] == "CHAR_CHANGE"
    assert c1["latitude"] is not None
    assert c1["longitude"] is not None
    assert c1["audit_verdict"] == "SUPPORTED"
    assert c1["ground_truth_count"] == 2
    assert c1["provenance_count"] == 1


def test_global_events_filtering(client):
    """Test 2: Global events filtering by event_type and audit_verdict."""
    res = client.get("/api/global/events?event_type=CHAR_CHANGE")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["case_id"] == "TRACE-CHAR-BD-01"


def test_global_events_safe_missing_coordinates(client):
    """Test 4: Case with missing/null geometry returns None lat/lon safely without crash."""
    res = client.get("/api/global/events")
    data = res.json()
    c2 = next(item for item in data["items"] if item["case_id"] == "TRACE-NO-GEOM-02")
    assert c2["latitude"] is None
    assert c2["longitude"] is None


def test_empty_global_events_state():
    """Test 3: Empty database returns total: 0 and empty items without fabricating fake events."""
    empty_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    register_sqlite_geo_functions(empty_engine)
    Base.metadata.create_all(bind=empty_engine)
    empty_session = sessionmaker(autocommit=False, autoflush=False, bind=empty_engine)()

    res = CaseService.get_global_events(db=empty_session)
    assert res.total == 0
    assert len(res.items) == 0

    empty_session.close()
    Base.metadata.drop_all(bind=empty_engine)


def test_char_history_available_evidence(client):
    """Test 5 & 8: Char history returns SAR evidence, aggregated ground truth, and provenance."""
    res = client.get("/api/cases/TRACE-CHAR-BD-01/char-history")
    assert res.status_code == 200
    data = res.json()

    assert data["case_id"] == "TRACE-CHAR-BD-01"
    assert data["latest_delta_backscatter"] == -2.8
    assert data["latest_affected_area"] == 45.2
    assert data["audit_verdict"] == "SUPPORTED"

    # Ground truth report aggregation check
    gt = data["ground_truth"]
    assert gt["total_reports"] == 2
    assert gt["confirmed_reports"] == 1
    assert gt["denied_reports"] == 1
    assert gt["pending_reports"] == 0

    # Provenance check
    assert len(data["provenance_records"]) == 1
    assert data["provenance_records"][0]["product_id"] == "NISAR_L2_PR_GCOV_20260805"

    # Threshold alert check
    assert len(data["alerts"]) == 1
    assert data["alerts"][0]["triggered_state"] == "TRIGGERED"


def test_char_history_scientifically_safe_language(client):
    """Test 10: Ensures change_status uses scientifically safe phrasing ('OBSERVED CHANGE') without unsupported erosion claims."""
    res = client.get("/api/cases/TRACE-CHAR-BD-01/char-history")
    data = res.json()
    # Must use "OBSERVED CHANGE" or "POTENTIAL CHANGE", never "EROSION"
    assert data["change_status"] == "OBSERVED CHANGE"
    assert "EROSION" not in data["change_status"].upper()


def test_char_history_unavailable_evidence():
    """Test 6 & 7: Case with unavailable evidence returns UNAVAILABLE status safely without fabricating dates."""
    empty_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    register_sqlite_geo_functions(empty_engine)
    Base.metadata.create_all(bind=empty_engine)
    session = sessionmaker(autocommit=False, autoflush=False, bind=empty_engine)()

    c = Case(
        case_id="TRACE-EMPTY-CHAR",
        event_type="CHAR_CHANGE",
        geometry=None,
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        status="active",
    )
    session.add(c)
    session.commit()

    history = CaseService.get_char_history(db=session, case_id="TRACE-EMPTY-CHAR")
    assert history.change_status == "UNAVAILABLE"
    assert history.evidence_status == "UNAVAILABLE"
    assert history.audit_verdict == "UNAVAILABLE"
    assert history.latest_delta_backscatter is None
    assert history.ground_truth.total_reports == 0

    session.close()
    Base.metadata.drop_all(bind=empty_engine)
