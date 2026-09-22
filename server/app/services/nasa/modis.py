from typing import Optional, List
from app.services.nasa.cmr import CMRSearchService
from app.services.nasa.schemas import NASAObservation


class ModisDiscoveryService:
    """
    Discovery service for MODIS / land-context metadata observations (MOD13A2, MYD13A2).
    """

    def __init__(self, cmr_service: Optional[CMRSearchService] = None):
        self.cmr_service = cmr_service or CMRSearchService()

    def discover_modis_observations(
        self,
        bbox: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        product_type: Optional[str] = "MOD13A2",
        page_size: int = 20,
    ) -> List[NASAObservation]:
        short_name = (product_type or "MOD13A2").upper()

        results = self.cmr_service.search_granules(
            short_name=short_name,
            bbox=bbox,
            start_date=start_date,
            end_date=end_date,
            page_size=page_size,
            mission_label="MODIS",
            product_type_label=short_name,
        )
        return results
