import React from 'react';
import { Satellite } from 'lucide-react';

export function OrbitalArc() {
  return (
    <div className="relative w-full h-full flex items-end justify-center z-10 overflow-hidden">
      {/* Earth Curve */}
      <div className="absolute w-[150%] h-[150px] bg-slate-900/80 border-t border-cyan-500/30 rounded-[100%] blur-[1px] translate-y-1/2"></div>
      
      {/* Orbital Path (Dashed) */}
      <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M-10,80 Q50,0 110,80" fill="none" stroke="rgba(14, 165, 233, 0.3)" strokeWidth="0.5" strokeDasharray="2 2" />
        {/* Swath width corridor */}
        <path d="M-10,80 Q50,0 110,80" fill="none" stroke="rgba(14, 165, 233, 0.1)" strokeWidth="8" />
      </svg>
      
      {/* Satellite Icon (Animated along path ideally, but static positioned here for now) */}
      <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 text-cyan-400 drop-shadow-[0_0_10px_rgba(14,165,233,0.8)]">
        <Satellite className="w-8 h-8" />
      </div>

      {/* Crosshair / Target */}
      <div className="absolute bottom-[20px] left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,1)] animate-pulse"></div>
        <div className="text-[8px] font-mono text-slate-400 mt-1 uppercase tracking-widest">Target</div>
      </div>
    </div>
  );
}
