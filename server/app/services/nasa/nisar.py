from typing import Optional, List
from app.services.nasa.cmr import CMRSearchService
from app.services.nasa.schemas import NASAObservation


class NisarDiscoveryService:
    """
    Discovery service for NISAR L-band Earth observation candidates (GCOV, GSLC, GUNW, SME2).
    Discovers metadata for candidate scenes without downloading raster payloads.
    """

    SUPPORTED_PRODUCTS = {"GCOV", "GSLC", "GUNW", "SME2"}

    def __init__(self, cmr_service: Optional[CMRSearchService] = None):
        self.cmr_service = cmr_service or CMRSearchService()

    def discover_nisar_observations(
        self,
        bbox: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        product_type: Optional[str] = None,
        page_size: int = 20,
    ) -> List[NASAObservation]:
        target_product = (product_type or "GCOV").upper()
        
        # Build collection short name search key
        short_name = f"NISAR_L2_PR_{target_product}" if target_product in self.SUPPORTED_PRODUCTS else "NISAR_L2_PR_GCOV"

        results = self.cmr_service.search_granules(
            short_name=short_name,
            bbox=bbox,
            start_date=start_date,
            end_date=end_date,
            page_size=page_size,
            mission_label="NISAR",
            product_type_label=target_product if target_product in self.SUPPORTED_PRODUCTS else "GCOV",
        )

        return results
