import React from 'react';

export function DisplacementChart({ predictionProgress }: { predictionProgress: number }) {
  // Map progress (40-100) to points to reveal
  const isFuture = predictionProgress > 40;
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full h-48 relative overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-2 z-10">
        <span className="text-xs font-bold text-slate-500">DISPLACEMENT VELOCITY</span>
        <span className="text-sm font-bold text-rose-400">-34 mm/yr</span>
      </div>
      
      <div className="flex-1 relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* Threshold lines */}
          <line x1="0" y1="60" x2="100" y2="60" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
          <line x1="0" y1="80" x2="100" y2="80" stroke="#f43f5e" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
          
          <text x="2" y="58" fill="#f59e0b" fontSize="4" opacity="0.8">Structural Risk (-50mm)</text>
          <text x="2" y="78" fill="#f43f5e" fontSize="4" opacity="0.8">Foundation Risk (-100mm)</text>

          {/* Historical Data (Solid) */}
          <polyline 
            points="0,20 10,25 20,23 30,35 40,40" 
            fill="none" 
            stroke="#22d3ee" 
            strokeWidth="2" 
          />
          
          {/* Predicted Data (Dashed) - only show based on slider */}
          {isFuture && (
            <polyline 
              points={`40,40 60,60 80,80 100,100`}
              fill="none" 
              stroke="#f43f5e" 
              strokeWidth="2" 
              strokeDasharray="4,2" 
              style={{
                strokeDashoffset: 100 - predictionProgress,
                clipPath: `inset(0 ${100 - predictionProgress}% 0 0)`
              }}
            />
          )}

          {/* Prediction Gradient Fill */}
          {isFuture && (
            <polygon 
              points={`40,40 100,100 100,100 40,100`}
              fill="url(#riskGradient)" 
              style={{
                clipPath: `inset(0 ${100 - predictionProgress}% 0 0)`
              }}
            />
          )}

          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Today line */}
        <div className="absolute top-0 bottom-0 left-[40%] w-[1px] bg-white/30 border-l border-dashed border-white/50" />
      </div>
    </div>
  );
}
