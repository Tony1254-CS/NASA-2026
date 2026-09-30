'use client';

import React, { useState } from 'react';
import { SAMPLE_CASES } from '@/lib/sampleInterferograms';
import { InterferogramCanvas } from '@/components/ui/InterferogramCanvas';
import { PhaseColorBar } from '@/components/ui/PhaseColorBar';
import { FormulaDisplay } from '@/components/ui/FormulaDisplay';

export const FringeScreen: React.FC = () => {
  const [activeCaseId, setActiveCaseId] = useState(SAMPLE_CASES[0].id);
  const [mode, setMode] = useState<'phase' | 'amplitude' | 'coherence' | 'displacement'>('phase');
  const [isUnwrapping, setIsUnwrapping] = useState(false);

  const activeCase = SAMPLE_CASES.find(c => c.id === activeCaseId) || SAMPLE_CASES[0];

  return (
    <div className="flex flex-col h-full w-full bg-[#060911] text-slate-100 overflow-y-auto pb-24">
      {/* Top Toggle */}
      <div className="p-4 flex justify-center border-b border-slate-800">
        <div className="bg-slate-900 rounded-lg p-1 flex">
          <button 
            className={`px-4 py-1 text-xs font-bold rounded ${!isUnwrapping ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
            onClick={() => { setIsUnwrapping(false); setMode('phase'); }}
          >
            INTERFEROGRAM VIEW
          </button>
          <button 
            className={`px-4 py-1 text-xs font-bold rounded ${isUnwrapping ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
            onClick={() => setIsUnwrapping(true)}
          >
            UNWRAPPING ANIMATION
          </button>
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col space-y-4">
        {/* Case Study Selector */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {SAMPLE_CASES.map(c => (
            <button
              key={c.id}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                activeCaseId === c.id 
                  ? 'bg-cyan-900/50 border-cyan-500 text-cyan-100' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              onClick={() => setActiveCaseId(c.id)}
            >
              {c.region}
            </button>
          ))}
        </div>

        {/* Product Toggle */}
        {!isUnwrapping && (
          <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/50">
            {(['amplitude', 'phase', 'coherence', 'displacement'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-[10px] uppercase font-mono tracking-wider py-2 rounded ${
                  mode === m ? 'bg-slate-700 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* Canvas Area */}
        <div className="w-full flex flex-col items-center">
          <InterferogramCanvas 
            data={activeCase} 
            mode={isUnwrapping ? 'displacement' : mode}
          />
          {mode === 'phase' && !isUnwrapping && <PhaseColorBar />}
          {isUnwrapping && (
             <div className="text-center text-[10px] font-mono text-cyan-300 mt-2 uppercase tracking-widest animate-pulse">
               Unwrapping Phase... (d = λΨ / 4π)
             </div>
          )}
        </div>

        {/* Formula */}
        <FormulaDisplay 
          wavelength_cm={activeCase.wavelength_cm}
          temporalBaselineDays={activeCase.temporal_baseline_days}
          perpendicularBaseline_m={activeCase.perpendicular_baseline_m}
        />
        
        {/* Case Details */}
        <div className="science-card p-4">
          <h2 className="text-sm font-bold text-slate-200 mb-2">{activeCase.region}</h2>
          <p className="text-xs text-slate-400 mb-3">{activeCase.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
            <div>Sensor: <span className="text-cyan-300">{activeCase.satellite}</span></div>
            <div>Band: <span className="text-cyan-300">{activeCase.band}</span></div>
            <div>Mean Coh: <span className="text-cyan-300">{activeCase.mean_coherence.toFixed(2)}</span></div>
            <div>Fringes: <span className="text-cyan-300">{activeCase.fringe_count}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FringeScreen;
