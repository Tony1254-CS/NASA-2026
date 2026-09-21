from datetime import datetime, timezone
from unittest.mock import patch, MagicMock
import pytest
import httpx
from fastapi.testclient import TestClient

from server.app.main import app
from server.app.core.config import settings
from server.app.services.nasa.client import NasaHttpClient
from server.app.services.nasa.cmr import CMRSearchService
from server.app.services.nasa.nisar import NisarDiscoveryService
from server.app.services.nasa.gpm import GpmDiscoveryService
from server.app.services.nasa.modis import ModisDiscoveryService
from server.app.services.nasa.schemas import NASAObservation, GeoJSONGeometry

client = TestClient(app)

MOCK_CMR_RESPONSE = {
    "feed": {
        "entry": [
            {
                "id": "G123456-NASA",
                "producer_granule_id": "NISAR_L2_PR_GCOV_001_001_001_001_20260901.h5",
                "dataset_id": "NISAR_L2_PR_GCOV",
                "title": "NISAR L2 GCOV Granule Test",
                "time_start": "2026-09-01T12:00:00.000Z",
                "time_end": "2026-09-01T12:05:00.000Z",
                "polygons": [["0 0 1 0 1 1 0 1 0 0"]],
                "links": [
                    {
                        "href": "https://datapool.asf.alaska.edu/GCOV/NISAR_L2_PR_GCOV_001.h5",
                        "type": "application/x-hdfeos",
                    }
                ],
            }
        ]
    }
}


def test_nasa_config_defaults():
    assert hasattr(settings, "CMR_BASE_URL")
    assert hasattr(settings, "ASF_API_BASE_URL")
    assert settings.CMR_BASE_URL == "https://cmr.earthdata.nasa.gov"


@patch.object(NasaHttpClient, "get")
def test_cmr_granule_search_normalization(mock_nasa_get):
    mock_nasa_get.return_value = MOCK_CMR_RESPONSE

    service = CMRSearchService()
    observations = service.search_granules(short_name="NISAR_L2_PR_GCOV", bbox="-120,30,-115,35")

    assert len(observations) == 1
    obs = observations[0]
    assert obs.source == "NASA"
    assert obs.granule_id == "NISAR_L2_PR_GCOV_001_001_001_001_20260901.h5"
    assert obs.collection_id == "NISAR_L2_PR_GCOV"
    assert obs.spatial_extent is not None
    assert obs.spatial_extent.type == "Polygon"
    assert len(obs.access_links) == 1


@patch.object(NasaHttpClient, "get")
def test_nisar_discovery_gcov(mock_nasa_get):
    mock_nasa_get.return_value = MOCK_CMR_RESPONSE

    service = NisarDiscoveryService()
    obs_list = service.discover_nisar_observations(product_type="GCOV")

    assert len(obs_list) == 1
    assert obs_list[0].mission == "NISAR"
    assert obs_list[0].product_type == "GCOV"


@patch.object(NasaHttpClient, "get")
def test_nisar_discovery_product_filter(mock_nasa_get):
    mock_nasa_get.return_value = {"feed": {"entry": []}}

    service = NisarDiscoveryService()
    obs_gslc = service.discover_nisar_observations(product_type="GSLC")
    assert len(obs_gslc) == 0


@patch.object(NasaHttpClient, "get")
def test_gpm_discovery(mock_nasa_get):
    mock_nasa_get.return_value = {
        "feed": {
            "entry": [
                {
                    "id": "GPM-001",
                    "producer_granule_id": "3B-DAY.MS.MRG.3IMERG.20260901",
                    "dataset_id": "GPM_3IMERGDF",
                    "time_start": "2026-09-01T00:00:00.000Z",
                    "boxes": ["0 0 1 1"],
                }
            ]
        }
    }

    service = GpmDiscoveryService()
    gpm_list = service.discover_gpm_observations()
    assert len(gpm_list) == 1
    assert gpm_list[0].mission == "GPM"
    assert gpm_list[0].product_type == "IMERG_DAY"


@patch.object(NasaHttpClient, "get")
def test_modis_discovery(mock_nasa_get):
    mock_nasa_get.return_value = {
        "feed": {
            "entry": [
                {
                    "id": "MODIS-001",
                    "producer_granule_id": "MOD13A2.A2026241.h08v05",
                    "dataset_id": "MOD13A2",
                    "time_start": "2026-09-01T00:00:00.000Z",
                }
            ]
        }
    }

    service = ModisDiscoveryService()
    modis_list = service.discover_modis_observations(product_type="MOD13A2")
    assert len(modis_list) == 1
    assert modis_list[0].mission == "MODIS"


@patch.object(NasaHttpClient, "get")
def test_api_nisar_search_endpoint(mock_nasa_get):
    mock_nasa_get.return_value = MOCK_CMR_RESPONSE

    response = client.get("/api/nasa/nisar/search?bbox=-120,30,-115,35&product_type=GCOV")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] == 1
    assert data["items"][0]["mission"] == "NISAR"
    assert data["items"][0]["product_type"] == "GCOV"


@patch.object(NasaHttpClient, "get")
def test_api_gpm_search_endpoint(mock_nasa_get):
    mock_nasa_get.return_value = {"feed": {"entry": []}}

    response = client.get("/api/nasa/gpm/search")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@patch.object(NasaHttpClient, "get")
def test_api_modis_search_endpoint(mock_nasa_get):
    mock_nasa_get.return_value = {"feed": {"entry": []}}

    response = client.get("/api/nasa/modis/search")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@patch("server.app.api.routes.nasa.httpx.Client")
def test_api_nasa_health_endpoint(mock_httpx_cls):
    mock_instance = MagicMock()
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_instance.get.return_value = mock_resp
    mock_httpx_cls.return_value.__enter__.return_value = mock_instance

    response = client.get("/api/nasa/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "cmr_reachable" in data
    assert "earthdata_auth_status" in data
    assert "token" not in data
    assert "password" not in data
    assert "username" not in data


@patch("server.app.services.nasa.client.httpx.Client")
def test_nasa_client_timeout_handling(mock_httpx_cls):
    mock_instance = MagicMock()
    mock_instance.get.side_effect = httpx.TimeoutException("NASA timeout")
    mock_httpx_cls.return_value.__enter__.return_value = mock_instance

    client_instance = NasaHttpClient(max_retries=1)
    with pytest.raises(Exception) as excinfo:
        client_instance.get("https://cmr.earthdata.nasa.gov/search/granules.json")
    assert "504" in str(excinfo.value)
