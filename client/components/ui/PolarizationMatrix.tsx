'use client';

import React, { useState } from 'react';
import { POLARIZATIONS } from '@/lib/sarPhysics';

export const PolarizationMatrix: React.FC = () => {
  const [selectedPol, setSelectedPol] = useState<string | null>(null);

  const polValues: Record<string, string> = {
    HH: '-12 dB',
    HV: '-22 dB',
    VH: '-22 dB',
    VV: '-10 dB'
  };

  return (
    <div className="science-card p-4 my-4">
      <h3 className="text-xs font-mono tracking-widest text-slate-400 mb-4 uppercase">Polarization Channels</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {POLARIZATIONS.map(pol => (
          <button 
            key={pol.id}
            onClick={() => setSelectedPol(pol.id)}
            className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-colors ${
              selectedPol === pol.id 
                ? 'bg-cyan-900/40 border-cyan-500' 
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="text-lg font-bold text-slate-200 mb-1">{pol.id}</div>
            <div className="text-xs font-mono text-cyan-400">{polValues[pol.id]}</div>
          </button>
        ))}
      </div>

      {selectedPol && (
        <div className="p-3 bg-slate-800 rounded text-sm text-slate-300 border-l-2 border-cyan-500">
          <span className="font-bold text-cyan-400 mr-2">{selectedPol}:</span>
          {POLARIZATIONS.find(p => p.id === selectedPol)?.description}
        </div>
      )}
    </div>
  );
};
