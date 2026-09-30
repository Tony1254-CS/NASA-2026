'use client';

import React, { useState } from 'react';

const bands = [
  { name: 'X-band', wavelength: 3, depth: 40, color: 'bg-rose-500' },
  { name: 'C-band', wavelength: 5.6, depth: 104, color: 'bg-amber-500' },
  { name: 'S-band', wavelength: 9.4, depth: 168, color: 'bg-emerald-500' },
  { name: 'L-band (NISAR)', wavelength: 24, depth: 232, color: 'bg-cyan-400' },
  { name: 'P-band', wavelength: 70, depth: 256, color: 'bg-indigo-500' }
];

export const FrequencyPenetration: React.FC = () => {
  const [activeBandIdx, setActiveBandIdx] = useState(3);
  const activeBand = bands[activeBandIdx];

  return (
    <div className="science-card p-4 w-full">
      <h3 className="text-xs font-mono tracking-widest text-slate-400 mb-4 uppercase">Radar Penetration by Frequency</h3>
      
      <div className="relative h-64 border-l-2 border-slate-700 ml-8 font-mono text-xs text-slate-400 overflow-hidden">
        
        {/* Layers */}
        <div className="absolute top-0 inset-x-0 h-10 border-b border-dashed border-slate-700 flex items-center pl-4">
          <span className="text-white">SURFACE</span>
        </div>
        
        <div className="absolute top-10 inset-x-0 h-16 border-b border-dashed border-slate-700 flex items-center pl-4 bg-emerald-950/20">
          <span>🌿 Leaves & twigs</span>
        </div>

        <div className="absolute top-[104px] inset-x-0 h-16 border-b border-dashed border-slate-700 flex items-center pl-4 bg-emerald-900/20">
          <span>🌳 Branches</span>
        </div>

        <div className="absolute top-[168px] inset-x-0 h-16 border-b border-dashed border-slate-700 flex items-center pl-4 bg-amber-950/20">
          <span>🪵 Trunks & soil</span>
        </div>

        <div className="absolute top-[232px] inset-x-0 bottom-0 flex items-center pl-4 bg-stone-900/40">
          <span className="font-bold text-slate-300">🪨 Ground surface</span>
        </div>

        {/* Animated Radar Beam */}
        <div 
          className={`absolute top-0 left-16 w-3 transition-all duration-500 ease-out rounded-b-full shadow-[0_0_15px_rgba(255,255,255,0.2)] ${activeBand.color}`}
          style={{ height: `${activeBand.depth}px` }}
        >
          <div className="absolute -left-16 bottom-2 font-bold text-white bg-slate-900/80 px-1 rounded whitespace-nowrap">
            {activeBand.name}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-2">
          <span>Shorter (X)</span>
          <span>Wavelength</span>
          <span>Longer (P)</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max={bands.length - 1} 
          value={activeBandIdx}
          onChange={(e) => setActiveBandIdx(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="text-center mt-2 font-mono text-cyan-300">
          λ = {activeBand.wavelength} cm
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-400 leading-relaxed bg-cyan-950/20 p-3 rounded-lg border border-cyan-900/30">
        <span className="text-cyan-400 font-bold mr-1">Why L-Band Matters:</span> 
        At 24cm, NISAR's L-band penetrates the forest canopy to measure ground deformation beneath vegetation, maintaining coherence over time where C-band (5.6cm) fails.
      </div>
    </div>
  );
};
