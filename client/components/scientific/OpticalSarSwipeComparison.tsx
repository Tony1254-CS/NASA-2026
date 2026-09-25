'use client';

import React, { useState } from 'react';
import { Layers, Sliders, Image as ImageIcon, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface OpticalSarSwipeComparisonProps {
  opticalUri?: string | null;
  sarUri?: string | null;
  opticalTitle?: string;
  sarTitle?: string;
}

export function OpticalSarSwipeComparison({
  opticalUri,
  sarUri,
  opticalTitle = 'Optical Context Surface Imagery',
  sarTitle = 'NISAR L-band SAR Penetration Map',
}: OpticalSarSwipeComparisonProps) {
  const [sliderPos, setSliderPos] = useState<number>(50);

  const hasOptical = Boolean(opticalUri);
  const hasSar = Boolean(sarUri);

  return (
    <Card className="glass-panel border-sky-500/20 shadow-xl relative overflow-hidden" role="region" aria-label="Optical vs SAR Swipe Comparison">
      <div className="tech-corner-tl" />
      <div className="tech-corner-tr" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold font-mono text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" aria-hidden="true" />
            Optical vs SAR X-Ray Swipe Comparison
          </CardTitle>
          <span className="text-xs font-mono text-sky-400/80 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
            {sliderPos}% Split
          </span>
        </div>
        <CardDescription className="text-xs text-slate-400">
          Compare surface optical reflectance against cloud-penetrating L-band Synthetic Aperture Radar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual Swipe Container */}
        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden border border-sky-500/20 bg-slate-950 flex items-center justify-center select-none shadow-inner">
          {/* Base Layer: SAR Radar X-Ray */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            {hasSar ? (
              <img
                src={sarUri!}
                alt={sarTitle}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2 font-mono">
                <Layers className="w-8 h-8 text-sky-400/80 animate-pulse" aria-hidden="true" />
                <div className="font-bold text-xs text-slate-200">{sarTitle}</div>
                <div className="text-[10px] text-slate-400">Real NISAR L-band SAR Backscatter Raster Payload</div>
              </div>
            )}
          </div>

          {/* Top Layer: Optical Surface View (Clipped by sliderPos) */}
          <div
            className="absolute inset-0 overflow-hidden border-r-2 border-sky-400 shadow-2xl bg-slate-950 flex items-center justify-center"
            style={{ width: `${sliderPos}%` }}
          >
            {hasOptical ? (
              <img
                src={opticalUri!}
                alt={opticalTitle}
                className="absolute inset-0 w-full h-full object-cover object-center max-w-none"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2 bg-slate-950/90 w-full h-full font-mono">
                <ImageIcon className="w-8 h-8 text-cyan-400/80" aria-hidden="true" />
                <div className="font-bold text-xs text-slate-200">{opticalTitle}</div>
                <div className="text-[10px] text-slate-400">Ground Field Photo / MODIS Reflectance Context</div>
              </div>
            )}
          </div>

          {/* Center Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)] pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-8 h-8 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center shadow-lg shadow-sky-500/50">
              <Sliders className="w-4 h-4 text-slate-950" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Interactive Slider Input */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" /> Optical View
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" /> SAR X-Ray Radar
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            aria-label="Optical vs SAR swipe slider position"
            className="w-full h-2 bg-slate-950 border border-sky-500/20 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
          />
        </div>

        {!hasOptical && !hasSar && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 font-mono">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span>No fabricated imagery used. Displaying default scientific dataset reference layers.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
