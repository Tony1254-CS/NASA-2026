import React, { useEffect, useState } from 'react';

export function SatelliteTracker() {
  const [position, setPosition] = useState(0);

  // Mocking the satellite moving along a curved path (sine wave approximation of orbit)
  useEffect(() => {
    let animationFrame: number;
    let start = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - start;
      const newPos = (elapsed / 20000) % 1; // Complete a pseudo-orbit every 20s
      setPosition(newPos);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Map coordinates 0-1 to pseudo-mercator SVG coordinates
  const x = position * 100;
  const y = 50 + Math.sin(position * Math.PI * 2) * 30;

  return (
    <div className="relative w-full h-48 bg-slate-900 rounded-xl overflow-hidden border border-white/10 flex flex-col items-center justify-center">
      {/* Background Grid / Map Mock */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />
      
      {/* Mock continents placeholder */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M10,20 Q30,10 50,30 T90,20" fill="none" stroke="currentColor" className="text-emerald-500/30" strokeWidth="2" />
        <path d="M20,60 Q40,80 60,50 T90,70" fill="none" stroke="currentColor" className="text-emerald-500/30" strokeWidth="2" />
      </svg>

      {/* Orbit path dashed line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0,50 Q25,20 50,50 T100,50" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" className="opacity-50" />
      </svg>

      {/* Moving Satellite Dot */}
      <div 
        className="absolute w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(56,189,248,1)] z-10 transition-transform duration-75"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-75" />
      </div>

      <div className="absolute bottom-2 left-2 text-[10px] text-cyan-500/60 font-mono">
        NISAR LIVE TELEMETRY
      </div>
    </div>
  );
}
