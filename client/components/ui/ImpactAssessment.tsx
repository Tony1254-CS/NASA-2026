import React, { useEffect, useState } from 'react';

export default function ImpactAssessment() {
  const [count, setCount] = useState(0);
  const targetPopulation = 47382;

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = targetPopulation / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= targetPopulation) {
        setCount(targetPopulation);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-6 border-l-4 border-rose-500 bg-rose-500/5 p-4 rounded-r-lg shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💀</span>
        <h2 className="text-lg font-bold text-rose-500 tracking-wide">IMPACT ASSESSMENT</h2>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
        <div className="text-4xl md:text-5xl font-extrabold text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.8)] text-center">
          {new Intl.NumberFormat().format(count)}
        </div>
        <div className="text-center text-sm font-semibold text-rose-300/80 mt-1 uppercase tracking-wider">
          People in Affected Zone
        </div>
        <div className="text-center text-xs text-slate-500 mt-1">
          Source: WorldPop 2020
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <span>🏥</span> 3 Hospitals
          </div>
          <div className="text-sm text-slate-400 mt-1 pl-7 space-y-1">
            <div>Dacope Upazila Health Complex (2.1 km)</div>
            <div>Sundarbans Clinic (4.7km)</div>
            <div>Mongla Hospital (8.3km)</div>
          </div>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <span>🏫</span> 12 Schools
          </div>
          <div className="text-sm text-slate-400 mt-1 pl-7">
            <div>Dacope Govt. Primary...</div>
          </div>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <span>🌉</span> 2 Bridges
          </div>
          <div className="text-sm text-slate-400 mt-1 pl-7">
            <div>Passur River Bridge...</div>
          </div>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <span>🚒</span> 1 Fire Station
          </div>
          <div className="text-sm text-slate-400 mt-1 pl-7">
            <div>Dacope Fire Service...</div>
          </div>
        </div>
      </div>
    </div>
  );
}
