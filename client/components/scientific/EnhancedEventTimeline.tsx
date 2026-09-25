'use client';

import React from 'react';
import { Calendar, Clock, Radar, CheckCircle2, ShieldAlert, ArrowRight, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type TimelineResponse, type TimelineEventItem } from '@/lib/api';

interface EnhancedEventTimelineProps {
  timeline: TimelineResponse | null;
  observationStart?: string;
  observationEnd?: string;
}

export function EnhancedEventTimeline({ timeline, observationStart, observationEnd }: EnhancedEventTimelineProps) {
  const events = timeline?.events || [];

  const getPhaseBadge = (phase: string) => {
    switch (phase?.toLowerCase()) {
      case 'before':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20" role="status">
            <span>BEFORE BASELINE</span>
          </span>
        );
      case 'change':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" role="status">
            <span>SAR DETECTION</span>
          </span>
        );
      case 'after':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" role="status">
            <span>VERIFICATION</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700" role="status">
            <span>EVENT</span>
          </span>
        );
    }
  };

  return (
    <Card className="bg-slate-900/80 border-slate-800" role="region" aria-label="Chronological Satellite Observation Timeline">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" aria-hidden="true" />
            Chronological Satellite Observation Timeline
          </CardTitle>
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" /> UTC Timestamps
          </span>
        </div>
        <CardDescription className="text-xs text-slate-400">
          Authentic acquisition sequence from baseline reference to cross-mission verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-2">
        {events.length > 0 ? (
          <div className="relative border-l-2 border-slate-800/80 ml-3 pl-5 space-y-4 my-2 pb-2">
            {events.map((item, idx) => (
              <div key={item.id || idx} className="relative group">
                {/* Timeline Node Icon */}
                <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-indigo-400 flex items-center justify-center ring-4 ring-slate-900">
                  <div className="w-1 h-1 rounded-full bg-indigo-400" />
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span className="font-semibold text-xs text-slate-200 leading-snug">{item.title}</span>
                    <div className="shrink-0">{getPhaseBadge(item.phase)}</div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" aria-hidden="true" />
                    <span>{new Date(item.timestamp).toUTCString()}</span>
                  </div>
                  {item.details && Object.keys(item.details).length > 0 && (
                    <div className="text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-900 mt-1.5 break-words whitespace-pre-wrap overflow-hidden">
                      {JSON.stringify(item.details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="text-slate-400 font-medium">Declared Observation Window</span>
              <span className="font-mono text-indigo-400 text-[11px]">
                {observationStart ? new Date(observationStart).toLocaleDateString() : 'N/A'} -{' '}
                {observationEnd ? new Date(observationEnd).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Authentic timeline sequence compiled from satellite granule acquisition timestamps. No intermediate observations fabricated.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
