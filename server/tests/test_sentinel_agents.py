from datetime import datetime, timezone
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from geoalchemy2.elements import WKTElement
import shapely.wkt

from app.main import app
from app.core.database import Base, get_db
from app.models.case import Case, NisarMeasurement
from app.services.sentinel_agents import (
    AutonomousSentinelWorkflow,
    DataAgent,
    DetectionAgent,
    EvidenceAgent,
    ChallengeAgent,
    InterpretationAgent,
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

    case = Case(
        case_id="TRACE-AGENT-TEST-01",
        event_type="WILDFIRE",
        geometry=WKTElement("POLYGON((-120.5 37.5, -120.0 37.5, -120.0 38.0, -120.5 38.0, -120.5 37.5))", srid=4326),
        observation_start=datetime(2026, 8, 1, 0, 0, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, 0, 0, tzinfo=timezone.utc),
        status="active",
    )
    db.add(case)
    db.commit()

    nisar_m = NisarMeasurement(
        case_id="TRACE-AGENT-TEST-01",
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


# ==================== STEP 4.6 SENTINEL AGENT TESTS ====================

def test_sentinel_workflow_successful():
    """Test full agent workflow execution (Data -> Detection -> Evidence -> Challenge -> Interpretation)."""
    workflow = AutonomousSentinelWorkflow()
    result = workflow.execute_workflow(
        case_id="TRACE-AGENT-TEST-01",
        event_type="WILDFIRE",
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        bbox="-120.5,37.5,-120.0,38.0",
        delta_backscatter=-3.4,
        affected_area=150.0,
        evidence_records=[
            {"id": "ev-1", "source_type": "nasa_firms", "status": "SUPPORTING"},
            {"id": "ev-2", "source_type": "nasa_modis", "status": "SUPPORTING"},
        ],
    )

    assert result.overall_workflow_status == "COMPLETED_SUPPORTED"
    assert result.final_verdict == "SUPPORTED"
    assert len(result.execution_log) == 5
    assert [step.agent_name for step in result.execution_log] == [
        "DataAgent",
        "DetectionAgent",
        "EvidenceAgent",
        "ChallengeAgent",
        "InterpretationAgent",
    ]


def test_sentinel_workflow_failed_detection_agent():
    """Test DetectionAgent fails when SAR payload is missing -> WORKFLOW_FAILED."""
    workflow = AutonomousSentinelWorkflow()
    result = workflow.execute_workflow(
        case_id="TRACE-AGENT-TEST-01",
        event_type="WILDFIRE",
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        bbox="-120.5,37.5,-120.0,38.0",
        delta_backscatter=None,
        affected_area=None,
    )

    assert result.overall_workflow_status == "WORKFLOW_FAILED"
    assert result.final_verdict == "INCONCLUSIVE"
    assert len(result.execution_log) == 2
    assert result.execution_log[1].status == "FAILED"


def test_sentinel_workflow_challenge_agent_disagreement():
    """Test ChallengeAgent disagrees with DetectionAgent when ground observation contradicts change."""
    workflow = AutonomousSentinelWorkflow()
    result = workflow.execute_workflow(
        case_id="TRACE-AGENT-TEST-01",
        event_type="WILDFIRE",
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        bbox="-120.5,37.5,-120.0,38.0",
        delta_backscatter=-3.4,
        affected_area=150.0,
        field_observations=[
            {"id": "fo-1", "note": "Ground verification confirmed normal area, false positive, no damage."}
        ],
    )

    assert result.challenge_disagreed is True
    assert result.final_verdict == "REJECTED"
    assert result.overall_workflow_status == "COMPLETED_REJECTED"
    challenge_step = next(s for s in result.execution_log if s.agent_name == "ChallengeAgent")
    assert challenge_step.status == "DISAGREED"


def test_sentinel_workflow_inconclusive_missing_evidence():
    """Test missing independent evidence produces COMPLETED_INCONCLUSIVE."""
    workflow = AutonomousSentinelWorkflow()
    result = workflow.execute_workflow(
        case_id="TRACE-AGENT-TEST-01",
        event_type="WILDFIRE",
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        bbox="-120.5,37.5,-120.0,38.0",
        delta_backscatter=-3.4,
        affected_area=150.0,
        evidence_records=[],
        field_observations=[],
    )

    assert result.final_verdict == "INCONCLUSIVE"
    assert result.overall_workflow_status == "COMPLETED_INCONCLUSIVE"


def test_sentinel_workflow_contradictory_evidence():
    """Test contradictory independent evidence leads to REJECTED or INCONCLUSIVE audit verdict by ChallengeAgent."""
    workflow = AutonomousSentinelWorkflow()
    result = workflow.execute_workflow(
        case_id="TRACE-AGENT-TEST-01",
        event_type="WILDFIRE",
        observation_start=datetime(2026, 8, 1, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, tzinfo=timezone.utc),
        bbox="-120.5,37.5,-120.0,38.0",
        delta_backscatter=-3.4,
        affected_area=150.0,
        evidence_records=[
            {"id": "ev-1", "source_type": "nasa_gpm", "status": "CONTRADICTORY", "confidence": 0.9}
        ],
        field_observations=[
            {"id": "fo-1", "note": "Contradictory optical imagery showing normal unburned vegetation."}
        ],
    )

    assert result.challenge_disagreed is True
    assert result.final_verdict in {"REJECTED", "INCONCLUSIVE"}
    assert any(step.status in {"DISAGREED", "WARNING"} for step in result.execution_log)


def test_api_run_sentinel_agents_endpoint(client):
    """Test POST /api/cases/{case_id}/run-sentinel-agents API endpoint."""
    res = client.post("/api/cases/TRACE-AGENT-TEST-01/run-sentinel-agents")
    assert res.status_code == 200
    data = res.json()
    assert data["case_id"] == "TRACE-AGENT-TEST-01"
    assert "overall_workflow_status" in data
    assert "execution_log" in data
    assert len(data["execution_log"]) == 5

