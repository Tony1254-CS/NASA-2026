'use client';

import React from 'react';
import { Activity, Radio, Compass, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChangeLensesView } from '@/components/scientific/ChangeLensesView';
import { type CaseDetailResponse, type NisarMeasurementResponse } from '@/lib/api';

interface SignalsViewProps {
  caseDetail: CaseDetailResponse | null;
  primaryNisarMeasurement: NisarMeasurementResponse | null | undefined;
  onNavigateToFeel?: () => void;
}

export function SignalsView({
  caseDetail,
  primaryNisarMeasurement,
  onNavigateToFeel,
}: SignalsViewProps) {
  const delta = primaryNisarMeasurement?.delta_backscatter;

  // Calculate gauge percentage based on realistic SAR delta range (-10 dB to +10 dB)
  const calculateGaugePercent = (val: number | null | undefined): number => {
    if (val == null) return 50;
    // Map -8 dB..+8 dB to 0..100%
    const clamped = Math.max(-8, Math.min(8, val));
    return Math.round(((clamped + 8) / 16) * 100);
  };

  const gaugePercent = calculateGaugePercent(delta);
  // SVG circular arc calculation: radius = 54, circumference = 2 * PI * 54 = 339.29
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  // Use a 240-degree arc (approx 0.666 of circle)
  const arcLength = circumference * 0.68;
  const strokeOffset = arcLength - (arcLength * Math.min(100, Math.max(0, gaugePercent))) / 100;

  const getSignalStatusText = (val: number | null | undefined) => {
    if (val == null) return 'NO SIGNAL DETECTED';
    if (val < -3.0) return 'STRONG NEGATIVE ATTENUATION';
    if (val < -1.0) return 'MODERATE BACKSCATTER DROP';
    if (val > 3.0) return 'HIGH SURFACE REFLECTANCE';
    if (val > 1.0) return 'MODERATE BACKSCATTER GAIN';
    return 'NOMINAL BASELINE FLUX';
  };

  return (
    <div className="space-y-4">
      {/* 1. ANALYTICAL CHANGE LENSES */}
      <ChangeLensesView caseDetail={caseDetail} />

      {/* 2. PROMINENT SIGNAL STRENGTH GAUGE */}
      <Card className="glass-panel border-sky-500/25 shadow-xl relative overflow-hidden">
        <div className="tech-corner-tl" />
        <div className="tech-corner-tr" />

        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-sky-400" />
              SAR Signal Intensity Gauge
            </CardTitle>
            <span className="text-[10px] font-mono text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
              L-BAND 1.25 GHz
            </span>
          </div>
          <CardDescription className="text-[11px] text-slate-400">
            Real-time radar backscatter cross-section relative to temporal pre-event baseline.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-1 flex flex-col items-center">
          {/* Circular Cyber Meter */}
          <div className="relative w-44 h-44 flex items-center justify-center my-1">
            {/* Outer Decorative Track */}
            <svg className="w-full h-full transform -rotate-130" viewBox="0 0 130 130">
              {/* Background Arc */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="stroke-slate-900"
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
              />
              {/* Active Neon Glow Arc */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="stroke-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)] transition-all duration-700 ease-out"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Center Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                DELTA
              </span>
              <div className="font-mono font-black text-2xl text-white tracking-tight drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]">
                {delta != null ? (
                  <>
                    {delta > 0 ? '+' : ''}
                    {delta.toFixed(2)}
                    <span className="text-xs text-sky-400 font-bold ml-1">dB</span>
                  </>
                ) : (
                  <span className="text-base text-slate-400">N/A</span>
                )}
              </div>
              <span className="text-[9px] font-mono font-semibold text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-400/30 mt-1">
                {getSignalStatusText(delta)}
              </span>
            </div>
          </div>

          {/* Quick Haptic Link CTA */}
          {onNavigateToFeel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToFeel}
              className="mt-2 w-full h-9 text-xs font-mono font-bold gap-2 border-sky-500/40 text-sky-300 hover:bg-sky-500/20 hover:text-white shadow-sm"
            >
              <Volume2 className="h-3.5 w-3.5 text-sky-400" />
              FEEL Signal (Acoustic / Haptic Engine)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 3. DETAILED METRICS CARD */}
      <Card className="glass-panel border-sky-500/20 shadow-md">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-sky-400" />
            Detailed Radar Telemetry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Primary Signal */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-sky-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Primary Signal
              </span>
              <span className="text-sm font-bold text-sky-300">
                {delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)} dB` : 'Unavailable'}
              </span>
            </div>

            {/* Target Event Context */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-sky-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Target Event Context
              </span>
              <span className="text-sm font-bold text-white capitalize truncate block">
                {caseDetail?.event_type || 'Unknown'}
              </span>
            </div>

            {/* Metric Mode */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-sky-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Metric Calculation
              </span>
              <span className="text-xs font-bold text-slate-200 truncate block">
                {primaryNisarMeasurement?.change_metric || 'BACKSCATTER_ANOMALY'}
              </span>
            </div>

            {/* Affected Area */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-sky-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Affected Area
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {primaryNisarMeasurement?.affected_area != null
                  ? `${primaryNisarMeasurement.affected_area} km²`
                  : 'Pending InSAR Mask'}
              </span>
            </div>
          </div>

          {/* Granule Product Reference */}
          {primaryNisarMeasurement?.product_id && (
            <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">NISAR Product:</span>
              <span className="text-sky-300 truncate max-w-[200px]" title={primaryNisarMeasurement.product_id}>
                {primaryNisarMeasurement.product_id}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
