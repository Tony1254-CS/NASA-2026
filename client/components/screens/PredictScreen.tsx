import React, { useState } from 'react';
import { DisplacementChart } from '../ui/DisplacementChart';
import { TimeSlider } from '../ui/TimeSlider';
import { RiskCorridor } from '../ui/RiskCorridor';

export function PredictScreen() {
  const [sliderValue, setSliderValue] = useState(50); // 50 is present, 100 is future
  
  // Calculate predicted values based on slider
  const isFuture = sliderValue > 50;
  const futurePercentage = isFuture ? (sliderValue - 50) / 50 : 0;
  
  // Mock predictions based on the blueprint
  const currentDisplacement = -28;
  const projectedDisplacement = currentDisplacement + (futurePercentage * -72); // goes down to -100
  const population = Math.round(15000 + (futurePercentage * 8147));

  return (
    <div className="min-h-screen bg-[#060911] text-slate-200 pb-24 pt-4 px-4 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-white mb-1">PREDICTIVE INTELLIGENCE</h1>
        <p className="text-sm text-slate-400">Displacement Trend Projection</p>
      </div>

      <div className="mb-4">
        <DisplacementChart predictionProgress={sliderValue} />
      </div>

      <div className="glass-panel rounded-xl p-4 mb-4 border border-sky-500/20">
        <div className="text-[10px] font-mono text-slate-400 mb-2 tracking-wider">TIME SLIDER (PAST ↔ FUTURE)</div>
        <TimeSlider value={sliderValue} onChange={setSliderValue} />
      </div>

      <div className="glass-panel rounded-xl p-4 mb-4 border border-sky-500/20">
        <div className="text-[10px] font-mono text-slate-400 mb-3 tracking-wider">🔮 PREDICTION</div>
        
        {isFuture ? (
          <div className="space-y-3 mb-4">
            <p className="text-sm text-slate-300">At current rate (-34mm/yr):</p>
            
            <div className={`p-3 rounded-lg border ${projectedDisplacement <= -50 ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{projectedDisplacement <= -50 ? '⚠️' : '⚪'}</span>
                <div>
                  <div className="text-sm font-bold text-white">Mar 2027: Exceeds -50mm</div>
                  <div className="text-xs text-slate-400">Structural damage risk</div>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${projectedDisplacement <= -100 ? 'bg-rose-500/10 border-rose-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{projectedDisplacement <= -100 ? '🔴' : '⚪'}</span>
                <div>
                  <div className="text-sm font-bold text-white">Nov 2027: Exceeds -100mm</div>
                  <div className="text-xs text-slate-400">Foundation failure risk</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-400 mb-4 h-32 flex items-center justify-center border border-dashed border-slate-700 rounded-lg">
            Drag slider right to predict future impacts
          </div>
        )}

        <div className="mb-4">
          <div className="text-[10px] font-mono text-slate-400 mb-2 tracking-wider">PROJECTED RISK CORRIDOR</div>
          <RiskCorridor intensity={futurePercentage} />
        </div>

        {isFuture && (
          <div className="bg-rose-500/5 border-l-2 border-rose-500 p-3 rounded-r-lg">
            <div className="text-xs text-slate-400 mb-1">Estimated population in risk corridor:</div>
            <div className="text-2xl font-mono font-bold text-rose-400 mb-2">
              {population.toLocaleString()} people
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div>🏫 7 schools</div>
              <div>🏥 2 hospitals</div>
              <div className="col-span-2">🏭 1 water treatment plant</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400 border border-slate-800 mb-6">
        <span className="font-bold text-sky-400">ⓘ METHODOLOGY:</span> Linear velocity estimation from L-band InSAR time-series (Ferretti et al., 2001). Projection assumes constant deformation rate.
      </div>
      
      <button className="w-full py-3 bg-sky-500/10 border border-sky-500/50 rounded-lg text-sky-400 font-bold tracking-wide active:bg-sky-500/20 transition-colors">
        📊 GENERATE RISK REPORT
      </button>
    </div>
  );
}
