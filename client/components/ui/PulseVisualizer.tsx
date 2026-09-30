import React from 'react';

export function PulseVisualizer({ intensity, isPlaying }: { intensity: number, isPlaying: boolean }) {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Base radar wave style circles */}
      <div className={`absolute inset-0 rounded-full border border-cyan-500/30 transition-all duration-1000 ${isPlaying ? 'scale-150 opacity-0 animate-ping' : 'scale-100 opacity-100'}`} style={{ animationDuration: `${2 / intensity}s` }} />
      <div className={`absolute inset-4 rounded-full border border-cyan-500/40 transition-all duration-1000 ${isPlaying ? 'scale-125 opacity-0 animate-ping' : 'scale-100 opacity-100'}`} style={{ animationDuration: `${2.5 / intensity}s`, animationDelay: '0.2s' }} />
      <div className={`absolute inset-10 rounded-full border border-cyan-500/60 transition-all duration-1000 ${isPlaying ? 'scale-110 opacity-0 animate-ping' : 'scale-100 opacity-100'}`} style={{ animationDuration: `${3 / intensity}s`, animationDelay: '0.4s' }} />
      
      {/* Central pulsing core */}
      <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-500 ${isPlaying ? 'bg-amber-500' : 'bg-cyan-500/80 shadow-[0_0_30px_rgba(6,182,212,0.5)]'}`}>
        <span className="text-white text-3xl">🔊</span>
      </div>
    </div>
  );
}
