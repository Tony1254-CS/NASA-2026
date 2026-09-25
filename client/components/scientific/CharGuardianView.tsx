'use client';

import React, { useState, useEffect } from 'react';
import {
  Anchor,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MapPin,
  Calendar,
  Activity,
  BellRing,
  FileText,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  fetchCases,
  fetchCharHistory,
  type CaseListItem,
  type CharHistoryResponse,
} from '@/lib/api';
import { EvidenceConfidenceWall } from '@/components/scientific/EvidenceConfidenceWall';
import { ChangeLensesView } from '@/components/scientific/ChangeLensesView';
import { EnhancedEventTimeline } from '@/components/scientific/EnhancedEventTimeline';

interface CharGuardianViewProps {
  initialCaseId?: string | null;
  onNavigateToVerify?: () => void;
}

export function CharGuardianView({ initialCaseId, onNavigateToVerify }: CharGuardianViewProps) {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(initialCaseId || null);
  const [charHistory, setCharHistory] = useState<CharHistoryResponse | null>(null);

  const [loadingCases, setLoadingCases] = useState<boolean>(true);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCaseList = async () => {
    setLoadingCases(true);
    setError(null);
    try {
      const res = await fetchCases(1, 50);
      setCases(res.items);
      if (res.items.length > 0) {
        const exists = selectedCaseId && res.items.some((c) => c.case_id === selectedCaseId);
        if (!selectedCaseId || !exists) {
          const charCase = res.items.find((c) =>
            ['CHAR', 'RIVER', 'FLOOD', 'WATER', 'LAND'].some((k) => c.event_type.toUpperCase().includes(k))
          ) || res.items[0];
          setSelectedCaseId(charCase.case_id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch TRACE cases.');
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    loadCaseList();
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;

    let isMounted = true;
    setLoadingHistory(true);
    setError(null);

    fetchCharHistory(selectedCaseId)
      .then((res) => {
        if (isMounted) {
          setCharHistory(res);
          setLoadingHistory(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.warn(`Char history fetch notice for ${selectedCaseId}:`, err);
          setLoadingHistory(false);
          // Fallback to first available case if selected target ID is invalid / 404
          if (cases.length > 0 && selectedCaseId !== cases[0].case_id) {
            setSelectedCaseId(cases[0].case_id);
          } else {
            setError(`Char Guardian history unavailable for selected case ID '${selectedCaseId}'.`);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCaseId, cases]);

  const getChangeStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OBSERVED CHANGE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="w-3.5 h-3.5" />
            Observed SAR Change
          </span>
        );
      case 'POTENTIAL CHANGE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Potential Surface Change
          </span>
        );
      case 'INCONCLUSIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <HelpCircle className="w-3.5 h-3.5" />
            Inconclusive Evidence
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5" />
            {status || 'UNAVAILABLE'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 pb-28 sm:pb-24">
      {/* HEADER CARD */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5 text-emerald-400 shrink-0" />
            <h2 className="text-lg font-bold text-white tracking-tight">Char Guardian — River-Island Change Engine</h2>
          </div>
          <p className="text-xs text-slate-400 pt-0.5">
            Real Earth-observation SAR change monitoring for river island & coastal land dynamics in Bangladesh.
          </p>
        </div>

        {cases.length > 0 && (
          <select
            value={selectedCaseId || ''}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="w-full sm:w-auto bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} — {c.event_type.toUpperCase()}
              </option>
            ))}
          </select>
        )}
      </div>

      {loadingHistory && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8 min-h-[160px] flex flex-col items-center justify-center gap-3 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
            <span>Loading Char Guardian Earth-Observation Data...</span>
          </CardContent>
        </Card>
      )}

      {!loadingHistory && charHistory && (
        <>
          {/* SECTION 1: CHAR OVERVIEW & SAR CHANGE METRICS */}
          <Card className="bg-slate-900/80 border-emerald-500/30 shadow-lg relative overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {charHistory.char_name_or_id}
                </span>
                {getChangeStatusBadge(charHistory.change_status)}
              </div>

              <CardTitle className="text-base font-bold text-white capitalize mt-2 flex items-center gap-2">
                {charHistory.event_type} — Char Island AOI
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Observation Period: {new Date(charHistory.observation_start).toLocaleDateString()} to{' '}
                {new Date(charHistory.observation_end).toLocaleDateString()}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 pt-2 space-y-4 text-xs">
              {/* BOUNDARY & COORDINATE DISPLAY */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="break-all">
                    Centroid:{' '}
                    {charHistory.latitude != null && charHistory.longitude != null
                      ? `${charHistory.latitude.toFixed(4)}°, ${charHistory.longitude.toFixed(4)}°`
                      : 'Coordinates unavailable'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {charHistory.geometry ? 'Polygon Geometry Active' : 'Char boundary unavailable.'}
                </span>
              </div>

              {/* PRIMARY SAR MEASUREMENTS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Backscatter Change</span>
                  <p className="text-sm font-bold font-mono text-emerald-400">
                    {charHistory.latest_delta_backscatter != null
                      ? `${charHistory.latest_delta_backscatter.toFixed(2)} dB`
                      : 'Unavailable'}
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Affected Area</span>
                  <p className="text-sm font-bold font-mono text-white">
                    {charHistory.latest_affected_area != null
                      ? `${charHistory.latest_affected_area.toFixed(1)} km²`
                      : 'Unavailable'}
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Evidence State</span>
                  <p className="text-xs font-bold text-slate-300 truncate">{charHistory.evidence_status}</p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Self-Audit Verdict</span>
                  <p className="text-xs font-bold text-slate-300 truncate">{charHistory.audit_verdict}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: GROUND TRUTH REPORTS AGGREGATION */}
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="p-4 sm:p-5 pb-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  Ground Truth Verification Aggregation
                </CardTitle>
                {onNavigateToVerify && (
                  <Button
                    onClick={onNavigateToVerify}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                  >
                    Submit Ground Observation
                  </Button>
                )}
              </div>
              <CardDescription className="text-xs text-slate-400">
                Aggregated field verification reports submitted by ground observers.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-medium">Total Reports</span>
                  <p className="text-base font-bold text-white mt-0.5">{charHistory.ground_truth.total_reports}</p>
                </div>

                <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-800/40">
                  <span className="text-[10px] text-emerald-400 uppercase font-medium">Confirmed</span>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">{charHistory.ground_truth.confirmed_reports}</p>
                </div>

                <div className="bg-rose-950/30 p-3 rounded-lg border border-rose-800/40">
                  <span className="text-[10px] text-rose-400 uppercase font-medium">Denied</span>
                  <p className="text-base font-bold text-rose-400 mt-0.5">{charHistory.ground_truth.denied_reports}</p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-medium">Pending</span>
                  <p className="text-base font-bold text-slate-400 mt-0.5">{charHistory.ground_truth.pending_reports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: THRESHOLD ALERT FOUNDATION */}
          {charHistory.alerts && charHistory.alerts.length > 0 && (
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardTitle className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
                  Configured Anomaly Threshold Alert Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2 space-y-2.5 text-xs">
                {charHistory.alerts.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-200">
                        {a.metric_name} ({a.comparison} {a.threshold_value})
                      </span>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        {a.triggered_state === 'TRIGGERED'
                          ? 'Observed change exceeded the configured threshold.'
                          : 'Alert configured and active.'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded shrink-0 self-start sm:self-center ${
                        a.triggered_state === 'TRIGGERED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {a.triggered_state}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* SECTION 4: HISTORICAL TIMELINE */}
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="p-4 sm:p-5 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                Chronological Observation History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-2 text-xs">
              {charHistory.historical_observations.length > 0 ? (
                <div className="space-y-3 border-l-2 border-indigo-500/30 ml-2 pl-4">
                  {charHistory.historical_observations.map((evt) => (
                    <div key={evt.id} className="relative space-y-0.5">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-400 ring-4 ring-slate-900" />
                      <p className="font-semibold text-white leading-snug">{evt.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(evt.timestamp).toLocaleString()} ({evt.phase.toUpperCase()})
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">Historical observation data unavailable.</p>
              )}
            </CardContent>
          </Card>

          {/* SECTION 5: PROVENANCE LINEAGE */}
          {charHistory.provenance_records && charHistory.provenance_records.length > 0 && (
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardTitle className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  Lineage & Provenance Metadata ({charHistory.provenance_records.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2 space-y-2 text-xs">
                {charHistory.provenance_records.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1 font-mono text-[11px] break-words">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-semibold text-indigo-300">
                      <span className="break-all">{p.product_id || p.collection_id || 'NASA Data'}</span>
                      <span className="text-slate-400 text-[10px]">{p.processing_method}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Calculation: {p.calculation_method || 'SPATIAL_TEMPORAL_CROSS_CORRELATION'} — Ref: {p.source_reference || 'NASA CMR'}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* REUSE PHASE 4 CONFIDENCE WALL & CHANGE LENSES */}
          <div className="pt-2 space-y-6">
            <EvidenceConfidenceWall caseId={charHistory.case_id} />
          </div>
        </>
      )}
    </div>
  );
}
