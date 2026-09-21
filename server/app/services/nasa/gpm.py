from typing import Optional, List
from server.app.services.nasa.cmr import CMRSearchService
from server.app.services.nasa.schemas import NASAObservation


class GpmDiscoveryService:
    """
    Discovery service for GPM IMERG precipitation metadata observations.
    Used as independent baseline/supporting evidence discovery.
    """

    def __init__(self, cmr_service: Optional[CMRSearchService] = None):
        self.cmr_service = cmr_service or CMRSearchService()

    def discover_gpm_observations(
        self,
        bbox: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page_size: int = 20,
    ) -> List[NASAObservation]:
        results = self.cmr_service.search_granules(
            short_name="GPM_3IMERGDF",
            bbox=bbox,
            start_date=start_date,
            end_date=end_date,
            page_size=page_size,
            mission_label="GPM",
            product_type_label="IMERG_DAY",
        )
        return results
