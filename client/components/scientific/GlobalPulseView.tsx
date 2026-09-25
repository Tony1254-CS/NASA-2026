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
import { fetchGlobalEvents, type GlobalEventItem } from '@/lib/api';

interface GlobalPulseViewProps {
  onSelectCase?: (caseId: string) => void;
}

export function GlobalPulseView({ onSelectCase }: GlobalPulseViewProps) {
  const [events, setEvents] = useState<GlobalEventItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
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

  // Convert (lat, lon) to SVG percent coordinates
  const getMarkerCoords = (lat?: number | null, lon?: number | null) => {
    if (lat == null || lon == null) return null;
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 pb-28 sm:pb-24">
      {/* HEADER CARD */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
            <h2 className="text-lg font-bold text-white tracking-tight">Global Pulse — Planetary Observation Matrix</h2>
          </div>
          <p className="text-xs text-slate-400 pt-0.5">
            Real-time planetary satellite case markers linked directly to multi-mission evidence pipelines.
          </p>
        </div>

        <Button
          onClick={loadGlobalEvents}
          variant="outline"
          size="sm"
          disabled={loading}
          className="h-8 text-xs border-slate-700 text-slate-300 hover:bg-slate-800 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Pulse
        </Button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Event Type:</span>
            <select
              value={filterEventType}
              onChange={(e) => setFilterEventType(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            <span className="text-slate-400 font-medium">Audit Verdict:</span>
            <select
              value={filterAuditVerdict}
              onChange={(e) => setFilterAuditVerdict(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Verdicts</option>
              <option value="SUPPORTED">SUPPORTED</option>
              <option value="INCONCLUSIVE">INCONCLUSIVE</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400 shrink-0">
          {events.length} active event{events.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* PLANETARY SVG MAP */}
      <Card className="bg-slate-950 border-slate-800 overflow-hidden shadow-lg relative">
        <CardHeader className="p-4 sm:p-5 pb-2 border-b border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Radar className="w-4 h-4 text-indigo-400 shrink-0" />
            Planetary Interactive Projection
          </CardTitle>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0">
            WGS84 Equirectangular Grid
          </span>
        </CardHeader>
        <CardContent className="p-0 relative min-h-[280px] bg-slate-950 flex items-center justify-center">
          {/* World Grid SVG Background */}
          <svg className="w-full h-full min-h-[280px] opacity-30 pointer-events-none" viewBox="0 0 800 400" fill="none">
            <line x1="0" y1="200" x2="800" y2="200" stroke="#64748b" strokeDasharray="4 4" strokeWidth="1" />
            <line x1="400" y1="0" x2="400" y2="400" stroke="#64748b" strokeDasharray="4 4" strokeWidth="1" />
            <rect x="100" y="50" width="600" height="300" stroke="#334155" strokeWidth="0.5" fill="none" />
            <path d="M150,120 Q200,90 280,110 T320,180 L250,220 Z" fill="#1e293b" opacity="0.6" />
            <path d="M420,100 Q500,80 620,120 T680,200 L550,260 Z" fill="#1e293b" opacity="0.6" />
            <path d="M450,220 Q500,240 520,300 T480,340 Z" fill="#1e293b" opacity="0.6" />
          </svg>

          {/* REAL CASE MARKERS */}
          {!loading && events.length > 0 && (
            <div className="absolute inset-0 p-4">
              {events.map((evt) => {
                const coords = getMarkerCoords(evt.latitude, evt.longitude);
                if (!coords) return null;
                const isSelected = evt.case_id === selectedCaseId;

                return (
                  <button
                    key={evt.case_id}
                    onClick={() => setSelectedCaseId(evt.case_id)}
                    style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 z-10 ${
                      isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                    }`}
                    title={`${evt.case_id} (${evt.event_type})`}
                  >
                    <div className="relative group">
                      <span
                        className={`block w-4 h-4 rounded-full border-2 shadow-md ${
                          evt.audit_verdict === 'SUPPORTED'
                            ? 'bg-emerald-500 border-emerald-300'
                            : evt.audit_verdict === 'REJECTED'
                            ? 'bg-rose-500 border-rose-300'
                            : 'bg-amber-500 border-amber-300'
                        } ${isSelected ? 'ring-4 ring-indigo-500/50 animate-pulse' : ''}`}
                      />
                      <span className="absolute left-1/2 -translate-x-1/2 top-5 whitespace-nowrap text-[9px] font-mono font-bold bg-slate-900/90 text-slate-200 px-1.5 py-0.5 rounded border border-slate-800 shadow pointer-events-none">
                        {evt.case_id}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && events.length === 0 && (
            <div className="absolute inset-0 min-h-[280px] flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 max-w-sm mx-auto">
              <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-300">
                {filterAuditVerdict === 'SUPPORTED' ? 'No supported TRACE events available.' : 'No TRACE events available.'}
              </h3>
              <p className="text-xs text-slate-500 leading-normal">
                No active satellite investigation cases match the selected pulse filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SELECTED CASE METADATA DRAWER / PANEL */}
      {selectedEvent && (
        <Card className="bg-slate-900/80 border-slate-800 shadow-md">
          <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {selectedEvent.case_id}
              </span>
              <CardTitle className="text-base font-bold text-white capitalize mt-1">
                {selectedEvent.event_type} Investigation
              </CardTitle>
            </div>
            {getVerdictBadge(selectedEvent.audit_verdict)}
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Location</span>
                <p className="font-mono text-slate-300 font-medium truncate mt-0.5">
                  {selectedEvent.latitude != null && selectedEvent.longitude != null
                    ? `${selectedEvent.latitude.toFixed(4)}°, ${selectedEvent.longitude.toFixed(4)}°`
                    : 'Location unavailable'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Detection Window</span>
                <p className="text-slate-300 font-medium truncate mt-0.5">
                  {new Date(selectedEvent.observation_start).toLocaleDateString()}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Ground Truth</span>
                <p className="text-slate-300 font-medium mt-0.5">{selectedEvent.ground_truth_count} Reports</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Provenance</span>
                <p className="text-slate-300 font-medium mt-0.5">{selectedEvent.provenance_count} Records</p>
              </div>
            </div>

            {onSelectCase && (
              <Button
                onClick={() => onSelectCase(selectedEvent.case_id)}
                className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider gap-2 shadow-sm"
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
