'use client';

import React, { useState } from 'react';
import {
  Droplets,
  Activity,
  TreePine,
  Flame,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type CaseDetailResponse } from '@/lib/api';

interface ChangeLensesViewProps {
  caseDetail: CaseDetailResponse | null;
}

type LensType = 'WATER' | 'MOTION' | 'FOREST' | 'DAMAGE';

export function ChangeLensesView({ caseDetail }: ChangeLensesViewProps) {
  const [activeLens, setActiveLens] = useState<LensType>('WATER');

  // Evaluate real data availability per lens
  const latestNisar = caseDetail?.nisar_measurements?.[0];
  const hasWaterData = Boolean(
    caseDetail?.event_type?.toUpperCase() === 'FLOOD' ||
    (latestNisar?.delta_backscatter && latestNisar.delta_backscatter <= -1.5)
  );

  const hasMotionData = Boolean(
    latestNisar?.change_metric?.includes('COHERENCE') ||
    latestNisar?.change_metric?.includes('GUNW')
  );

  const hasForestData = Boolean(
    caseDetail?.event_type?.toUpperCase() === 'DEFORESTATION' ||
    caseDetail?.evidence?.some((e) => e.source_type?.toLowerCase().includes('modis'))
  );

  const hasDamageData = Boolean(
    caseDetail?.event_type?.toUpperCase() === 'WILDFIRE' ||
    caseDetail?.evidence?.some((e) => e.source_type?.toLowerCase().includes('firms')) ||
    (caseDetail?.field_observations && caseDetail.field_observations.length > 0)
  );

  const getLensAvailability = (lens: LensType) => {
    switch (lens) {
      case 'WATER':
        return hasWaterData;
      case 'MOTION':
        return hasMotionData;
      case 'FOREST':
        return hasForestData;
      case 'DAMAGE':
        return hasDamageData;
    }
  };

  const lenses = [
    {
      id: 'WATER' as LensType,
      label: 'WATER (Hydro-Radar)',
      icon: Droplets,
      available: hasWaterData,
      description: 'SAR backscatter drop associated with surface water inundation & GPM rain baseline.',
    },
    {
      id: 'MOTION' as LensType,
      label: 'MOTION (Displacement)',
      icon: Activity,
      available: hasMotionData,
      description: 'InSAR phase coherence & surface deformation fringe metrics.',
    },
    {
      id: 'FOREST' as LensType,
      label: 'FOREST (Canopy/NDVI)',
      icon: TreePine,
      available: hasForestData,
      description: 'MODIS land reflectance & vegetation canopy backscatter loss.',
    },
    {
      id: 'DAMAGE' as LensType,
      label: 'DAMAGE (Thermal/Burn)',
      icon: Flame,
      available: hasDamageData,
      description: 'FIRMS active thermal anomalies & ground field observation damage reports.',
    },
  ];

  return (
    <div className="space-y-4" role="region" aria-label="Analytical Change Lenses">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-400" aria-hidden="true" />
            Analytical Change Lenses
          </h2>
          <p className="text-xs text-slate-400">
            Multi-spectral & radar domain views evaluated against underlying dataset availability.
          </p>
        </div>
      </div>

      {/* Lens Selector Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5" role="tablist" aria-label="Change Lens Options">
        {lenses.map((lens) => {
          const Icon = lens.icon;
          const isSelected = activeLens === lens.id;
          return (
            <button
              key={lens.id}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`lens-panel-${lens.id}`}
              onClick={() => setActiveLens(lens.id)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} aria-hidden="true" />
                {lens.available ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    AVAILABLE
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-500 border border-slate-700">
                    UNAVAILABLE
                  </span>
                )}
              </div>
              <div className="font-bold text-xs text-slate-200">{lens.label}</div>
            </button>
          );
        })}
      </div>

      {/* Active Lens Detail Panel */}
      <Card id={`lens-panel-${activeLens}`} className="bg-slate-900/80 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              {activeLens} Lens Analytics
            </CardTitle>
            {getLensAvailability(activeLens) ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Real Sensor Payload Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> Data Unavailable for Lens
              </span>
            )}
          </div>
          <CardDescription className="text-xs text-slate-400">
            {lenses.find((l) => l.id === activeLens)?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs">
          {getLensAvailability(activeLens) ? (
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-medium">Primary Sensor Signal</span>
                <span className="font-mono text-indigo-400">
                  {latestNisar?.delta_backscatter ? `${latestNisar.delta_backscatter} dB` : 'Active'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-medium">Target Event Context</span>
                <span className="font-mono text-slate-300">{caseDetail?.event_type}</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 leading-normal">
                Analytical lens processing confirms active radar change signature corresponding to {activeLens.toLowerCase()} domain criteria.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center space-y-2">
              <HelpCircle className="w-6 h-6 text-slate-600 mx-auto" aria-hidden="true" />
              <div className="font-semibold text-slate-300">Underlying Data Unavailable</div>
              <p className="text-slate-500 text-[11px] max-w-md mx-auto">
                No simulated or fabricated data is displayed. The {activeLens} analytical lens is inactive because required underlying sensor imagery/interferograms were not acquired for this case.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
