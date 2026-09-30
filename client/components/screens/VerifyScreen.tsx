'use client';

import React, { useState } from 'react';

export const VerifyScreen: React.FC = () => {
  const [surfaceCondition, setSurfaceCondition] = useState('Cracked');
  const [matchesSar, setMatchesSar] = useState('Confirms');
  const [confidence, setConfidence] = useState(4);
  const [notes, setNotes] = useState('');

  return (
    <div className="flex flex-col h-full w-full bg-[#060911] text-slate-100 overflow-y-auto pb-24 p-4 space-y-4">
      {/* Active Case Card */}
      <div className="science-card p-4 border-rose-900/50 bg-rose-950/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
        <h3 className="text-xs font-mono tracking-widest text-slate-400 mb-1 flex items-center">
          <span className="mr-2">📍</span> GROUND TRUTH REQUIRED
        </h3>
        <div className="font-bold text-slate-200 mb-3">Jakarta North — Subsidence Zone B</div>
        <div className="grid grid-cols-1 gap-1 text-xs font-mono text-slate-300">
          <div>SAR Detection: <span className="text-cyan-400">-47mm displacement</span></div>
          <div>Coherence: <span className="text-cyan-400">0.82 (High confidence)</span></div>
          <div>Last verified: <span className="text-rose-400">Never</span></div>
          <div className="flex items-center mt-1">
            Priority: 
            <div className="flex space-x-0.5 ml-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`h-2 w-1.5 ${i < 8 ? 'bg-rose-500' : 'bg-slate-700'}`}></div>
              ))}
            </div>
            <span className="ml-2 text-rose-500 font-bold">CRITICAL</span>
          </div>
        </div>
      </div>

      {/* Camera Viewfinder (Simulated) */}
      <div className="relative w-full aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
        <img 
          src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600&auto=format&fit=crop" 
          alt="Cracked pavement" 
          className="w-full h-full object-cover opacity-70"
        />
        {/* AR Overlays */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50"></div>
        
        <div className="absolute top-3 left-3 text-[10px] font-mono text-cyan-400 bg-slate-900/70 p-1 rounded backdrop-blur">
          GPS: 6°07'33"S 106°49'22"E
        </div>
        
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-400 bg-slate-900/70 p-1 rounded backdrop-blur">
          {new Date().toISOString().split('T')[0]} 14:32:01 UTC
        </div>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-dashed border-cyan-400 rounded-full animate-pulse flex items-center justify-center">
            <div className="text-cyan-400">+</div>
          </div>
          <div className="mt-2 text-[10px] font-mono text-cyan-300 bg-slate-900/80 px-2 py-0.5 rounded">
            Expected: Subsidence
          </div>
        </div>
      </div>

      {/* Observation Form */}
      <div className="science-card p-4 space-y-4">
        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase mb-2 block">Surface Condition</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {['Cracked', 'Flooded', 'Intact', 'Vegetated', 'Other'].map(cond => (
              <button 
                key={cond}
                onClick={() => setSurfaceCondition(cond)}
                className={`py-2 rounded ${surfaceCondition === cond ? 'bg-cyan-900 text-cyan-300 border border-cyan-500' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase mb-2 block">Matches SAR Data?</label>
          <div className="flex space-x-2 text-xs">
            {['Confirms', 'Contradicts', 'Uncertain'].map(match => (
              <button 
                key={match}
                onClick={() => setMatchesSar(match)}
                className={`flex-1 py-2 rounded ${matchesSar === match ? 'bg-emerald-900 text-emerald-300 border border-emerald-500' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
              >
                {match === 'Confirms' ? '✓ ' : match === 'Contradicts' ? '✕ ' : '? '}{match}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase mb-2 block">Confidence</label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button 
                key={star}
                onClick={() => setConfidence(star)}
                className={`text-xl ${star <= confidence ? 'text-amber-400' : 'text-slate-700'}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase mb-2 block">Notes</label>
          <input 
            type="text" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200 outline-none focus:border-cyan-500"
            placeholder="E.g., visible cracks on foundation..."
          />
        </div>
      </div>

      {/* Verification Score */}
      <div className={`science-card p-4 border-${matchesSar === 'Confirms' ? 'emerald' : matchesSar === 'Contradicts' ? 'rose' : 'amber'}-900/50 bg-${matchesSar === 'Confirms' ? 'emerald' : matchesSar === 'Contradicts' ? 'rose' : 'amber'}-950/10`}>
        <h3 className="text-xs font-mono tracking-widest text-slate-400 mb-3 uppercase">Ground Truth vs. SAR Coherence</h3>
        
        <div className="grid grid-cols-1 gap-2 text-sm mb-4">
          <div className="flex justify-between border-b border-slate-700/50 pb-1">
            <span className="text-slate-400">Your observation:</span>
            <span className="text-slate-200">"{surfaceCondition}"</span>
          </div>
          <div className="flex justify-between border-b border-slate-700/50 pb-1">
            <span className="text-slate-400">SAR coherence:</span>
            <span className="text-slate-200 font-mono">0.82 (stable)</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-slate-400">SAR displacement:</span>
            <span className="text-slate-200 font-mono">-47 mm</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded p-3 mb-4">
          <div className={`font-bold mb-1 flex items-center ${matchesSar === 'Confirms' ? 'text-emerald-400' : matchesSar === 'Contradicts' ? 'text-rose-400' : 'text-amber-400'}`}>
            <span className="mr-2">{matchesSar === 'Confirms' ? '✓' : matchesSar === 'Contradicts' ? '✕' : '?'}</span> {matchesSar.toUpperCase()}
          </div>
          <div className="text-xs text-slate-300">
            {matchesSar === 'Confirms' 
              ? `High coherence + subsidence + ${surfaceCondition.toLowerCase()} = groundwater extraction signature.`
              : matchesSar === 'Contradicts'
              ? `Field data (${surfaceCondition}) contradicts SAR detection. Potential phase unwrapping error or localized anomaly.`
              : `Insufficient data to validate SAR coherence signature.`
            }
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Validation Confidence:</span>
          <div className="flex items-center">
            <div className="flex space-x-0.5 mr-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`h-2 w-1.5 ${i < (confidence * 2) ? (matchesSar === 'Confirms' ? 'bg-emerald-500' : matchesSar === 'Contradicts' ? 'bg-rose-500' : 'bg-amber-500') : 'bg-slate-700'}`}></div>
              ))}
            </div>
            <span className={`font-bold ${matchesSar === 'Confirms' ? 'text-emerald-400' : matchesSar === 'Contradicts' ? 'text-rose-400' : 'text-amber-400'}`}>
              {(confidence * 20)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyScreen;
