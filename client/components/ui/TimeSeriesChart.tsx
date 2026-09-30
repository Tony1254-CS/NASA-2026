import React from 'react';

export function TimeSeriesChart({ sliderValue }: { sliderValue: number }) {
  // sliderValue 0 to 50 is historical, 50 to 100 is future
  // map 0-100 to SVG x coordinates 0-400
  const markerX = (sliderValue / 100) * 400;

  return (
    <div className="w-full h-48 bg-slate-900/50 rounded-xl relative border border-slate-700/50 p-2 overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        {/* Grid lines */}
        <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="0" y1="150" x2="400" y2="150" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        
        {/* Threshold lines */}
        <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="1" strokeDasharray="4 4" />
        <text x="5" y="95" fill="rgba(245, 158, 11, 0.8)" fontSize="10" fontFamily="monospace">Structural Risk (-50mm)</text>
        
        <line x1="0" y1="150" x2="400" y2="150" stroke="rgba(244, 63, 94, 0.5)" strokeWidth="1" strokeDasharray="4 4" />
        <text x="5" y="145" fill="rgba(244, 63, 94, 0.8)" fontSize="10" fontFamily="monospace">Foundation Failure (-100mm)</text>
        
        {/* Uncertainty Cone (Polygon) - Reveal based on slider */}
        {sliderValue > 50 && (
          <polygon 
            points={`200,60 400,120 400,180 200,60`} 
            fill="rgba(244, 63, 94, 0.15)" 
            clipPath="url(#futureClip)"
          />
        )}
        
        {/* Historical Line (Solid Cyan) */}
        <polyline points="0,20 50,25 100,40 150,55 200,60" fill="none" stroke="#0ea5e9" strokeWidth="2" clipPath="url(#historyClip)" />
        
        {/* Projected Line (Dashed Red) */}
        {sliderValue > 50 && (
          <polyline points="200,60 250,85 300,110 350,130 400,150" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" clipPath="url(#futureClip)" />
        )}
        
        {/* Interactive Marker */}
        <line x1={markerX} y1="0" x2={markerX} y2="200" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
        
        <defs>
          <clipPath id="historyClip">
            <rect x="0" y="0" width={Math.min(200, markerX)} height="200" />
          </clipPath>
          <clipPath id="futureClip">
            <rect x="200" y="0" width={Math.max(0, markerX - 200)} height="200" />
          </clipPath>
        </defs>
        
        {/* Error Bars on Historical */}
        <line x1="50" y1="20" x2="50" y2="30" stroke="#0ea5e9" strokeWidth="1" />
        <line x1="100" y1="35" x2="100" y2="45" stroke="#0ea5e9" strokeWidth="1" />
        <line x1="150" y1="50" x2="150" y2="60" stroke="#0ea5e9" strokeWidth="1" />
        <line x1="200" y1="55" x2="200" y2="65" stroke="#0ea5e9" strokeWidth="1" />
      </svg>
      
      {/* X-Axis Labels */}
      <div className="absolute bottom-1 left-2 text-[8px] font-mono text-slate-500">Jan 2024</div>
      <div className="absolute bottom-1 left-[45%] text-[8px] font-bold text-white">TODAY</div>
      <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-500">Dec 2028</div>
    </div>
  );
}
