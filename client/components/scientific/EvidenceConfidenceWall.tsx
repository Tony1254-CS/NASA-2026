'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Database,
  Layers,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  evaluateCaseEvidence,
  evaluateSelfAudit,
  simulateScenario,
  runSentinelAgents,
  type EvidenceFusionResponse,
  type SelfAuditResponse,
  type ScenarioSimulationResponse,
  type SentinelWorkflowResponse,
} from '@/lib/api';
import { Bot, Play, Compass } from 'lucide-react';

interface EvidenceConfidenceWallProps {
  caseId: string;
  initialEvidence?: EvidenceFusionResponse | null;
  initialAudit?: SelfAuditResponse | null;
}

export function EvidenceConfidenceWall({ caseId, initialEvidence, initialAudit }: EvidenceConfidenceWallProps) {
  const [evidenceData, setEvidenceData] = useState<EvidenceFusionResponse | null>(initialEvidence || null);
  const [auditData, setAuditData] = useState<SelfAuditResponse | null>(initialAudit || null);
  const [scenarioData, setScenarioData] = useState<ScenarioSimulationResponse | null>(null);
  const [sentinelData, setSentinelData] = useState<SentinelWorkflowResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingScenario, setLoadingScenario] = useState<boolean>(false);
  const [loadingAgents, setLoadingAgents] = useState<boolean>(false);
  const [waterOffset, setWaterOffset] = useState<number>(1.0);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'MEASURED' | 'DERIVED' | 'INTERPRETATION' | 'SIMULATION'>('ALL');

  const handleRunEvaluation = async () => {
    setLoading(true);
    try {
      const [evRes, auditRes] = await Promise.all([
        evaluateCaseEvidence(caseId),
        evaluateSelfAudit(caseId),
      ]);
      setEvidenceData(evRes);
      setAuditData(auditRes);
    } catch (err) {
      console.error('Evidence wall evaluation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScenario = async (offset: number) => {
    setWaterOffset(offset);
    setLoadingScenario(true);
    try {
      const res = await simulateScenario(caseId, offset);
      setScenarioData(res);
    } catch (err) {
      console.error('Scenario simulation failed:', err);
    } finally {
      setLoadingScenario(false);
    }
  };

  const handleRunAgents = async () => {
    setLoadingAgents(true);
    try {
      const res = await runSentinelAgents(caseId);
      setSentinelData(res);
    } catch (err) {
      console.error('Sentinel agents execution failed:', err);
    } finally {
      setLoadingAgents(false);
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUPPORTED':
      case 'CONFIRMED_MULTIMISSION':
      case 'PASS':
      case 'SUPPORTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 self-start sm:self-center" role="status">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{status}</span>
          </span>
        );
      case 'PARTIALLY_SUPPORTED':
      case 'WARNING':
      case 'NEUTRAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 self-start sm:self-center" role="status">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{status}</span>
          </span>
        );
      case 'REJECTED':
      case 'CONTRADICTED':
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 self-start sm:self-center" role="status">
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{status}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 shrink-0 self-start sm:self-center" role="status">
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{status || 'UNAVAILABLE'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" role="region" aria-label="Evidence and Confidence Wall">
      {/* Header & Controls */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 border-sky-500/20 relative overflow-hidden">
        <div className="tech-corner-tl" />
        <div className="tech-corner-tr" />

        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2 font-mono">
            <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 animate-pulse" aria-hidden="true" />
            EVIDENCE & SELF-AUDIT MATRIX
          </h2>
          <p className="text-xs text-slate-400 pt-0.5 leading-relaxed">
            Cross-mission satellite observations, deterministic self-audit checks, scenario simulator, and autonomous sentinel agents.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            onClick={handleRunEvaluation}
            disabled={loading}
            size="sm"
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs shadow-lg shadow-sky-500/20 transition-all"
          >
            {loading ? (
              <Activity className="w-3.5 h-3.5 animate-spin mr-1.5" aria-hidden="true" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            )}
            {loading ? 'Evaluating...' : 'Run Audit Engine'}
          </Button>

          <Button
            onClick={handleRunAgents}
            disabled={loadingAgents}
            size="sm"
            variant="outline"
            className="border-sky-500/30 text-sky-300 hover:bg-sky-500/15 font-mono font-bold text-xs transition-all"
          >
            {loadingAgents ? (
              <Activity className="w-3.5 h-3.5 animate-spin mr-1.5 text-sky-400" aria-hidden="true" />
            ) : (
              <Bot className="w-3.5 h-3.5 mr-1.5 text-sky-400" aria-hidden="true" />
            )}
            {loadingAgents ? 'Running Agents...' : 'Run Sentinel Agents'}
          </Button>

          <div className="flex flex-wrap items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-sky-500/20 shadow-inner">
            <span className="text-[10px] font-mono text-slate-400 px-1">Scenario:</span>
            {[0.5, 1.0, 2.0].map((offset) => (
              <Button
                key={offset}
                onClick={() => handleRunScenario(offset)}
                disabled={loadingScenario}
                size="sm"
                variant="outline"
                className={`h-6 text-[10px] px-2 font-mono ${
                  waterOffset === offset && scenarioData ? 'bg-sky-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(56,189,248,0.4)]' : 'text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                +{offset}m
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Summary Banner */}
      {auditData && (
        <Card className="glass-panel border-sky-500/30 shadow-xl relative overflow-hidden">
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-sm font-mono font-bold text-slate-200 uppercase tracking-widest">
                Overall Self-Audit State
              </CardTitle>
              {getStatusBadge(auditData.overall_audit_state)}
            </div>
            <CardDescription className="text-xs text-slate-400 pt-1">
              {auditData.summary_explanation}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-sky-500/20 text-xs shadow-inner">
              <span className="text-slate-400 font-mono font-semibold">Deterministic Confidence Score</span>
              <span className="font-mono font-extrabold text-sky-300 text-sm">
                {(auditData.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classification Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Evidence Data Classifications">
        {[
          { id: 'ALL', label: 'All Evidence' },
          { id: 'MEASURED', label: '1. Measured Data' },
          { id: 'DERIVED', label: '2. Derived Evidence' },
          { id: 'INTERPRETATION', label: '3. Interpretation' },
          { id: 'SIMULATION', label: '4. Simulation Reference' },
        ].map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.3)] font-bold'
                : 'bg-slate-950/70 text-slate-400 border border-sky-500/20 hover:bg-slate-900/60 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Classified Data Layers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CATEGORY 1: MEASURED DATA */}
        {(activeCategory === 'ALL' || activeCategory === 'MEASURED') && (
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="p-4 sm:p-5 pb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <CardTitle className="text-sm font-bold text-white">MEASURED DATA & GROUND TRUTH</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Separated satellite payload evidence & human ground sentinel observations.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-2 space-y-3.5 text-xs">
              {/* SUBSECTION 1: REMOTE SENSING EVIDENCE */}
              <div className="space-y-2.5 border-l-2 border-emerald-500/40 pl-3">
                <div className="text-[11px] font-mono font-bold text-emerald-400 tracking-wider flex items-center gap-1.5 uppercase flex-wrap">
                  <span>REMOTE SENSING EVIDENCE</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded">SATELLITE EVIDENCE</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5 flex-wrap">
                      <span>NISAR L-band SAR Radar</span>
                      <span className="text-[9px] bg-sky-500/10 text-sky-400 px-1 rounded">NASA EVIDENCE</span>
                    </div>
                    <div className="text-slate-400 text-[11px] pt-0.5">Primary Earth observation backscatter payload</div>
                  </div>
                  {getStatusBadge(evidenceData?.sar_anomaly_status === 'DETECTED' ? 'PASS' : 'WARNING')}
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5 flex-wrap">
                      <span>NASA FIRMS Active Fires</span>
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 rounded">NASA EVIDENCE</span>
                    </div>
                    <div className="text-slate-400 text-[11px] pt-0.5">MODIS / VIIRS thermal radiance detections</div>
                  </div>
                  {getStatusBadge(evidenceData?.sensor_evaluations?.FIRMS?.status || 'UNAVAILABLE')}
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5 flex-wrap">
                      <span>NASA GPM IMERG Rain</span>
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1 rounded">NASA EVIDENCE</span>
                    </div>
                    <div className="text-slate-400 text-[11px] pt-0.5">Passive microwave precipitation observations</div>
                  </div>
                  {getStatusBadge(evidenceData?.sensor_evaluations?.GPM?.status || 'UNAVAILABLE')}
                </div>
              </div>

              {/* SUBSECTION 2: COMMUNITY OBSERVATION */}
              <div className="space-y-2.5 border-l-2 border-amber-500/40 pl-3 pt-1">
                <div className="text-[11px] font-mono font-bold text-amber-400 tracking-wider flex items-center gap-1.5 uppercase flex-wrap">
                  <span>COMMUNITY OBSERVATION</span>
                  <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded">GROUND OBSERVATION</span>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded">USER REPORT</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-semibold text-slate-200">Community Sentinel Network Ground Truth</span>
                    {getStatusBadge(auditData?.checks?.find((c) => c.check_type === 'GROUND_TRUTH_CONSISTENCY_CHECK')?.status || 'NOT_EVALUATED')}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Ground reports provide direct local field context. They are cross-checked by the scientific audit engine and never automatically override remote sensing calculations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CATEGORY 2: DERIVED EVIDENCE */}
        {(activeCategory === 'ALL' || activeCategory === 'DERIVED') && (
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="p-4 sm:p-5 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
                <CardTitle className="text-sm font-bold text-white">DERIVED EVIDENCE</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Spatiotemporal correlation metrics & normalized sensor items.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-2 space-y-2.5 text-xs">
              {auditData?.checks?.map((check, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-200">{check.rule_name}</span>
                    <p className="text-[11px] text-slate-400 leading-normal pt-0.5">{check.rationale}</p>
                  </div>
                  {getStatusBadge(check.status)}
                </div>
              )) || (
                <div className="p-6 text-center text-slate-500 italic">
                  Run evaluation to generate spatiotemporal correlation checks.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* CATEGORY 3: INTERPRETATION */}
        {(activeCategory === 'ALL' || activeCategory === 'INTERPRETATION') && (
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                <CardTitle className="text-sm font-bold text-white">INTERPRETATION</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Evidence-backed non-causal scientific narrative.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 space-y-2">
                <div className="font-semibold text-indigo-200">Scientific Narrative</div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {evidenceData?.hypothesis_narrative || 'Evidence fusion pending evaluation.'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-300">Non-Causal Statement</div>
                <p className="text-slate-400 leading-normal text-[11px]">
                  {evidenceData?.non_causal_statement || 'Correlation phrasing enforced upon evaluation.'}
                </p>
              </div>

              {/* Sentinel Agents Execution Log Output */}
              {sentinelData && (
                <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" />
                      Sentinel Agents Log
                    </span>
                    {getStatusBadge(sentinelData.final_verdict)}
                  </div>
                  <div className="space-y-1 text-[11px]">
                    {sentinelData.execution_log.map((step, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-300 border-b border-purple-900/30 pb-1">
                        <span className="font-mono font-medium">{step.agent_name}</span>
                        <span className="text-[10px] text-slate-400">{step.summary}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* CATEGORY 4: SIMULATION */}
        {(activeCategory === 'ALL' || activeCategory === 'SIMULATION') && (
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-400" aria-hidden="true" />
                <CardTitle className="text-sm font-bold text-white">SIMULATION REFERENCE</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Synthetic reference baselines & historical sensor models.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-2 text-xs">
              {/* Scenario Simulator Output */}
              {scenarioData && (
                <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-800/40 space-y-1.5">
                  <div className="flex justify-between items-center font-semibold text-sky-300">
                    <span>Water Level Offset: +{scenarioData.water_level_offset_m}m</span>
                    <span className="text-[10px] text-amber-400 font-bold uppercase">{scenarioData.disclaimer}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>Area: <span className="font-mono font-bold text-white">{scenarioData.affected_area_sq_km ? `${scenarioData.affected_area_sq_km.toFixed(1)} km²` : 'N/A'}</span></div>
                    <div>Population: <span className="text-slate-400">{scenarioData.affected_population_text}</span></div>
                    <div>Schools: <span className="text-slate-400">{scenarioData.affected_schools_text}</span></div>
                    <div>Facilities: <span className="text-slate-400">{scenarioData.affected_health_facilities_text}</span></div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="flex justify-between items-center font-semibold text-slate-300">
                  <span>Pre-Event Baseline Context</span>
                  <span className="text-[10px] text-purple-400 font-mono">CMR Historical</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Reference surface reflectance & backscatter baseline constructed from 30-day prior acquisitions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
