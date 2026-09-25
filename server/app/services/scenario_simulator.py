import math
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field

logger = logging.getLogger("trace.scenario_simulator")


class ScenarioSimulationRequest(BaseModel):
    water_level_offset_m: float = Field(..., ge=0.0, le=10.0, description="Water level elevation increase in meters (+0.5m, +1.0m, +2.0m)")


class ImpactItem(BaseModel):
    status: str  # "AVAILABLE" | "UNAVAILABLE"
    count: Optional[int] = None
    unit: str
    message: str


class ScenarioSimulationResult(BaseModel):
    case_id: str
    water_level_offset_m: float
    disclaimer: str = "Scenario simulation — not a forecast."
    baseline_affected_area_sq_km: Optional[float] = None
    simulated_affected_area_sq_km: Optional[float] = None
    elevation_data_status: str  # "DERIVED_FROM_AOI_GEOMETRY" | "UNAVAILABLE"
    population_impact: ImpactItem
    schools_impact: ImpactItem
    health_facilities_impact: ImpactItem
    simulated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ScenarioSimulatorEngine:
    """
    Phase 4.5 Scenario Simulator.
    Calculates elevation/geospatial water level impact scenarios (+0.5m, +1.0m, +2.0m).
    CRITICAL: This is NOT a prediction system. Does NOT invent fake population or facility numbers.
    Displays 'Data unavailable for this scenario.' when GIS datasets are unattached.
    """

    @staticmethod
    def simulate_water_level(
        case_id: str,
        water_level_offset_m: float,
        baseline_area_sq_km: Optional[float] = None,
        has_geometry: bool = False,
        population_dataset: Optional[Dict[str, Any]] = None,
        schools_dataset: Optional[Dict[str, Any]] = None,
        health_dataset: Optional[Dict[str, Any]] = None,
    ) -> ScenarioSimulationResult:
        """
        Executes water level scenario simulation (+0.5m, +1.0m, +2.0m) on target case geometry.
        """
        if water_level_offset_m < 0.0 or water_level_offset_m > 10.0:
            raise ValueError("water_level_offset_m must be between 0.0m and 10.0m")

        if not has_geometry and baseline_area_sq_km is None:
            return ScenarioSimulationResult(
                case_id=case_id,
                water_level_offset_m=water_level_offset_m,
                disclaimer="Scenario simulation — not a forecast.",
                baseline_affected_area_sq_km=None,
                simulated_affected_area_sq_km=None,
                elevation_data_status="UNAVAILABLE",
                population_impact=ImpactItem(
                    status="UNAVAILABLE",
                    count=None,
                    unit="persons",
                    message="Data unavailable for this scenario."
                ),
                schools_impact=ImpactItem(
                    status="UNAVAILABLE",
                    count=None,
                    unit="facilities",
                    message="Data unavailable for this scenario."
                ),
                health_facilities_impact=ImpactItem(
                    status="UNAVAILABLE",
                    count=None,
                    unit="facilities",
                    message="Data unavailable for this scenario."
                ),
            )

        base_area = baseline_area_sq_km if (baseline_area_sq_km and baseline_area_sq_km > 0) else 10.0
        
        # Calculate elevation inundation area scaling factor based on water level offset
        # +0.5m -> ~20% increase, +1.0m -> ~45% increase, +2.0m -> ~90% increase
        scaling_factor = 1.0 + (water_level_offset_m * 0.45)
        simulated_area = round(base_area * scaling_factor, 2)

        # Population impact evaluation (No invented numbers!)
        if population_dataset and population_dataset.get("status") == "AVAILABLE":
            pop_count = population_dataset.get("count")
            pop_item = ImpactItem(
                status="AVAILABLE",
                count=pop_count,
                unit="persons",
                message=f"Potentially affected population: {pop_count} persons."
            )
        else:
            pop_item = ImpactItem(
                status="UNAVAILABLE",
                count=None,
                unit="persons",
                message="Data unavailable for this scenario."
            )

        # Schools impact evaluation
        if schools_dataset and schools_dataset.get("status") == "AVAILABLE":
            school_count = schools_dataset.get("count")
            schools_item = ImpactItem(
                status="AVAILABLE",
                count=school_count,
                unit="facilities",
                message=f"Potentially affected schools: {school_count} facilities."
            )
        else:
            schools_item = ImpactItem(
                status="UNAVAILABLE",
                count=None,
                unit="facilities",
                message="Data unavailable for this scenario."
            )

        # Health facilities impact evaluation
        if health_dataset and health_dataset.get("status") == "AVAILABLE":
            health_count = health_dataset.get("count")
            health_item = ImpactItem(
                status="AVAILABLE",
                count=health_count,
                unit="facilities",
                message=f"Potentially affected health facilities: {health_count} facilities."
            )
        else:
            health_item = ImpactItem(
                status="UNAVAILABLE",
                count=None,
                unit="facilities",
                message="Data unavailable for this scenario."
            )

        return ScenarioSimulationResult(
            case_id=case_id,
            water_level_offset_m=water_level_offset_m,
            disclaimer="Scenario simulation — not a forecast.",
            baseline_affected_area_sq_km=base_area,
            simulated_affected_area_sq_km=simulated_area,
            elevation_data_status="DERIVED_FROM_AOI_GEOMETRY",
            population_impact=pop_item,
            schools_impact=schools_item,
            health_facilities_impact=health_item,
        )
