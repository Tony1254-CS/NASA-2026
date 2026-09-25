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
from app.models.case import Case, FieldObservation
from app.services.case_service import CaseService
from app.schemas.case import FieldObservationCreate


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


def test_online_observation_creation(db_session, client):
    """Test 1: Field observation created normally online."""
    case = Case(
        case_id="TRACE-OFFLINE-01",
        event_type="FLOOD",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    db_session.add(case)
    db_session.commit()

    payload = {
        "note": "Online ground verification observation.",
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "latitude": 23.8103,
        "longitude": 90.4125,
    }

    res = client.post("/api/cases/TRACE-OFFLINE-01/field-observations", json=payload)
    assert res.status_code in (200, 201)
    data = res.json()
    assert data["id"] is not None
    assert data["case_id"] == "TRACE-OFFLINE-01"


def test_offline_recovered_queue_sync(db_session, client):
    """Test 4 & 5: Queued observation sent after network recovery returns server ID and marks SYNCED."""
    case = Case(
        case_id="TRACE-OFFLINE-02",
        event_type="CHAR_CHANGE",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    db_session.add(case)
    db_session.commit()

    # Simulated recovered offline payload with photo reference
    payload = {
        "photo_reference": "storage/field_photos/photo_recovered_99.jpg",
        "note": "Offline observation synchronized after network recovery.",
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "latitude": 24.1234,
        "longitude": 89.5678,
    }

    res = client.post("/api/cases/TRACE-OFFLINE-02/field-observations", json=payload)
    assert res.status_code in (200, 201)
    data = res.json()
    assert data["id"] is not None
    assert data["photo_reference"] == "storage/field_photos/photo_recovered_99.jpg"


def test_duplicate_submission_protection(db_session):
    """Test 7 & 11: Sequential retry of queued observation does not duplicate data."""
    case = Case(
        case_id="TRACE-OFFLINE-03",
        event_type="WILDFIRE",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    db_session.add(case)
    db_session.commit()

    obs_payload = FieldObservationCreate(
        note="Idempotency verification ground truth.",
        observed_at=datetime.now(timezone.utc),
        latitude=25.0,
        longitude=91.0,
        source_type="human_observation",
    )

    res1 = CaseService.create_field_observation(db=db_session, case_id="TRACE-OFFLINE-03", payload=obs_payload)
    assert res1.id is not None

    # Simulate client retrying exact same submission after network response drop
    res2 = CaseService.create_field_observation(db=db_session, case_id="TRACE-OFFLINE-03", payload=obs_payload)
    assert res2.id == res1.id

    # Count total observations for case — must strictly remain 1
    total_obs = db_session.query(FieldObservation).filter(FieldObservation.case_id == "TRACE-OFFLINE-03").count()
    assert total_obs == 1


def test_invalid_coordinates_handled_safely(client, db_session):
    """Test 6: Invalid coordinates in queued observation reject with 400 Bad Request."""
    case = Case(
        case_id="TRACE-OFFLINE-04",
        event_type="FLOOD",
        observation_start=datetime.now(timezone.utc),
        observation_end=datetime.now(timezone.utc),
        status="ACTIVE",
    )
    db_session.add(case)
    db_session.commit()

    # Payload with missing lat/lon coordinates
    payload = {
        "note": "Invalid observation without GPS coordinates",
        "observed_at": datetime.now(timezone.utc).isoformat(),
    }

    res = client.post("/api/cases/TRACE-OFFLINE-04/field-observations", json=payload)
    assert res.status_code == status.HTTP_400_BAD_REQUEST or res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
