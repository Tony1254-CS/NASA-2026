import React from 'react';

export function RiskCorridor({ intensity }: { intensity: number }) {
  // intensity 0 to 1 based on prediction progress
  const pulseScale = 1 + (intensity * 0.5);
  
  return (
    <div className="relative w-full h-40 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-inner">
      {/* Real Map Background */}
      <div 
        className="absolute inset-0 opacity-60 bg-cover bg-center transition-all duration-1000" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop&sat=-100')",
          filter: intensity > 0 ? "sepia(1) hue-rotate(300deg) saturate(3) brightness(0.4)" : "grayscale(1) brightness(0.6)"
        }}
      />
      
      {/* Danger Zone Overlay */}
      {intensity > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-screen">
          {/* Core Danger */}
          <div 
            className="absolute w-20 h-12 bg-rose-500/60 border-2 border-rose-400 rounded-full blur-[2px] transition-all duration-500 shadow-[0_0_30px_rgba(244,63,94,0.8)]"
            style={{ 
              transform: `scale(${pulseScale}) rotate(-15deg)`,
              opacity: 0.5 + (intensity * 0.5) 
            }}
          />
          {/* Expanding Ripple */}
          <div 
            className="absolute w-32 h-20 bg-rose-500/20 rounded-full blur-md animate-ping"
            style={{ 
              transform: `scale(${pulseScale})`,
              opacity: intensity * 0.8,
              animationDuration: '2s'
            }}
          />
        </div>
      )}

      {/* Infrastructure Dots */}
      <div className="absolute top-1/4 left-1/3 group">
        <div className="w-2.5 h-2.5 bg-sky-400 rounded-full border border-black shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse" />
        <div className="absolute -top-6 -left-4 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap">Hospital</div>
      </div>
      
      <div className="absolute top-1/2 right-1/3 group">
        <div className="w-2.5 h-2.5 bg-amber-400 rounded-full border border-black shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
        <div className="absolute -top-6 -left-4 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap">School</div>
      </div>
      
      <div className="absolute bottom-1/3 left-1/2 group">
        <div className="w-2.5 h-2.5 bg-amber-400 rounded-full border border-black shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
        <div className="absolute -top-6 -left-4 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap">School</div>
      </div>

      {/* Radar Scan Line */}
      <div className="absolute inset-0 border-t border-sky-400/20 shadow-[0_4px_10px_rgba(56,189,248,0.1)] opacity-50 animate-[scan_3s_linear_infinite]" />
    </div>
  );
}
