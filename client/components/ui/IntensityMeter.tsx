import React from 'react';

interface Props {
  displacement: number;
  frequency: number;
  intensity: number;
}

export function IntensityMeter({ displacement, frequency, intensity }: Props) {
  const barCount = 10;
  const activeBars = Math.floor(intensity * barCount);

  return (
    <div className="bg-black/50 border border-white/10 rounded-xl p-5 font-mono w-full backdrop-blur-md">
      <div className="flex justify-between items-center mb-3">
        <span className="text-slate-400">DISPLACEMENT:</span>
        <span className={`text-xl font-bold ${displacement < -30 ? 'text-rose-400' : 'text-cyan-400'}`}>
          {displacement.toFixed(1)} mm
        </span>
      </div>
      
      <div className="flex justify-between items-center mb-3">
        <span className="text-slate-400">FREQUENCY:</span>
        <span className="text-xl font-bold text-white">
          {frequency} Hz
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-slate-400">INTENSITY:</span>
        <div className="flex gap-1">
          {Array.from({ length: barCount }).map((_, i) => (
            <div 
              key={i} 
              className={`w-3 h-6 rounded-sm transition-all duration-300 ${
                i < activeBars 
                  ? (i > 7 ? 'bg-rose-500' : i > 4 ? 'bg-amber-500' : 'bg-cyan-500') 
                  : 'bg-white/10'
              }`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
