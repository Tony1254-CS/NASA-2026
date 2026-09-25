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
    <Card className="bg-slate-900/80 border-slate-800" role="region" aria-label="Optical vs SAR Swipe Comparison">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            Optical vs SAR X-Ray Swipe Comparison
          </CardTitle>
          <span className="text-xs font-mono text-slate-400">
            {sliderPos}% Split
          </span>
        </div>
        <CardDescription className="text-xs text-slate-400">
          Compare surface optical reflectance against cloud-penetrating L-band Synthetic Aperture Radar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual Swipe Container */}
        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center select-none">
          {/* Base Layer: SAR Radar X-Ray */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            {hasSar ? (
              <img
                src={sarUri!}
                alt={sarTitle}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
                <Layers className="w-8 h-8 text-indigo-400/60" aria-hidden="true" />
                <div className="font-semibold text-xs text-slate-300">{sarTitle}</div>
                <div className="text-[11px] text-slate-500">Real NISAR L-band SAR Backscatter Raster Payload</div>
              </div>
            )}
          </div>

          {/* Top Layer: Optical Surface View (Clipped by sliderPos) */}
          <div
            className="absolute inset-0 overflow-hidden border-r-2 border-indigo-500 shadow-2xl bg-slate-950 flex items-center justify-center"
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
              <div className="flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2 bg-slate-900/90 w-full h-full">
                <ImageIcon className="w-8 h-8 text-sky-400/60" aria-hidden="true" />
                <div className="font-semibold text-xs text-slate-300">{opticalTitle}</div>
                <div className="text-[11px] text-slate-500">Ground Field Photo / MODIS Reflectance Context</div>
              </div>
            )}
          </div>

          {/* Center Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-indigo-500 shadow-lg pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-md">
              <Sliders className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Interactive Slider Input */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" /> Optical View
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" /> SAR X-Ray Radar
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            aria-label="Optical vs SAR swipe slider position"
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {!hasOptical && !hasSar && (
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 flex items-center gap-2 text-xs text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>No fabricated imagery used. Displaying default scientific dataset reference layers.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
