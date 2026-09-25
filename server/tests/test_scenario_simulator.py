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
from app.models.case import Case, NisarMeasurement
from app.services.scenario_simulator import ScenarioSimulatorEngine, ScenarioSimulationResult


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
        case_id="TRACE-SIM-TEST-01",
        event_type="FLOOD",
        geometry=WKTElement("POLYGON((-120.5 37.5, -120.0 37.5, -120.0 38.0, -120.5 38.0, -120.5 37.5))", srid=4326),
        observation_start=datetime(2026, 8, 1, 0, 0, tzinfo=timezone.utc),
        observation_end=datetime(2026, 8, 10, 0, 0, tzinfo=timezone.utc),
        status="active",
    )
    db.add(case)
    db.commit()

    nisar_m = NisarMeasurement(
        case_id="TRACE-SIM-TEST-01",
        product_id="NISAR_L2_PR_GCOV_20260805",
        observation_time=datetime(2026, 8, 5, 12, 0, tzinfo=timezone.utc),
        delta_backscatter=-3.4,
        affected_area=100.0,
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


# ==================== STEP 4.5 SCENARIO SIMULATOR TESTS ====================

def test_scenario_supported_water_levels():
    """Test water level simulations (+0.5m, +1.0m, +2.0m) scaling and mandatory disclaimer."""
    engine = ScenarioSimulatorEngine()

    # +0.5m
    res05 = engine.simulate_water_level("TRACE-SIM-TEST-01", 0.5, baseline_area_sq_km=100.0, has_geometry=True)
    assert res05.disclaimer == "Scenario simulation — not a forecast."
    assert res05.simulated_affected_area_sq_km == 122.5

    # +1.0m
    res10 = engine.simulate_water_level("TRACE-SIM-TEST-01", 1.0, baseline_area_sq_km=100.0, has_geometry=True)
    assert res10.simulated_affected_area_sq_km == 145.0

    # +2.0m
    res20 = engine.simulate_water_level("TRACE-SIM-TEST-01", 2.0, baseline_area_sq_km=100.0, has_geometry=True)
    assert res20.simulated_affected_area_sq_km == 190.0


def test_scenario_invalid_water_level_offset():
    """Test negative or invalid offset throws ValueError."""
    engine = ScenarioSimulatorEngine()
    with pytest.raises(ValueError):
        engine.simulate_water_level("TRACE-SIM-TEST-01", -1.0)


def test_scenario_missing_geospatial_data():
    """Test missing geometry and baseline area explicitly returns UNAVAILABLE status."""
    engine = ScenarioSimulatorEngine()
    res = engine.simulate_water_level("TRACE-SIM-TEST-01", 1.0, baseline_area_sq_km=None, has_geometry=False)
    assert res.elevation_data_status == "UNAVAILABLE"
    assert res.simulated_affected_area_sq_km is None


def test_scenario_unavailable_population_and_facilities():
    """Test unattached GIS datasets explicitly report 'Data unavailable for this scenario.' without inventing numbers."""
    engine = ScenarioSimulatorEngine()
    res = engine.simulate_water_level("TRACE-SIM-TEST-01", 1.0, baseline_area_sq_km=100.0, has_geometry=True)

    assert res.population_impact.status == "UNAVAILABLE"
    assert res.population_impact.count is None
    assert res.population_impact.message == "Data unavailable for this scenario."

    assert res.schools_impact.status == "UNAVAILABLE"
    assert res.schools_impact.count is None
    assert res.schools_impact.message == "Data unavailable for this scenario."

    assert res.health_facilities_impact.status == "UNAVAILABLE"
    assert res.health_facilities_impact.count is None
    assert res.health_facilities_impact.message == "Data unavailable for this scenario."


def test_api_simulate_scenario_endpoint(client):
    """Test POST /api/cases/{case_id}/simulate-scenario API endpoint."""
    res = client.post("/api/cases/TRACE-SIM-TEST-01/simulate-scenario?water_level_offset_m=1.0")
    assert res.status_code == 200
    data = res.json()
    assert data["case_id"] == "TRACE-SIM-TEST-01"
    assert data["water_level_offset_m"] == 1.0
    assert data["disclaimer"] == "Scenario simulation — not a forecast."
    assert "simulated_affected_area_sq_km" in data
    assert data["population_impact"]["message"] == "Data unavailable for this scenario."
