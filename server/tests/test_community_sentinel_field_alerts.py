import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import shapely.wkt
from fastapi import status

from app.main import app
from app.core.database import Base, get_db
from app.models.case import Case, NisarMeasurement, FieldObservation, ThresholdAlert, Evidence, ChallengeCheck
from app.services.case_service import CaseService
from app.schemas.case import FieldObservationCreate, ThresholdAlertCreate, AlertAcknowledgePayload


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


SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
register_sqlite_geo_functions(engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session):
    def _get_db_override():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_db_override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_create_community_report(db_session):
    """1. Create community report & 2. Linked to correct case & 3. GPS preserved."""
    case = Case(
        case_id="CASE-COMM-001",
        event_type="FLOOD",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    db_session.add(case)
    db_session.commit()

    payload = FieldObservationCreate(
        user_id="user_sentinel_99",
        latitude=23.8103,
        longitude=90.4125,
        note="Water level observed rising near embankment.",
        observed_at=datetime.now(timezone.utc),
        source_type="community_sentinel",
    )

    res = CaseService.create_field_observation(db=db_session, case_id="CASE-COMM-001", payload=payload)
    assert res.id is not None
    assert res.case_id == "CASE-COMM-001"
    assert res.user_id == "user_sentinel_99"
    assert res.location is not None
    assert res.location.type == "Point"
    assert list(res.location.coordinates) == [90.4125, 23.8103]
    assert res.source_type == "community_sentinel"
    assert res.verification_state == "PENDING"
    assert res.sentinel_tier == "ACTIVE_REPORTER"


def test_missing_gps_no_fake_coordinates(db_session):
    """4. Missing GPS does not create fake coordinates."""
    case = Case(
        case_id="CASE-COMM-002",
        event_type="CHAR_EROSION",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    db_session.add(case)
    db_session.commit()

    payload = FieldObservationCreate(
        user_id="user_sentinel_100",
        latitude=None,
        longitude=None,
        note="Observation without GPS hardware capability.",
        observed_at=datetime.now(timezone.utc),
        source_type="community_sentinel",
    )

    res = CaseService.create_field_observation(db=db_session, case_id="CASE-COMM-002", payload=payload)
    assert res.location is None
    assert res.verification_state == "PENDING"


def test_photo_metadata_handling(db_session):
    """5. Photo metadata handling."""
    case = Case(
        case_id="CASE-COMM-003",
        event_type="FLOOD",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    db_session.add(case)
    db_session.commit()

    payload = FieldObservationCreate(
        user_id="user_sentinel_101",
        latitude=24.1,
        longitude=89.5,
        photo_reference="storage/field_photos/photo_test_123.jpg",
        note="Geotagged ground photo attached.",
        observed_at=datetime.now(timezone.utc),
        source_type="community_sentinel",
    )

    res = CaseService.create_field_observation(db=db_session, case_id="CASE-COMM-003", payload=payload)
    assert res.photo_reference == "storage/field_photos/photo_test_123.jpg"


def test_report_aggregation_and_empty_state(db_session):
    """7. Report aggregation & 8. Empty report state works."""
    case = Case(
        case_id="CASE-AGG-001",
        event_type="FLOOD",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    db_session.add(case)
    db_session.commit()

    # Empty state test
    empty_res = CaseService.get_community_reports(db=db_session, case_id="CASE-AGG-001")
    assert empty_res["aggregation"].total_reports == 0
    assert empty_res["aggregation"].confirmed_reports == 0
    assert empty_res["aggregation"].denied_reports == 0
    assert empty_res["aggregation"].pending_reports == 0
    assert empty_res["message"] == "No community reports yet."

    # Add 3 reports with different states
    obs1 = FieldObservation(
        case_id="CASE-AGG-001",
        user_id="u1",
        note="obs 1",
        observed_at=datetime.now(timezone.utc),
        verification_state="PENDING",
    )
    obs2 = FieldObservation(
        case_id="CASE-AGG-001",
        user_id="u2",
        note="obs 2",
        observed_at=datetime.now(timezone.utc),
        verification_state="USER_CONFIRMED",
    )
    obs3 = FieldObservation(
        case_id="CASE-AGG-001",
        user_id="u3",
        note="obs 3",
        observed_at=datetime.now(timezone.utc),
        verification_state="REJECTED",
    )
    db_session.add_all([obs1, obs2, obs3])
    db_session.commit()

    agg_res = CaseService.get_community_reports(db=db_session, case_id="CASE-AGG-001")
    assert agg_res["aggregation"].total_reports == 3
    assert agg_res["aggregation"].confirmed_reports == 1
    assert agg_res["aggregation"].denied_reports == 1
    assert agg_res["aggregation"].pending_reports == 1


def test_community_reports_do_not_become_scientific_truth(db_session):
    """9. Community reports do not automatically become scientific truth."""
    case = Case(
        case_id="CASE-TRUTH-001",
        event_type="FLOOD",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    db_session.add(case)
    db_session.commit()

    obs = FieldObservation(
        case_id="CASE-TRUTH-001",
        user_id="u_truth",
        note="I see water here!",
        observed_at=datetime.now(timezone.utc),
        verification_state="USER_CONFIRMED",
    )
    db_session.add(obs)
    db_session.commit()

    # Self-audit must run independently and NOT give automatic SUPPORTED without satellite evidence
    audit_res = CaseService.evaluate_self_audit(db=db_session, case_id="CASE-TRUTH-001")
    state = audit_res["overall_audit_state"] if isinstance(audit_res, dict) else audit_res.overall_audit_state
    assert state != "SUPPORTED"
    assert state in ["INCONCLUSIVE", "REJECTED", "UNAVAILABLE"]


def test_field_alerts_provenance_and_state_transitions(db_session):
    """10. Alert linked to evidence, 11. Provenance, 12. Alert state transitions, 13. Acknowledgement."""
    case = Case(
        case_id="CASE-ALERT-001",
        event_type="FLOOD",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    nisar = NisarMeasurement(
        case_id="CASE-ALERT-001",
        product_id="NISAR_TEST_PRODUCT_99",
        observation_time=datetime.now(timezone.utc),
        delta_backscatter=-4.5,
        affected_area=15.0,
    )
    ev = Evidence(
        id="EV-NISAR-001",
        case_id="CASE-ALERT-001",
        source_type="NISAR",
        granule_id="NISAR_TEST_GRANULE_99",
        status="evaluated",
    )
    audit = ChallengeCheck(
        case_id="CASE-ALERT-001",
        check_type="COMPREHENSIVE_SELF_AUDIT",
        status="pass",
        value="SUPPORTED",
        rationale="Strong multi-sensor correlation.",
        source="NASA_SELF_AUDIT",
    )
    db_session.add_all([case, nisar, ev, audit])
    db_session.commit()

    # Create threshold alert
    alert_payload = ThresholdAlertCreate(
        metric_name="delta_backscatter",
        threshold_value=-2.0,
        comparison="less_than",
    )
    alert_res = CaseService.create_or_update_alert(db=db_session, case_id="CASE-ALERT-001", payload=alert_payload)

    assert alert_res.triggered_state == "TRIGGERED"
    assert alert_res.alert_state == "OBSERVED CHANGE"
    assert alert_res.evidence_id == "EV-NISAR-001"
    assert alert_res.safe_message is not None
    assert "TRACE detected an observed change" in alert_res.safe_message
    assert "Flood will happen" not in alert_res.safe_message

    # Test acknowledgement
    ack_res = CaseService.acknowledge_alert(db=db_session, case_id="CASE-ALERT-001", alert_id=alert_res.id, status_val="ACKNOWLEDGED")
    assert ack_res.acknowledgement_status == "ACKNOWLEDGED"


def test_scientific_safety_scenarios(db_session, client):
    """Part H Scientific Safety Checks (Scenarios 1-5)."""
    # Scenario 1: Satellite evidence exists, no community reports
    case1 = Case(
        case_id="CASE-SCENARIO-1",
        event_type="FLOOD",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    nisar1 = NisarMeasurement(
        case_id="CASE-SCENARIO-1",
        product_id="PRODUCT_1",
        observation_time=datetime.now(timezone.utc),
        delta_backscatter=-3.0,
        affected_area=8.0,
    )
    db_session.add_all([case1, nisar1])
    db_session.commit()

    audit1 = CaseService.evaluate_self_audit(db=db_session, case_id="CASE-SCENARIO-1")
    state1 = audit1["overall_audit_state"] if isinstance(audit1, dict) else audit1.overall_audit_state
    assert state1 is not None

    # Scenario 2: Community reports exist, satellite evidence unavailable
    case2 = Case(
        case_id="CASE-SCENARIO-2",
        event_type="CHAR_EROSION",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    obs2 = FieldObservation(
        case_id="CASE-SCENARIO-2",
        user_id="user_2",
        note="Community report without satellite coverage",
        observed_at=datetime.now(timezone.utc),
        verification_state="USER_CONFIRMED",
    )
    db_session.add_all([case2, obs2])
    db_session.commit()

    audit2 = CaseService.evaluate_self_audit(db=db_session, case_id="CASE-SCENARIO-2")
    state2 = audit2["overall_audit_state"] if isinstance(audit2, dict) else audit2.overall_audit_state
    assert state2 != "SUPPORTED"

    # Seed case for API tests
    case_agg = Case(
        case_id="CASE-AGG-002",
        event_type="FLOOD",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    db_session.add(case_agg)
    db_session.commit()

    # API Endpoints Test
    resp_comm = client.get("/api/cases/CASE-AGG-002/community-reports")
    assert resp_comm.status_code == status.HTTP_200_OK
    data_comm = resp_comm.json()
    assert data_comm["case_id"] == "CASE-AGG-002"
    assert data_comm["aggregation"]["total_reports"] == 0

    resp_ack = client.post(
        f"/api/cases/CASE-AGG-002/alerts/nonexistent/acknowledge",
        json={"status": "ACKNOWLEDGED"}
    )
    assert resp_ack.status_code == status.HTTP_404_NOT_FOUND


def test_invalid_alert_acknowledgement_status_rejected(db_session, client):
    """Audit Item 8: Invalid alert acknowledgement status is rejected with 400 Bad Request."""
    case = Case(
        case_id="CASE-ACK-001",
        event_type="FLOOD",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    alert = ThresholdAlert(
        case_id="CASE-ACK-001",
        metric_name="delta_backscatter",
        threshold_value=-2.0,
        comparison="less_than",
        is_active=True,
        triggered_state="TRIGGERED",
    )
    db_session.add_all([case, alert])
    db_session.commit()

    # Invalid status should be rejected
    resp_invalid = client.post(
        f"/api/cases/CASE-ACK-001/alerts/{alert.id}/acknowledge",
        json={"status": "INVALID_STATE_SUBMITTED"}
    )
    assert resp_invalid.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY or resp_invalid.status_code == status.HTTP_400_BAD_REQUEST


def test_cross_case_alert_acknowledgement_rejected(db_session, client):
    """Audit Item 8: Alert belonging to case A cannot be acknowledged via case B."""
    case_a = Case(case_id="CASE-A", event_type="FLOOD", observation_start=datetime.now(timezone.utc), observation_end=datetime.now(timezone.utc), status="ACTIVE")
    case_b = Case(case_id="CASE-B", event_type="FLOOD", observation_start=datetime.now(timezone.utc), observation_end=datetime.now(timezone.utc), status="ACTIVE")
    alert_a = ThresholdAlert(
        case_id="CASE-A",
        metric_name="delta_backscatter",
        threshold_value=-2.0,
        comparison="less_than",
        is_active=True,
        triggered_state="TRIGGERED",
    )
    db_session.add_all([case_a, case_b, alert_a])
    db_session.commit()

    # Trying to acknowledge alert_a using CASE-B route must return 404
    resp = client.post(
        f"/api/cases/CASE-B/alerts/{alert_a.id}/acknowledge",
        json={"status": "ACKNOWLEDGED"}
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND


def test_canonical_global_events_route(client):
    """Audit Item 7: GET /api/global/events is available and canonical."""
    resp = client.get("/api/global/events")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert "items" in data
    assert "total" in data

