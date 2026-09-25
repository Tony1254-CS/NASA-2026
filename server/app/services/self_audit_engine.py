import logging
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone
from pydantic import BaseModel, Field

logger = logging.getLogger("trace.self_audit_engine")


class CheckResultItem(BaseModel):
    """
    Individual audit rule check result.
    """
    check_type: str
    rule_name: str
    rule_version: str = "1.0"
    status: str  # PASS | WARNING | FAIL | NOT_EVALUATED
    value: Optional[str] = None
    threshold: Optional[str] = None
    rationale: str
    source: str


class SelfAuditResult(BaseModel):
    """
    Structured response for a scientific self-audit evaluation.
    """
    case_id: str
    overall_audit_state: str  # SUPPORTED | INCONCLUSIVE | REJECTED
    confidence_score: float  # 0.0 to 1.0
    summary_explanation: str
    checks: List[CheckResultItem] = Field(default_factory=list)
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SelfAuditEngine:
    """
    Phase 4.2 Challenge the Finding / Self-Audit Engine.
    Executes 7 deterministic scientific quality control and hypothesis verification checks
    on SAR/NISAR anomaly detections.
    Does NOT blindly confirm findings.
    """

    def __init__(self):
        pass

    def evaluate_audit(
        self,
        case_id: str,
        event_type: str,
        observation_start: datetime,
        observation_end: datetime,
        bbox: Optional[str] = None,
        delta_backscatter: Optional[float] = None,
        affected_area: Optional[float] = None,
        change_metric: Optional[str] = None,
        coherence_val: Optional[float] = None,
        evidence_records: Optional[List[Dict[str, Any]]] = None,
        field_observations: Optional[List[Dict[str, Any]]] = None,
    ) -> SelfAuditResult:
        """
        Executes self-audit rules and returns a structured SelfAuditResult with rationale explanations.
        """
        checks: List[CheckResultItem] = []
        evidence_list = evidence_records or []
        field_obs_list = field_observations or []

        # ---------------------------------------------------------
        # RULE 1: DATA_QUALITY_CHECK
        # ---------------------------------------------------------
        if delta_backscatter is None and affected_area is None:
            checks.append(
                CheckResultItem(
                    check_type="DATA_QUALITY_CHECK",
                    rule_name="SAR Payload Completeness",
                    rule_version="1.0",
                    status="FAIL",
                    value="NULL",
                    threshold="delta_backscatter <= -1.5 dB or affected_area > 0",
                    rationale="Primary SAR measurement payload is missing or empty. Cannot verify radar detection.",
                    source="NISAR_MEASUREMENT_TABLE",
                )
            )
        elif (delta_backscatter is not None and delta_backscatter <= -1.5) or (affected_area is not None and affected_area > 0.0):
            checks.append(
                CheckResultItem(
                    check_type="DATA_QUALITY_CHECK",
                    rule_name="SAR Payload Completeness",
                    rule_version="1.0",
                    status="PASS",
                    value=f"dB={delta_backscatter if delta_backscatter is not None else 'N/A'}, area={affected_area if affected_area is not None else 'N/A'}",
                    threshold="delta_backscatter <= -1.5 dB or affected_area > 0",
                    rationale="SAR measurement contains valid significant backscatter change or affected area metric.",
                    source="NISAR_MEASUREMENT_TABLE",
                )
            )
        elif delta_backscatter is not None and -1.5 < delta_backscatter <= -0.5:
            checks.append(
                CheckResultItem(
                    check_type="DATA_QUALITY_CHECK",
                    rule_name="SAR Payload Completeness",
                    rule_version="1.0",
                    status="WARNING",
                    value=f"dB={delta_backscatter}",
                    threshold="delta_backscatter <= -1.5 dB",
                    rationale="Weak SAR backscatter drop detected. Signal magnitude is close to baseline noise floor.",
                    source="NISAR_MEASUREMENT_TABLE",
                )
            )
        else:
            checks.append(
                CheckResultItem(
                    check_type="DATA_QUALITY_CHECK",
                    rule_name="SAR Payload Completeness",
                    rule_version="1.0",
                    status="FAIL",
                    value=f"dB={delta_backscatter}, area={affected_area}",
                    threshold="delta_backscatter <= -1.5 dB",
                    rationale="SAR backscatter drop is insignificant or positive. Does not indicate surface change anomaly.",
                    source="NISAR_MEASUREMENT_TABLE",
                )
            )

        # ---------------------------------------------------------
        # RULE 2: COHERENCE_QUALITY_CHECK
        # ---------------------------------------------------------
        if coherence_val is not None:
            if coherence_val >= 0.4:
                checks.append(
                    CheckResultItem(
                        check_type="COHERENCE_QUALITY_CHECK",
                        rule_name="Interferometric Phase Coherence",
                        rule_version="1.0",
                        status="PASS",
                        value=f"coherence={coherence_val:.2f}",
                        threshold="coherence >= 0.4",
                        rationale="Phase coherence is high; low decorrelation noise risk.",
                        source="GUNW_INTERFEROGRAM",
                    )
                )
            elif 0.2 <= coherence_val < 0.4:
                checks.append(
                    CheckResultItem(
                        check_type="COHERENCE_QUALITY_CHECK",
                        rule_name="Interferometric Phase Coherence",
                        rule_version="1.0",
                        status="WARNING",
                        value=f"coherence={coherence_val:.2f}",
                        threshold="coherence >= 0.4",
                        rationale="Moderate phase decorrelation detected. Possible vegetation speckle noise.",
                        source="GUNW_INTERFEROGRAM",
                    )
                )
            else:
                checks.append(
                    CheckResultItem(
                        check_type="COHERENCE_QUALITY_CHECK",
                        rule_name="Interferometric Phase Coherence",
                        rule_version="1.0",
                        status="FAIL",
                        value=f"coherence={coherence_val:.2f}",
                        threshold="coherence >= 0.2",
                        rationale="Severe phase decorrelation noise. Interferometric measurement is unreliable.",
                        source="GUNW_INTERFEROGRAM",
                    )
                )
        elif change_metric:
            checks.append(
                CheckResultItem(
                    check_type="COHERENCE_QUALITY_CHECK",
                    rule_name="Interferometric Phase Coherence",
                    rule_version="1.0",
                    status="PASS",
                    value=f"metric={change_metric}",
                    threshold="change_metric != null",
                    rationale="Validated change metric present in SAR measurement payload.",
                    source="NISAR_MEASUREMENT_TABLE",
                )
            )
        else:
            checks.append(
                CheckResultItem(
                    check_type="COHERENCE_QUALITY_CHECK",
                    rule_name="Interferometric Phase Coherence",
                    rule_version="1.0",
                    status="NOT_EVALUATED",
                    value="None",
                    threshold="coherence >= 0.4",
                    rationale="Phase coherence data unavailable for this SAR pass.",
                    source="NISAR_MEASUREMENT_TABLE",
                )
            )

        # ---------------------------------------------------------
        # RULE 3: TEMPORAL_CONSISTENCY_CHECK
        # ---------------------------------------------------------
        if observation_start and observation_end:
            duration_days = (observation_end - observation_start).total_seconds() / 86400.0
            if 0.25 <= duration_days <= 60.0:
                checks.append(
                    CheckResultItem(
                        check_type="TEMPORAL_CONSISTENCY_CHECK",
                        rule_name="Observation Window Duration",
                        rule_version="1.0",
                        status="PASS",
                        value=f"{duration_days:.1f} days",
                        threshold="0.25 <= duration <= 60 days",
                        rationale="Observation window duration is realistic for Earth observation satellite revisit.",
                        source="CASE_METADATA",
                    )
                )
            else:
                checks.append(
                    CheckResultItem(
                        check_type="TEMPORAL_CONSISTENCY_CHECK",
                        rule_name="Observation Window Duration",
                        rule_version="1.0",
                        status="WARNING",
                        value=f"{duration_days:.1f} days",
                        threshold="0.25 <= duration <= 60 days",
                        rationale="Observation window is unusually narrow or broad.",
                        source="CASE_METADATA",
                    )
                )
        else:
            checks.append(
                CheckResultItem(
                    check_type="TEMPORAL_CONSISTENCY_CHECK",
                    rule_name="Observation Window Duration",
                    rule_version="1.0",
                    status="NOT_EVALUATED",
                    value="Missing dates",
                    threshold="Valid dates",
                    rationale="Observation start or end date missing.",
                    source="CASE_METADATA",
                )
            )

        # ---------------------------------------------------------
        # RULE 4: SPATIAL_CONSISTENCY_CHECK
        # ---------------------------------------------------------
        if bbox:
            try:
                parts = [float(x) for x in bbox.split(",")]
                if len(parts) == 4 and -180 <= parts[0] <= 180 and -90 <= parts[1] <= 90:
                    checks.append(
                        CheckResultItem(
                            check_type="SPATIAL_CONSISTENCY_CHECK",
                            rule_name="Geographic Bounding Box",
                            rule_version="1.0",
                            status="PASS",
                            value=bbox,
                            threshold="Valid EPSG:4326 bbox",
                            rationale="Target area geographic coordinates are valid and bounded.",
                            source="CASE_GEOMETRY",
                        )
                    )
                else:
                    checks.append(
                        CheckResultItem(
                            check_type="SPATIAL_CONSISTENCY_CHECK",
                            rule_name="Geographic Bounding Box",
                            rule_version="1.0",
                            status="FAIL",
                            value=bbox,
                            threshold="Valid EPSG:4326 bbox",
                            rationale="Geographic coordinates fall outside valid latitude/longitude bounds.",
                            source="CASE_GEOMETRY",
                        )
                    )
            except Exception:
                checks.append(
                    CheckResultItem(
                        check_type="SPATIAL_CONSISTENCY_CHECK",
                        rule_name="Geographic Bounding Box",
                        rule_version="1.0",
                        status="FAIL",
                        value=str(bbox),
                        threshold="Valid EPSG:4326 bbox",
                        rationale="Malformed geographic bounding box format.",
                        source="CASE_GEOMETRY",
                    )
                )
        else:
            checks.append(
                CheckResultItem(
                    check_type="SPATIAL_CONSISTENCY_CHECK",
                    rule_name="Geographic Bounding Box",
                    rule_version="1.0",
                    status="WARNING",
                    value="None",
                    threshold="Valid EPSG:4326 bbox",
                    rationale="No spatial bounding box geometry specified for case.",
                    source="CASE_GEOMETRY",
                )
            )

        # ---------------------------------------------------------
        # RULE 5: ATMOSPHERIC_ARTIFACT_WARNING_CHECK
        # ---------------------------------------------------------
        supporting_evidence_count = sum(
            1 for ev in evidence_list if ev.get("status") in {"evaluated", "supports", "SUPPORTING"}
        )
        if supporting_evidence_count >= 1:
            checks.append(
                CheckResultItem(
                    check_type="ATMOSPHERIC_ARTIFACT_WARNING_CHECK",
                    rule_name="Tropospheric Phase Artifact Evaluation",
                    rule_version="1.0",
                    status="PASS",
                    value=f"{supporting_evidence_count} corroborating datasets",
                    threshold="Count >= 1",
                    rationale="SAR anomaly is corroborated by independent cross-mission sensors; low atmospheric artifact probability.",
                    source="CROSS_MISSION_EVIDENCE_ENGINE",
                )
            )
        elif delta_backscatter is not None and delta_backscatter <= -1.5:
            checks.append(
                CheckResultItem(
                    check_type="ATMOSPHERIC_ARTIFACT_WARNING_CHECK",
                    rule_name="Tropospheric Phase Artifact Evaluation",
                    rule_version="1.0",
                    status="WARNING",
                    value="0 corroborating datasets",
                    threshold="Count >= 1",
                    rationale="Single-pass SAR backscatter drop with zero corroborating independent sensors. Tropospheric moisture phase delay risk flagged.",
                    source="CROSS_MISSION_EVIDENCE_ENGINE",
                )
            )
        else:
            checks.append(
                CheckResultItem(
                    check_type="ATMOSPHERIC_ARTIFACT_WARNING_CHECK",
                    rule_name="Tropospheric Phase Artifact Evaluation",
                    rule_version="1.0",
                    status="NOT_EVALUATED",
                    value="0 datasets",
                    threshold="Count >= 1",
                    rationale="Insufficient evidence to evaluate atmospheric artifact risk.",
                    source="CROSS_MISSION_EVIDENCE_ENGINE",
                )
            )

        # ---------------------------------------------------------
        # RULE 6: INDEPENDENT_EVIDENCE_AVAILABILITY_CHECK
        # ---------------------------------------------------------
        total_evidence_sources = len(set(ev.get("source_type", "").lower() for ev in evidence_list if ev.get("source_type")))
        if total_evidence_sources >= 2:
            checks.append(
                CheckResultItem(
                    check_type="INDEPENDENT_EVIDENCE_AVAILABILITY_CHECK",
                    rule_name="Multi-Sensor Coverage Completeness",
                    rule_version="1.0",
                    status="PASS",
                    value=f"{total_evidence_sources} distinct sources",
                    threshold="Count >= 2",
                    rationale="Multiple independent Earth observation data sources are available.",
                    source="EVIDENCE_CATALOG",
                )
            )
        elif total_evidence_sources == 1:
            checks.append(
                CheckResultItem(
                    check_type="INDEPENDENT_EVIDENCE_AVAILABILITY_CHECK",
                    rule_name="Multi-Sensor Coverage Completeness",
                    rule_version="1.0",
                    status="WARNING",
                    value="1 source",
                    threshold="Count >= 2",
                    rationale="Only a single independent data source is available for baseline comparison.",
                    source="EVIDENCE_CATALOG",
                )
            )
        else:
            checks.append(
                CheckResultItem(
                    check_type="INDEPENDENT_EVIDENCE_AVAILABILITY_CHECK",
                    rule_name="Multi-Sensor Coverage Completeness",
                    rule_version="1.0",
                    status="NOT_EVALUATED",
                    value="0 sources",
                    threshold="Count >= 1",
                    rationale="Zero independent satellite datasets available or queryable. Cross-sensor coverage is missing.",
                    source="EVIDENCE_CATALOG",
                )
            )


        # ---------------------------------------------------------
        # RULE 7: GROUND_TRUTH_CONSISTENCY_CHECK
        # ---------------------------------------------------------
        contradictory_ground_obs = []
        supporting_ground_obs = []
        for fo in field_obs_list:
            note = str(fo.get("note", "")).lower()
            if any(term in note for term in ["false positive", "no damage", "no fire", "no flood", "normal ground", "contradict"]):
                contradictory_ground_obs.append(fo)
            else:
                supporting_ground_obs.append(fo)

        if contradictory_ground_obs:
            checks.append(
                CheckResultItem(
                    check_type="GROUND_TRUTH_CONSISTENCY_CHECK",
                    rule_name="Ground Field Observation Verification",
                    rule_version="1.0",
                    status="FAIL",
                    value=f"{len(contradictory_ground_obs)} contradictory observations",
                    threshold="Contradictions == 0",
                    rationale=f"Ground truth observation explicitly contradicts SAR anomaly detection: '{contradictory_ground_obs[0].get('note')}'",
                    source="FIELD_OBSERVATIONS",
                )
            )
        elif supporting_ground_obs:
            checks.append(
                CheckResultItem(
                    check_type="GROUND_TRUTH_CONSISTENCY_CHECK",
                    rule_name="Ground Field Observation Verification",
                    rule_version="1.0",
                    status="PASS",
                    value=f"{len(supporting_ground_obs)} supporting observations",
                    threshold="Count >= 1",
                    rationale="Ground truth field observations corroborate SAR anomaly finding.",
                    source="FIELD_OBSERVATIONS",
                )
            )
        else:
            checks.append(
                CheckResultItem(
                    check_type="GROUND_TRUTH_CONSISTENCY_CHECK",
                    rule_name="Ground Field Observation Verification",
                    rule_version="1.0",
                    status="NOT_EVALUATED",
                    value="0 observations",
                    threshold="Count >= 1",
                    rationale="No ground-truth field observations collected for target area.",
                    source="FIELD_OBSERVATIONS",
                )
            )

        # ---------------------------------------------------------
        # OVERALL AUDIT SYNTHESIS LOGIC (STEP 3)
        # ---------------------------------------------------------
        statuses = [c.status for c in checks]
        has_fail = "FAIL" in statuses
        has_warning = "WARNING" in statuses
        pass_count = sum(1 for s in statuses if s == "PASS")

        if has_fail:
            overall_state = "REJECTED"
            confidence = 0.10
            explanation = (
                "Self-audit result: REJECTED. One or more critical scientific validation checks failed. "
                "The detection is contradicted by ground truth or lacks valid SAR payload data."
            )
        elif pass_count >= 4 and not has_warning and supporting_evidence_count >= 1:
            overall_state = "SUPPORTED"
            confidence = 0.92
            explanation = (
                "Self-audit result: SUPPORTED. All required SAR payload quality, spatial, temporal, "
                "and independent sensor checks passed cleanly."
            )
        elif pass_count >= 3 and supporting_evidence_count >= 1:
            overall_state = "SUPPORTED"
            confidence = 0.78
            explanation = (
                "Self-audit result: SUPPORTED. Primary scientific checks passed with minor non-critical warnings."
            )
        else:
            overall_state = "INCONCLUSIVE"
            confidence = 0.40
            explanation = (
                "Self-audit result: INCONCLUSIVE. Independent evidence or sensor coverage is missing or "
                "insufficient to confirm or reject the SAR anomaly finding."
            )

        return SelfAuditResult(
            case_id=case_id,
            overall_audit_state=overall_state,
            confidence_score=confidence,
            summary_explanation=explanation,
            checks=checks,
            evaluated_at=datetime.now(timezone.utc),
        )
