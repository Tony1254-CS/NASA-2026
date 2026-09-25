import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import geoalchemy2.admin
from geoalchemy2 import Geometry
import shapely.wkt

from app.main import app
from app.core.database import Base, get_db
from app.core.seed import seed_initial_cases

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

    seed_initial_cases(db)

    yield db

    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

client = TestClient(app)



def test_create_and_fetch_threshold_alert():
    case_id = "CASE-017"

    # 1. Create a threshold alert for CASE-017
    # CASE-017 has seeded NISAR measurement delta_backscatter = -2.43
    payload = {
        "metric_name": "delta_backscatter",
        "threshold_value": -2.0,
        "comparison": "less_than",
        "is_active": True,
    }

    create_res = client.post(f"/api/cases/{case_id}/alerts", json=payload)
    assert create_res.status_code == 201, f"Expected 201, got {create_res.status_code}: {create_res.text}"
    alert_data = create_res.json()

    assert alert_data["case_id"] == case_id
    assert alert_data["metric_name"] == "delta_backscatter"
    assert alert_data["threshold_value"] == -2.0
    assert alert_data["is_active"] is True
    # Since current measurement (-2.43) is <= -2.0, state should be TRIGGERED
    assert alert_data["triggered_state"] == "TRIGGERED"
    assert alert_data["last_evaluated_val"] == -2.43
    assert alert_data["last_triggered_at"] is not None

    # 2. Fetch alerts for case
    get_res = client.get(f"/api/cases/{case_id}/alerts")
    assert get_res.status_code == 200
    alerts = get_res.json()
    assert len(alerts) >= 1
    matched = next((a for a in alerts if a["id"] == alert_data["id"]), None)
    assert matched is not None
    assert matched["triggered_state"] == "TRIGGERED"


def test_duplicate_alert_protection_no_timestamp_spam():
    case_id = "CASE-017"

    # 1. Create alert
    payload = {
        "metric_name": "delta_backscatter",
        "threshold_value": -2.0,
        "comparison": "less_than",
        "is_active": True,
    }
    create_res = client.post(f"/api/cases/{case_id}/alerts", json=payload)
    first_trigger = create_res.json()["last_triggered_at"]

    # 2. Fetch case detail multiple times (simulating refetch/polling)
    detail_res_1 = client.get(f"/api/cases/{case_id}")
    assert detail_res_1.status_code == 200

    detail_res_2 = client.get(f"/api/cases/{case_id}")
    assert detail_res_2.status_code == 200

    # Verify state remains TRIGGERED and last_triggered_at is unchanged (anti-spam protection)
    alerts_res = client.get(f"/api/cases/{case_id}/alerts")
    alert = alerts_res.json()[0]
    assert alert["triggered_state"] == "TRIGGERED"
    assert alert["last_triggered_at"] == first_trigger


def test_update_alert_threshold_and_state():
    case_id = "CASE-017"

    # Create initial alert
    payload = {
        "metric_name": "affected_area",
        "threshold_value": 100.0,
        "comparison": "greater_than",
        "is_active": True,
    }
    create_res = client.post(f"/api/cases/{case_id}/alerts", json=payload)
    alert_id = create_res.json()["id"]

    # Current CASE-017 affected_area = 45.2, threshold = 100.0 => should be ARMED
    assert create_res.json()["triggered_state"] == "ARMED"

    # Lower threshold to 40.0 => should trigger
    patch_res = client.patch(f"/api/cases/{case_id}/alerts/{alert_id}", json={"threshold_value": 40.0})
    assert patch_res.status_code == 200
    patched_alert = patch_res.json()
    assert patched_alert["threshold_value"] == 40.0
    assert patched_alert["triggered_state"] == "TRIGGERED"
