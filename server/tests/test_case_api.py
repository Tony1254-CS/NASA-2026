from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles
import geoalchemy2.admin
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKTElement
import shapely.wkt

from server.app.main import app
from server.app.core.database import Base, get_db
from server.app.models.case import (
    Case,
    NisarMeasurement,
    Evidence,
    ChallengeCheck,
    Interpretation,
    Provenance,
    FieldObservation,
)

# Mock GeoAlchemy2 DDL admin for SQLite test engine
class DummyDialectAdmin:
    @staticmethod
    def before_create(table, bind, **kw):
        pass

    @staticmethod
    def after_create(table, bind, **kw):
        pass

    @staticmethod
    def before_drop(table, bind, **kw):
        pass

    @staticmethod
    def after_drop(table, bind, **kw):
        pass


geoalchemy2.admin.select_dialect = lambda dialect_name: DummyDialectAdmin


# Compile Geometry as TEXT for SQLite test engine
@compiles(Geometry, "sqlite")
def compile_geometry_sqlite(element, compiler, **kw):
    return "TEXT"


# Setup SQLite In-Memory Test Database
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


@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    # Populate test case seed data
    now = datetime.now(timezone.utc)

    test_case = Case(
        case_id="TRACE-2026-TEST01",
        event_type="flood",
        geometry=WKTElement("POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))", srid=4326),
        observation_start=now,
        observation_end=now,
        status="active",
    )
    db.add(test_case)
    db.commit()

    nisar = NisarMeasurement(
        case_id=test_case.case_id,
        product_id="NISAR_L2_PR_TEST01",
        observation_time=now,
        delta_backscatter=-2.5,
        affected_area=50.0,
        change_metric="log_ratio",
    )
    db.add(nisar)

    evidence = Evidence(
        id="ev-test-101",
        case_id=test_case.case_id,
        source_type="gpm",
        collection_id="GPM_IMERG_V06",
        granule_id="3B-DAY.MS.MRG.3IMERG.20260921",
        role="baseline",
        status="supports",
    )
    db.add(evidence)

    check = ChallengeCheck(
        case_id=test_case.case_id,
        check_type="temporal_coincidence",
        status="pass",
        value="24h",
        threshold="48h",
        rationale="Passes temporal window",
        source="system",
    )
    db.add(check)

    prov = Provenance(
        id="prov-test-101",
        case_id=test_case.case_id,
        evidence_id=evidence.id,
        collection_id="GPM_IMERG_V06",
        granule_id="3B-DAY.MS.MRG.3IMERG.20260921",
        product_id="GPM_3IMERG_DAY",
        acquisition_time=now,
        processing_method="reanalysis",
        calculation_method="spatial_avg",
        source_reference="NASA GES DISC",
    )
    db.add(prov)

    obs = FieldObservation(
        id="fo-test-101",
        case_id=test_case.case_id,
        photo_reference="ref-101.jpg",
        note="Field inundation verified",
        observed_at=now,
        location=WKTElement("POINT(-118.2437 34.0522)", srid=4326),
    )
    db.add(obs)
    db.commit()

    yield db

    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


client = TestClient(app)


def test_get_cases_paginated():
    response = client.get("/api/cases")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["page"] == 1
    assert data["page_size"] == 20
    assert data["total"] == 1
    assert data["items"][0]["case_id"] == "TRACE-2026-TEST01"
    assert data["items"][0]["event_type"] == "flood"
    assert data["items"][0]["geometry"] is not None
    assert data["items"][0]["geometry"]["type"] == "Polygon"


def test_get_case_detail_success():
    response = client.get("/api/cases/TRACE-2026-TEST01")
    assert response.status_code == 200
    data = response.json()
    assert data["case_id"] == "TRACE-2026-TEST01"
    assert data["status"] == "active"
    assert len(data["nisar_measurements"]) == 1
    assert data["nisar_measurements"][0]["product_id"] == "NISAR_L2_PR_TEST01"
    assert len(data["evidence"]) == 1
    assert data["evidence"][0]["source_type"] == "gpm"
    assert len(data["challenge_checks"]) == 1
    assert data["challenge_checks"][0]["status"] == "pass"
    assert len(data["provenance_records"]) == 1
    assert len(data["field_observations"]) == 1


def test_get_case_detail_not_found():
    response = client.get("/api/cases/NON-EXISTENT-CASE")
    assert response.status_code == 404
    assert response.json()["detail"] == "Case with ID 'NON-EXISTENT-CASE' not found"


def test_get_case_evidence():
    response = client.get("/api/cases/TRACE-2026-TEST01/evidence")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["case_id"] == "TRACE-2026-TEST01"
    assert data[0]["source_type"] == "gpm"


def test_get_case_evidence_not_found():
    response = client.get("/api/cases/NON-EXISTENT-CASE/evidence")
    assert response.status_code == 404


def test_get_case_timeline():
    response = client.get("/api/cases/TRACE-2026-TEST01/timeline")
    assert response.status_code == 200
    data = response.json()
    assert data["case_id"] == "TRACE-2026-TEST01"
    assert "events" in data
    assert len(data["events"]) >= 2
    phases = [evt["phase"] for evt in data["events"]]
    assert "before" in phases
    assert "after" in phases


def test_get_case_provenance():
    response = client.get("/api/cases/TRACE-2026-TEST01/provenance/ev-test-101")
    assert response.status_code == 200
    data = response.json()
    assert data["case_id"] == "TRACE-2026-TEST01"
    assert data["evidence_id"] == "ev-test-101"
    assert data["source_reference"] == "NASA GES DISC"


def test_get_case_provenance_not_found():
    response = client.get("/api/cases/TRACE-2026-TEST01/provenance/non-existent-ev")
    assert response.status_code == 404


def test_get_case_challenge_checks():
    response = client.get("/api/cases/TRACE-2026-TEST01/challenge")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["check_type"] == "temporal_coincidence"


def test_post_field_observation_success():
    payload = {
        "photo_reference": "photo_002.jpg",
        "note": "Submerged road section observed",
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "latitude": 34.0522,
        "longitude": -118.2437,
    }
    response = client.post("/api/cases/TRACE-2026-TEST01/field-observations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["case_id"] == "TRACE-2026-TEST01"
    assert data["note"] == "Submerged road section observed"
    assert data["photo_reference"] == "photo_002.jpg"
    assert data["location"] is not None
    assert data["location"]["type"] == "Point"


def test_post_field_observation_case_not_found():
    payload = {
        "photo_reference": "photo_002.jpg",
        "note": "Test note",
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "latitude": 34.0522,
        "longitude": -118.2437,
    }
    response = client.post("/api/cases/NON-EXISTENT-CASE/field-observations", json=payload)
    assert response.status_code == 404


def test_post_field_observation_invalid_payload():
    payload = {
        "note": "Test note missing required observed_at and coords",
    }
    response = client.post("/api/cases/TRACE-2026-TEST01/field-observations", json=payload)
    assert response.status_code == 422


def test_health_endpoints():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
