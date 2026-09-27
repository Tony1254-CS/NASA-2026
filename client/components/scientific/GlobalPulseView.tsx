'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radar,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { fetchGlobalEvents, fetchCaseDetail, type GlobalEventItem, type CaseDetailResponse } from '@/lib/api';

const PlanetaryRealMap = dynamic(
  () => import('@/components/scientific/PlanetaryRealMap').then((mod) => mod.PlanetaryRealMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] sm:h-[380px] md:h-[420px] bg-[#050914] flex flex-col items-center justify-center p-6 text-center space-y-2 font-mono">
        <Radar className="w-6 h-6 text-sky-400 animate-spin" />
        <span className="text-xs text-slate-300">INITIALIZING PLANETARY GEOGRAPHIC BASEMAP...</span>
      </div>
    ),
  }
);

interface GlobalPulseViewProps {
  onSelectCase?: (caseId: string) => void;
}

export function GlobalPulseView({ onSelectCase }: GlobalPulseViewProps) {
  const [events, setEvents] = useState<GlobalEventItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<CaseDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterEventType, setFilterEventType] = useState<string>('ALL');
  const [filterAuditVerdict, setFilterAuditVerdict] = useState<string>('ALL');

  const loadGlobalEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const typeParam = filterEventType === 'ALL' ? undefined : filterEventType;
      const auditParam = filterAuditVerdict === 'ALL' ? undefined : filterAuditVerdict;
      const res = await fetchGlobalEvents(typeParam, auditParam);
      setEvents(res.items);
      if (res.items.length > 0 && !selectedCaseId) {
        setSelectedCaseId(res.items[0].case_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch global pulse events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlobalEvents();
  }, [filterEventType, filterAuditVerdict]);

  useEffect(() => {
    if (!selectedCaseId) {
      setSelectedCaseDetail(null);
      return;
    }

    let isMounted = true;
    fetchCaseDetail(selectedCaseId)
      .then((res) => {
        if (isMounted) setSelectedCaseDetail(res);
      })
      .catch(() => {
        if (isMounted) setSelectedCaseDetail(null);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCaseId]);

  const selectedEvent = events.find((e) => e.case_id === selectedCaseId) || events[0] || null;

  const getVerdictBadge = (verdict: string) => {
    switch (verdict?.toUpperCase()) {
      case 'SUPPORTED':
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            SUPPORTED
          </span>
        );
      case 'REJECTED':
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            REJECTED
          </span>
        );
      case 'INCONCLUSIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            INCONCLUSIVE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20">
            <HelpCircle className="w-3 h-3" />
            UNAVAILABLE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 pb-28 sm:pb-24">
      {/* HEADER CARD */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="tech-corner-tl" />
        <div className="tech-corner-tr" />

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-400/30 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight font-mono flex items-center gap-2">
              GLOBAL PULSE <span className="text-xs font-normal text-sky-400/80 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">PLANETARY MATRIX</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Real-time planetary satellite case markers linked directly to multi-mission evidence pipelines.
          </p>
        </div>

        <Button
          onClick={loadGlobalEvents}
          variant="outline"
          size="sm"
          disabled={loading}
          className="h-8 text-xs font-mono border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Pulse
        </Button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-xl border border-sky-500/20 text-xs shadow-inner">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono font-medium">Event Type:</span>
            <select
              value={filterEventType}
              onChange={(e) => setFilterEventType(e.target.value)}
              className="bg-slate-900 border border-sky-500/30 rounded-lg px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              <option value="ALL">All Event Types</option>
              <option value="WILDFIRE">Wildfire</option>
              <option value="FLOOD">Flood</option>
              <option value="EARTHQUAKE">Earthquake</option>
              <option value="DEFORESTATION">Deforestation</option>
              <option value="CHAR">Char River Change</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono font-medium">Audit Verdict:</span>
            <select
              value={filterAuditVerdict}
              onChange={(e) => setFilterAuditVerdict(e.target.value)}
              className="bg-slate-900 border border-sky-500/30 rounded-lg px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              <option value="ALL">All Verdicts</option>
              <option value="SUPPORTED">SUPPORTED</option>
              <option value="INCONCLUSIVE">INCONCLUSIVE</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        <span className="text-[11px] font-mono text-sky-400 shrink-0 bg-sky-500/10 px-2.5 py-1 rounded border border-sky-500/20">
          {events.length} ACTIVE EVENT{events.length === 1 ? '' : 'S'}
        </span>
      </div>

      {/* PLANETARY REAL INTERACTIVE GEOGRAPHIC MAP */}
      <Card className="bg-slate-950/80 border-sky-500/25 overflow-hidden shadow-2xl relative">
        <CardHeader className="p-4 sm:p-5 pb-2 border-b border-sky-500/20 flex flex-row items-center justify-between bg-slate-900/40">
          <CardTitle className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <Radar className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
            Planetary Interactive Projection
          </CardTitle>
          <span className="text-[10px] font-mono text-sky-300 bg-sky-500/15 px-2.5 py-0.5 rounded-full border border-sky-400/30 shrink-0">
            WGS84 Equirectangular Grid
          </span>
        </CardHeader>
        <CardContent className="p-0 relative">
          <PlanetaryRealMap
            events={events}
            selectedCaseId={selectedCaseId}
            onSelectCase={(caseId) => setSelectedCaseId(caseId)}
            caseGeometry={selectedCaseDetail?.geometry}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* SELECTED CASE METADATA DRAWER / PANEL */}
      {selectedEvent && (
        <Card className="glass-panel border-sky-500/30 shadow-xl relative overflow-hidden">
          <div className="tech-corner-bl" />
          <div className="tech-corner-br" />

          <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-sky-300 uppercase tracking-widest bg-sky-500/15 px-2.5 py-0.5 rounded border border-sky-400/30">
                CASE // {selectedEvent.case_id}
              </span>
              <CardTitle className="text-base font-extrabold text-white capitalize mt-1.5 tracking-tight font-mono">
                {selectedEvent.event_type} Investigation
              </CardTitle>
            </div>
            {getVerdictBadge(selectedEvent.audit_verdict)}
          </CardHeader>

          <CardContent className="p-4 sm:p-5 pt-2 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-sky-500/20">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Coordinates</span>
                <p className="font-mono text-sky-300 font-semibold truncate mt-1">
                  {selectedEvent.latitude != null && selectedEvent.longitude != null
                    ? `${selectedEvent.latitude.toFixed(4)}°, ${selectedEvent.longitude.toFixed(4)}°`
                    : 'Unavailable'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Detection Window</span>
                <p className="font-mono text-slate-200 font-semibold truncate mt-1">
                  {new Date(selectedEvent.observation_start).toLocaleDateString()}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Ground Truth</span>
                <p className="font-mono text-slate-200 font-semibold mt-1">{selectedEvent.ground_truth_count} Reports</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Provenance</span>
                <p className="font-mono text-slate-200 font-semibold mt-1">{selectedEvent.provenance_count} Records</p>
              </div>
            </div>

            {onSelectCase && (
              <Button
                onClick={() => onSelectCase(selectedEvent.case_id)}
                className="w-full h-10 bg-sky-500 text-slate-950 hover:bg-sky-400 text-xs font-mono font-bold uppercase tracking-wider gap-2 shadow-lg shadow-sky-500/20"
              >
                Open Mission Control Case ({selectedEvent.case_id})
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
