import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import geoalchemy2.admin
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

# Minimal 1x1 transparent PNG bytes for testing
TINY_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00"
    b"\x02\x00\x01Hh\x8e\xd9\x00\x00\x00\x00IEND\xaeB`\x82"
)



def test_multipart_photo_upload_field_observation():
    case_id = "CASE-017"
    files = {
        "file": ("test_ground_photo.png", io.BytesIO(TINY_PNG_BYTES), "image/png"),
    }
    data = {
        "note": "Ground truth flood observation verified.",
        "observed_at": "2026-09-24T00:00:00Z",
        "latitude": "23.8103",
        "longitude": "90.4125",
    }

    response = client.post(f"/api/cases/{case_id}/field-observations", files=files, data=data)

    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    result = response.json()
    assert result["case_id"] == case_id
    assert result["note"] == "Ground truth flood observation verified."
    assert result["photo_reference"] is not None
    assert "field-observations" in result["photo_reference"]
    assert "test_ground_photo.png" in result["photo_reference"]
    assert result.get("source_type") == "human_observation"
    assert result.get("source") == "HUMAN_OBSERVATION"

    # Verify that an Evidence record was created for the same case
    ev_res = client.get(f"/api/cases/{case_id}/evidence")
    assert ev_res.status_code == 200
    evidence_items = ev_res.json()
    human_ev = next((item for item in evidence_items if item.get("visualization_uri") == result["photo_reference"]), None)
    assert human_ev is not None
    assert human_ev["case_id"] == case_id
    assert human_ev["source_type"] == "human_observation"



def test_invalid_file_extension_upload():
    case_id = "CASE-017"
    files = {
        "file": ("malicious.exe", io.BytesIO(b"MZ1234567890"), "application/x-msdownload"),
    }
    data = {
        "note": "Test invalid upload",
        "observed_at": "2026-09-24T00:00:00Z",
        "latitude": "23.8103",
        "longitude": "90.4125",
    }

    response = client.post(f"/api/cases/{case_id}/field-observations", files=files, data=data)

    assert response.status_code == 400
    assert "Unsupported file extension" in response.text or "Invalid MIME type" in response.text
