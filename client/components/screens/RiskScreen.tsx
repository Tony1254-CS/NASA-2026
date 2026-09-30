import React, { useState } from 'react';
import { ScienceCard } from '../ui/ScienceCard';
import { TimeSeriesChart } from '../ui/TimeSeriesChart';

export function RiskScreen() {
  const [sliderValue, setSliderValue] = useState(50);
  const [isolateSignals, setIsolateSignals] = useState(false);
  
  // Dynamic calculations based on slider
  // 50 is TODAY (-28mm), 100 is end of 2028 (-100mm)
  const isFuture = sliderValue > 50;
  const progress = sliderValue / 100;
  const futureProgress = isFuture ? (sliderValue - 50) / 50 : 0;
  
  // Interpolated values
  const currentDisplacement = -28 + (futureProgress * -72); // max -100
  const currentUncertainty = 5 + (futureProgress * 15); // max 20
  const populationAtRisk = Math.floor(12000 + (futureProgress * 11147));
  const hospitals = isFuture && sliderValue > 75 ? 2 : 1;
  const schools = isFuture ? Math.floor(3 + futureProgress * 4) : 3;

  // Date calculation based on slider
  const getSimulatedDate = () => {
    if (!isFuture) return 'TODAY';
    const monthsAhead = Math.floor(futureProgress * (12 * 4)); // 4 years
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-[#060911] text-slate-100 pb-20">
      <div className="px-4 py-3 flex justify-between items-center border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <span className="text-xl font-bold tracking-tight">🛰 TRACE FIELD</span>
        <div className="flex items-center space-x-1.5 text-rose-500 text-xs font-semibold tracking-wider">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>RISK ANALYSIS</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 5A & 5B. Time-Series Chart and Slider */}
        <ScienceCard title="DISPLACEMENT TIME-SERIES">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-400 font-mono uppercase">Filter:</span>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isolateSignals}
                  onChange={() => setIsolateSignals(!isolateSignals)}
                />
                <div className={`block w-8 h-5 rounded-full transition-colors ${isolateSignals ? 'bg-rose-500' : 'bg-slate-700'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${isolateSignals ? 'transform translate-x-3' : ''}`}></div>
              </div>
              <div className={`ml-2 text-[10px] font-mono tracking-widest uppercase ${isolateSignals ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                Isolate Critical Signals
              </div>
            </label>
          </div>
          <div className={isolateSignals && currentDisplacement < -50 ? 'animate-pulse' : ''}>
            <TimeSeriesChart sliderValue={sliderValue} isolateSignals={isolateSignals} />
          </div>
          
          <div className="mt-4 px-2">
            <input 
              type="range" 
              min="0" max="100" 
              value={sliderValue}
              onChange={(e) => setSliderValue(parseInt(e.target.value))}
              className="w-full accent-rose-500 bg-slate-800 rounded-lg appearance-none h-1" 
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
              <span>Historical</span>
              <span>Projected</span>
            </div>
          </div>
        </ScienceCard>

        {/* 5C. Impact Assessment Panel */}
        <ScienceCard title={`⚠️ PROJECTED IMPACT @ ${getSimulatedDate()}`}>
          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div className="text-slate-400">Displacement:</div>
            <div className="font-mono text-cyan-300 text-right">{currentDisplacement.toFixed(1)} mm (±{currentUncertainty.toFixed(1)} mm)</div>
            
            <div className="text-slate-400">Velocity:</div>
            <div className="font-mono text-cyan-300 text-right">-34 mm/yr</div>
            
            <div className="text-slate-400">Acceleration:</div>
            <div className="font-mono text-cyan-300 text-right">-2.1 mm/yr²</div>
          </div>

          <div className="border-t border-slate-700/50 pt-3">
            <h4 className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">HUMAN IMPACT</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-slate-300">👥 Population at risk:</div>
              <div className="font-mono text-rose-400 text-right">{populationAtRisk.toLocaleString()}</div>
              
              <div className="text-slate-300">🏥 Hospitals:</div>
              <div className="font-mono text-amber-400 text-right">{hospitals}</div>
              
              <div className="text-slate-300">🏫 Schools:</div>
              <div className="font-mono text-amber-400 text-right">{schools}</div>
              
              <div className="text-slate-300">🌉 Bridges:</div>
              <div className="font-mono text-amber-400 text-right">{isFuture ? 3 : 1}</div>
              
              <div className="text-slate-300">💧 Water treatment:</div>
              <div className="font-mono text-amber-400 text-right">{isFuture && sliderValue > 90 ? 1 : 0}</div>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-3 mt-3">
            <h4 className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">METHODOLOGY</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Linear velocity from PS-InSAR time-series (Ferretti et al., 2001). 
              Uncertainty: 1σ from temporal coherence-weighted residuals. 
              Population: WorldPop 2024 1km grid. Infrastructure: OSM Overpass API.
            </p>
          </div>
        </ScienceCard>

        {/* 5D. Atmospheric Correction Note */}
        <ScienceCard title="ℹ️ DATA QUALITY NOTE">
          <p className="text-xs text-slate-300 leading-relaxed mb-2">
            Tropospheric delay correction applied using ERA5 reanalysis (ECMWF). 
            Ionospheric correction: split-spectrum method (L-band specific).
          </p>
          <div className="flex justify-between items-center text-xs border-t border-slate-700/50 pt-2">
            <span className="text-slate-400">Residual atmospheric noise:</span>
            <span className="font-mono text-emerald-400">±3.2 mm</span>
          </div>
        </ScienceCard>

        {/* 5E. Export Button */}
        <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg py-3 text-sm font-mono tracking-wider flex items-center justify-center transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.25)]">
          📄 GENERATE FIELD REPORT (PDF)
        </button>
      </div>
    </div>
  );
}
