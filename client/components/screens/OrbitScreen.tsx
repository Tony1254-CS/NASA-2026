import React from 'react';
import { ScienceCard } from '../ui/ScienceCard';
import { OrbitalArc } from '../ui/OrbitalArc';

export function OrbitScreen() {
  const targetDate = new Date();
  targetDate.setHours(targetDate.getHours() + 2);
  targetDate.setMinutes(targetDate.getMinutes() + 14);
  targetDate.setSeconds(targetDate.getSeconds() + 37);

  return (
    <div className="flex flex-col h-full bg-[#060911] text-slate-100 pb-20">
      {/* 1A. Orbital Arc Visualization */}
      <div className="relative h-[40vh] w-full bg-[#060911] overflow-hidden flex items-end">
        {/* Stars background mock */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-[#060911] to-[#060911]"></div>
        <OrbitalArc />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 1B. Pass Parameters Card */}
        <ScienceCard title="NEXT ACQUISITION OVER YOUR AREA">
          <div className="flex justify-center my-4">
            <div className="text-3xl font-mono text-cyan-400">
              ⏱ 02h 14m 37s
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-mono mt-4 border-t border-slate-700/50 pt-4">
            <div className="text-slate-400">Orbit:</div>
            <div className="text-cyan-300 text-right">#12847 (Ascending)</div>
            
            <div className="text-slate-400">Inc. Angle:</div>
            <div className="text-cyan-300 text-right">33.8°</div>
            
            <div className="text-slate-400">Look Dir:</div>
            <div className="text-cyan-300 text-right">Right-looking</div>
            
            <div className="text-slate-400">Frequency:</div>
            <div className="text-cyan-300 text-right">
              <div>L-band (λ = 24 cm)</div>
              <div>S-band (λ = 9.4 cm)</div>
            </div>
            
            <div className="text-slate-400">Swath:</div>
            <div className="text-cyan-300 text-right">242 km</div>
            
            <div className="text-slate-400">Resolution:</div>
            <div className="text-cyan-300 text-right">3–10 m</div>
            
            <div className="text-slate-400">Repeat:</div>
            <div className="text-cyan-300 text-right">12-day cycle</div>
          </div>
        </ScienceCard>

        {/* 1C. Mission Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <ScienceCard className="text-center !p-3">
            <div className="text-xl font-mono text-cyan-300">12,847</div>
            <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-1">ORBITS<br/>completed</div>
          </ScienceCard>
          <ScienceCard className="text-center !p-3">
            <div className="text-xl font-mono text-cyan-300">97.4%</div>
            <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-1">UPTIME</div>
          </ScienceCard>
          <ScienceCard className="text-center !p-3">
            <div className="text-xl font-mono text-cyan-300">242 km</div>
            <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-1">SWATH<br/>WIDTH</div>
          </ScienceCard>
        </div>

        {/* 1D. Active Monitoring Zones */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono tracking-widest text-slate-500 uppercase px-1">ACTIVE MONITORING ZONES</h3>
          
          <ScienceCard className="border-l-4 border-l-rose-500">
            <div className="flex justify-between items-start mb-2">
              <div className="text-rose-400 text-[10px] font-mono tracking-widest uppercase">🔴 CRITICAL</div>
              <div className="text-[10px] font-mono text-slate-400">2h ago</div>
            </div>
            <div className="font-bold text-slate-100">Jakarta, Indonesia</div>
            <div className="text-sm text-slate-300 mt-1">Urban subsidence: <span className="font-mono text-cyan-300">-12 cm/yr</span></div>
            <div className="text-sm text-slate-300">Coherence: <span className="font-mono text-cyan-300">0.82</span></div>
          </ScienceCard>

          <ScienceCard className="border-l-4 border-l-amber-500">
            <div className="flex justify-between items-start mb-2">
              <div className="text-amber-400 text-[10px] font-mono tracking-widest uppercase">🟡 WARNING</div>
            </div>
            <div className="font-bold text-slate-100">Sundarbans, Bangladesh</div>
            <div className="text-sm text-slate-300 mt-1">Flood inundation detected</div>
            <div className="text-sm text-slate-300">ΔBackscatter: <span className="font-mono text-cyan-300">-8.3 dB</span></div>
            <div className="text-sm text-slate-300">Area affected: <span className="font-mono text-cyan-300">142 km²</span></div>
          </ScienceCard>

          <ScienceCard className="border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start mb-2">
              <div className="text-emerald-400 text-[10px] font-mono tracking-widest uppercase">🟢 MONITORING</div>
            </div>
            <div className="font-bold text-slate-100">Türkiye, East Anatolian Fault</div>
            <div className="text-sm text-slate-300 mt-1">Post-seismic deformation</div>
            <div className="text-sm text-slate-300">Cumulative disp: <span className="font-mono text-cyan-300">-47 mm LOS</span></div>
          </ScienceCard>
        </div>
      </div>
    </div>
  );
}
