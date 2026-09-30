'use client';

import React from 'react';

interface Props {
  wavelength_cm: number;
  temporalBaselineDays: number;
  perpendicularBaseline_m: number;
}

export const FormulaDisplay: React.FC<Props> = ({ 
  wavelength_cm, 
  temporalBaselineDays, 
  perpendicularBaseline_m 
}) => {
  return (
    <div className="science-card p-4 my-4 font-mono text-xs text-slate-300">
      <div className="text-cyan-300 font-bold mb-3 text-sm">
        d<sub>LOS</sub> = λ·Ψ / 4π
      </div>
      <div className="space-y-1">
        <div>λ = {wavelength_cm} cm (L-band)</div>
        <div>Ψ = unwrapped phase (rad)</div>
        <div>d = line-of-sight displacement (mm)</div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1">
        <div>1 fringe = λ/2 = {(wavelength_cm / 2).toFixed(1)} cm</div>
        <div>Temporal baseline: {temporalBaselineDays} days</div>
        <div>Perpendicular baseline: {perpendicularBaseline_m} m</div>
      </div>
    </div>
  );
};
