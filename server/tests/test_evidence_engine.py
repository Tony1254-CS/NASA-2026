from datetime import datetime, timezone, timedelta
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from geoalchemy2.elements import WKTElement
import shapely.wkt

from app.main import app
from app.core.database import Base, get_db
from app.models.case import Case, NisarMeasurement
from app.services.nasa.schemas import NASAObservation, GeoJSONGeometry
from app.services.nasa.firms import FirmsDiscoveryService, FIRMSSummary, FIRMSFireItem
from app.services.evidence_engine import (
    CrossMissionEvidenceEngine,
    SpatialCorrelationCalculator,
    TemporalCorrelationCalculator,
    NonCausalHypothesisGenerator,
    DISALLOWED_CAUSAL_TERMS,
)


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

    # Seed test case
    case = Case(
        case_id="TRACE-TEST-PHASE41",
        event_type="WILDFIRE",
        geometry=WKTElement("POLYGON((-120.5 37.5, -120.0 37.5, -120.0 38.0, -120.5 38.0, -120.5 37.5))", srid=4326),
        observation_start=datetime(2026, 8, 1, 0, 0, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, 0, 0, tzinfo=timezone.utc),
        status="active",
    )
    db.add(case)
    db.commit()

    nisar_m = NisarMeasurement(
        case_id="TRACE-TEST-PHASE41",
        product_id="NISAR_L2_PR_GCOV_20260805",
        observation_time=datetime(2026, 8, 5, 12, 0, tzinfo=timezone.utc),
        delta_backscatter=-3.4,
        affected_area=125.0,
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


# ==================== STEP 10 UNIT & FUSION TESTS ====================

def test_firms_unavailable():
    """Test that FIRMS service cleanly returns UNAVAILABLE status when MAP_KEY is not set."""
    service = FirmsDiscoveryService(map_key=None)
    summary = service.get_firms_summary(bbox="-120.5,37.5,-120.0,38.0")
    assert summary.status == "UNAVAILABLE"
    assert summary.total_fires == 0
    assert summary.provenance.get("reason") == "FIRMS_MAP_KEY_NOT_CONFIGURED"


def test_spatial_correlation_calculator():
    """Test SpatialCorrelationCalculator distance & relevance scores."""
    # Same point -> distance 0, score 1.0
    dist, score = SpatialCorrelationCalculator.calculate_point_relevance((37.75, -120.25), 37.75, -120.25)
    assert dist == 0.0
    assert score == 1.0

    # ~25 km away -> score > 0.5
    dist2, score2 = SpatialCorrelationCalculator.calculate_point_relevance((37.75, -120.25), 37.95, -120.25)
    assert 20.0 < dist2 < 30.0
    assert 0.4 <= score2 <= 0.9

    # Far away (> 200 km) -> score 0.0
    dist3, score3 = SpatialCorrelationCalculator.calculate_point_relevance((37.75, -120.25), 40.0, -120.25)
    assert dist3 > 200.0
    assert score3 == 0.0


def test_temporal_correlation_calculator():
    """Test TemporalCorrelationCalculator logic with UTC datetime objects."""
    start = datetime(2026, 8, 1, 0, 0, tzinfo=timezone.utc)
    end = datetime(2026, 8, 10, 0, 0, tzinfo=timezone.utc)

    # Co-occurring fire within window
    fire_in = datetime(2026, 8, 5, 12, 0, tzinfo=timezone.utc)
    assert TemporalCorrelationCalculator.calculate_firms_temporal_score(start, end, fire_in) == 1.0

    # Fire 30 days outside window
    fire_out = datetime(2026, 9, 20, 12, 0, tzinfo=timezone.utc)
    assert TemporalCorrelationCalculator.calculate_firms_temporal_score(start, end, fire_out) == 0.0

    # GPM precipitation 24 hours prior to event start
    rain_pre = datetime(2026, 7, 31, 12, 0, tzinfo=timezone.utc)
    assert TemporalCorrelationCalculator.calculate_gpm_temporal_score(start, rain_pre) == 1.0


def test_unsupported_causal_claim_prevention():
    """Test that NonCausalHypothesisGenerator rejects and sanitizes unsupported causal wording."""
    causal_input = "The SAR anomaly was caused by a wildfire and triggered by high winds which proves that deforestation occurred."
    sanitized = NonCausalHypothesisGenerator.sanitize_text(causal_input)

    for term in DISALLOWED_CAUSAL_TERMS:
        assert term not in sanitized.lower()

    assert "is temporally consistent with" in sanitized


def test_evidence_fusion_partial_and_full():
    """Test CrossMissionEvidenceEngine fusion output for partial vs full supporting evidence."""
    mock_firms = MagicMock()
    mock_gpm = MagicMock()
    mock_modis = MagicMock()

    # Scenario A: Only FIRMS is available & supporting, GPM & MODIS unavailable
    mock_firms.get_firms_summary.return_value = FIRMSSummary(
        status="AVAILABLE",
        total_fires=12,
        nearest_distance_km=2.5,
        max_frp=45.0,
        temporal_overlap=True,
        detections=[
            FIRMSFireItem(
                latitude=37.75,
                longitude=-120.25,
                brightness=330.0,
                acq_datetime=datetime(2026, 8, 5, 12, 0, tzinfo=timezone.utc),
                frp=45.0,
                distance_km=2.5,
            )
        ]
    )
    mock_gpm.discover_gpm_observations.return_value = []
    mock_modis.discover_modis_observations.return_value = []

    engine = CrossMissionEvidenceEngine(
        firms_service=mock_firms, gpm_service=mock_gpm, modis_service=mock_modis
    )

    result_partial = engine.evaluate_case_evidence(
        case_id="TRACE-TEST-PHASE41",
        event_type="WILDFIRE",
        bbox="-120.5,37.5,-120.0,38.0",
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        sar_backscatter_delta=-3.2,
    )

    assert result_partial.overall_status == "PARTIALLY_SUPPORTED"
    assert result_partial.sensor_evaluations["FIRMS"].status == "SUPPORTING"
    assert result_partial.sensor_evaluations["GPM"].status == "UNAVAILABLE"
    assert result_partial.sensor_evaluations["MODIS"].status == "UNAVAILABLE"

    # Scenario B: FIRMS + MODIS both supporting -> CONFIRMED_MULTIMISSION
    mock_modis.discover_modis_observations.return_value = [
        NASAObservation(
            source="NASA_MODIS",
            mission="MODIS",
            product_id="MOD13A2",
            granule_id="MOD13A2.A2026217.h08v05.006",
            collection_id="MODIS_NDVI",
            observation_time=datetime(2026, 8, 5, tzinfo=timezone.utc),
            product_type="MOD13A2",
        )
    ]

    result_full = engine.evaluate_case_evidence(
        case_id="TRACE-TEST-PHASE41",
        event_type="WILDFIRE",
        bbox="-120.5,37.5,-120.0,38.0",
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        sar_backscatter_delta=-3.2,
    )

    assert result_full.overall_status == "CONFIRMED_MULTIMISSION"
    assert result_full.sensor_evaluations["FIRMS"].status == "SUPPORTING"
    assert result_full.sensor_evaluations["MODIS"].status == "SUPPORTING"


def test_api_evaluate_evidence_endpoint(client):
    """Test POST /api/cases/{case_id}/evaluate-evidence API endpoint integration."""
    res = client.post("/api/cases/TRACE-TEST-PHASE41/evaluate-evidence")
    assert res.status_code == 200
    data = res.json()
    assert data["case_id"] == "TRACE-TEST-PHASE41"
    assert "overall_status" in data
    assert "sensor_evaluations" in data
    assert "hypothesis_narrative" in data
    assert "non_causal_statement" in data


def test_api_firms_search_endpoint(client):
    """Test GET /api/nasa/firms/search API endpoint."""
    res = client.get("/api/nasa/firms/search?bbox=-120.5,37.5,-120.0,38.0")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "source_query" in data
