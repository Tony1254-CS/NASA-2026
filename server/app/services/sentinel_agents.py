import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from app.services.nasa.cmr import CMRSearchService
from app.services.nasa.nisar import NisarDiscoveryService
from app.services.nasa.firms import FirmsDiscoveryService
from app.services.nasa.gpm import GpmDiscoveryService
from app.services.nasa.modis import ModisDiscoveryService
from app.services.evidence_engine import CrossMissionEvidenceEngine, EvidenceFusionResult
from app.services.self_audit_engine import SelfAuditEngine, SelfAuditResult

logger = logging.getLogger("trace.sentinel_agents")


class AgentStepOutput(BaseModel):
    agent_name: str  # "DataAgent" | "DetectionAgent" | "EvidenceAgent" | "ChallengeAgent" | "InterpretationAgent"
    status: str  # "SUCCESS" | "WARNING" | "FAILED" | "DISAGREED"
    summary: str
    data_payload: Dict[str, Any] = Field(default_factory=dict)
    provenance: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AgentWorkflowResult(BaseModel):
    case_id: str
    event_type: str
    overall_workflow_status: str  # "COMPLETED_SUPPORTED" | "COMPLETED_INCONCLUSIVE" | "COMPLETED_REJECTED" | "WORKFLOW_FAILED"
    final_verdict: str  # "SUPPORTED" | "INCONCLUSIVE" | "REJECTED"
    challenge_disagreed: bool = False
    execution_log: List[AgentStepOutput] = Field(default_factory=list)
    interpretation_narrative: str
    non_causal_statement: str
    executed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==================== 1. DATA AGENT ====================
class DataAgent:
    """Orchestrates CMR and NASA Earthdata dataset metadata discovery."""

    def __init__(self, cmr_service: Optional[CMRSearchService] = None):
        self.cmr_service = cmr_service or CMRSearchService()

    def run(self, case_id: str, bbox: Optional[str], start_date: str, end_date: str) -> AgentStepOutput:
        try:
            granules = self.cmr_service.search_granules(bbox=bbox, start_date=start_date, end_date=end_date, page_size=10)
            return AgentStepOutput(
                agent_name="DataAgent",
                status="SUCCESS",
                summary=f"Discovered {len(granules)} NASA Earthdata granules for target area.",
                data_payload={"discovered_granules_count": len(granules), "bbox": bbox},
                provenance={
                    "agent": "DataAgent",
                    "cmr_endpoint": self.cmr_service.cmr_url,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )
        except Exception as exc:
            logger.warning(f"DataAgent warning: {exc}")
            return AgentStepOutput(
                agent_name="DataAgent",
                status="WARNING",
                summary="DataAgent encountered query timeout/degradation; proceeding with local database case metadata.",
                data_payload={"error": str(exc)},
                provenance={"agent": "DataAgent", "error": str(exc)},
            )


# ==================== 2. DETECTION AGENT ====================
class DetectionAgent:
    """Evaluates NISAR L-band SAR backscatter drops and affected area metrics."""

    def run(
        self,
        case_id: str,
        delta_backscatter: Optional[float],
        affected_area: Optional[float],
        change_metric: Optional[str] = None,
    ) -> AgentStepOutput:
        if delta_backscatter is None and affected_area is None:
            return AgentStepOutput(
                agent_name="DetectionAgent",
                status="FAILED",
                summary="No primary NISAR SAR measurement payload attached.",
                data_payload={"anomaly_detected": False},
                provenance={"agent": "DetectionAgent", "method": "SAR_BACKSCATTER_THRESHOLD_CHECK"},
            )

        anomaly_detected = (delta_backscatter is not None and delta_backscatter <= -1.5) or (affected_area is not None and affected_area > 0.0)

        return AgentStepOutput(
            agent_name="DetectionAgent",
            status="SUCCESS" if anomaly_detected else "WARNING",
            summary=f"Detection Agent evaluated SAR anomaly: {'DETECTED' if anomaly_detected else 'NOT_DETECTED'} (dB={delta_backscatter}, area={affected_area}).",
            data_payload={
                "anomaly_detected": anomaly_detected,
                "delta_backscatter": delta_backscatter,
                "affected_area": affected_area,
                "change_metric": change_metric,
            },
            provenance={
                "agent": "DetectionAgent",
                "threshold": "delta_backscatter <= -1.5 dB or affected_area > 0",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )


# ==================== 3. EVIDENCE AGENT ====================
class EvidenceAgent:
    """Orchestrates cross-mission evidence discovery (FIRMS, GPM, MODIS) and spatiotemporal fusion."""

    def __init__(self, fusion_engine: Optional[CrossMissionEvidenceEngine] = None):
        self.fusion_engine = fusion_engine or CrossMissionEvidenceEngine()

    def run(
        self,
        case_id: str,
        event_type: str,
        bbox: Optional[str],
        observation_start: datetime,
        observation_end: datetime,
        delta_backscatter: Optional[float],
        affected_area: Optional[float],
    ) -> Tuple[AgentStepOutput, EvidenceFusionResult]:
        fusion_res = self.fusion_engine.evaluate_case_evidence(
            case_id=case_id,
            event_type=event_type,
            bbox=bbox,
            observation_start=observation_start,
            observation_end=observation_end,
            sar_backscatter_delta=delta_backscatter,
            sar_affected_area=affected_area,
        )

        step_output = AgentStepOutput(
            agent_name="EvidenceAgent",
            status="SUCCESS" if fusion_res.overall_status in {"CONFIRMED_MULTIMISSION", "PARTIALLY_SUPPORTED"} else "WARNING",
            summary=f"Evidence Agent fusion state: {fusion_res.overall_status}.",
            data_payload=fusion_res.model_dump(),
            provenance={
                "agent": "EvidenceAgent",
                "method": "SPATIAL_TEMPORAL_EVIDENCE_FUSION_V1",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return step_output, fusion_res


# ==================== 4. CHALLENGE AGENT ====================
class ChallengeAgent:
    """
    Executes deterministic self-audit rules.
    CRITICAL: Challenge Agent IS ALLOWED TO DISAGREE with Detection Agent findings.
    """

    def __init__(self, audit_engine: Optional[SelfAuditEngine] = None):
        self.audit_engine = audit_engine or SelfAuditEngine()

    def run(
        self,
        case_id: str,
        event_type: str,
        observation_start: datetime,
        observation_end: datetime,
        bbox: Optional[str],
        delta_backscatter: Optional[float],
        affected_area: Optional[float],
        change_metric: Optional[str],
        evidence_records: Optional[List[Dict[str, Any]]],
        field_observations: Optional[List[Dict[str, Any]]],
        detection_anomaly_flag: bool,
    ) -> Tuple[AgentStepOutput, SelfAuditResult]:
        audit_res = self.audit_engine.evaluate_audit(
            case_id=case_id,
            event_type=event_type,
            observation_start=observation_start,
            observation_end=observation_end,
            bbox=bbox,
            delta_backscatter=delta_backscatter,
            affected_area=affected_area,
            change_metric=change_metric,
            evidence_records=evidence_records,
            field_observations=field_observations,
        )

        disagreed = (detection_anomaly_flag and audit_res.overall_audit_state == "REJECTED")
        status_str = "DISAGREED" if disagreed else ("SUCCESS" if audit_res.overall_audit_state == "SUPPORTED" else "WARNING")

        summary_msg = f"Challenge Agent audit verdict: {audit_res.overall_audit_state}."
        if disagreed:
            summary_msg += " (DISAGREED with Detection Agent due to explicit contradiction/quality failure)."

        step_output = AgentStepOutput(
            agent_name="ChallengeAgent",
            status=status_str,
            summary=summary_msg,
            data_payload=audit_res.model_dump(),
            provenance={
                "agent": "ChallengeAgent",
                "disagreed_with_detection": disagreed,
                "confidence_score": audit_res.confidence_score,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return step_output, audit_res


# ==================== 5. INTERPRETATION AGENT ====================
class InterpretationAgent:
    """Assembles final scientific narrative, non-causal statement, and execution log."""

    def run(
        self,
        case_id: str,
        fusion_result: EvidenceFusionResult,
        audit_result: SelfAuditResult,
        challenge_disagreed: bool,
    ) -> AgentStepOutput:
        narrative = fusion_result.hypothesis_narrative
        if challenge_disagreed:
            narrative = f"[CHALLENGE DISAGREEMENT] {audit_result.summary_explanation} {narrative}"

        statement = fusion_result.non_causal_statement

        return AgentStepOutput(
            agent_name="InterpretationAgent",
            status="SUCCESS",
            summary=f"Interpretation Agent compiled final non-causal scientific narrative. Verdict: {audit_result.overall_audit_state}.",
            data_payload={
                "narrative": narrative,
                "non_causal_statement": statement,
                "overall_verdict": audit_result.overall_audit_state,
            },
            provenance={
                "agent": "InterpretationAgent",
                "method": "NON_CAUSAL_SCIENTIFIC_SYNTHESIS_V1",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )


# ==================== SENTINEL AGENT WORKFLOW ORCHESTRATOR ====================
class AutonomousSentinelWorkflow:
    """
    Agentic Workflow Orchestrator for Phase 4.6.
    Data Agent -> Detection Agent -> Evidence Agent -> Challenge Agent -> Interpretation Agent.
    """

    def __init__(self):
        self.data_agent = DataAgent()
        self.detection_agent = DetectionAgent()
        self.evidence_agent = EvidenceAgent()
        self.challenge_agent = ChallengeAgent()
        self.interpretation_agent = InterpretationAgent()

    def execute_workflow(
        self,
        case_id: str,
        event_type: str,
        observation_start: datetime,
        observation_end: datetime,
        bbox: Optional[str] = None,
        delta_backscatter: Optional[float] = None,
        affected_area: Optional[float] = None,
        change_metric: Optional[str] = None,
        evidence_records: Optional[List[Dict[str, Any]]] = None,
        field_observations: Optional[List[Dict[str, Any]]] = None,
    ) -> AgentWorkflowResult:
        execution_log: List[AgentStepOutput] = []

        start_iso = observation_start.isoformat()
        end_iso = observation_end.isoformat()

        # Step 1: Data Agent
        data_step = self.data_agent.run(case_id, bbox, start_iso, end_iso)
        execution_log.append(data_step)

        # Step 2: Detection Agent
        detection_step = self.detection_agent.run(case_id, delta_backscatter, affected_area, change_metric)
        execution_log.append(detection_step)

        if detection_step.status == "FAILED":
            return AgentWorkflowResult(
                case_id=case_id,
                event_type=event_type,
                overall_workflow_status="WORKFLOW_FAILED",
                final_verdict="INCONCLUSIVE",
                challenge_disagreed=False,
                execution_log=execution_log,
                interpretation_narrative="Workflow failed at Detection Agent stage: Missing primary SAR measurement payload.",
                non_causal_statement="Inconclusive: insufficient SAR measurement data.",
            )

        anomaly_flag = detection_step.data_payload.get("anomaly_detected", False)

        # Step 3: Evidence Agent
        evidence_step, fusion_res = self.evidence_agent.run(
            case_id, event_type, bbox, observation_start, observation_end, delta_backscatter, affected_area
        )
        execution_log.append(evidence_step)

        # Step 4: Challenge Agent
        challenge_step, audit_res = self.challenge_agent.run(
            case_id,
            event_type,
            observation_start,
            observation_end,
            bbox,
            delta_backscatter,
            affected_area,
            change_metric,
            evidence_records or [item.model_dump() for item in fusion_res.sensor_evaluations["FIRMS"].evidence_items],
            field_observations,
            anomaly_flag,
        )
        execution_log.append(challenge_step)

        disagreed = challenge_step.status == "DISAGREED"

        # Step 5: Interpretation Agent
        interp_step = self.interpretation_agent.run(case_id, fusion_res, audit_res, disagreed)
        execution_log.append(interp_step)

        verdict = audit_res.overall_audit_state
        workflow_status = f"COMPLETED_{verdict}"

        return AgentWorkflowResult(
            case_id=case_id,
            event_type=event_type,
            overall_workflow_status=workflow_status,
            final_verdict=verdict,
            challenge_disagreed=disagreed,
            execution_log=execution_log,
            interpretation_narrative=interp_step.data_payload.get("narrative", ""),
            non_causal_statement=interp_step.data_payload.get("non_causal_statement", ""),
        )
