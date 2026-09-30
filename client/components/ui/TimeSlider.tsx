import React from 'react';

export function TimeSlider({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full">
      <div className="flex justify-between text-xs font-bold text-slate-500 mb-4">
        <span>◀ PAST</span>
        <span className="text-cyan-500 animate-pulse">drag to predict →</span>
        <span className="text-cyan-400">FUTURE ▶</span>
      </div>
      
      <div className="relative w-full h-2 bg-slate-800 rounded-full">
        {/* Fill */}
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-slate-600 to-cyan-500 rounded-full" 
          style={{ width: `${value}%` }} 
        />
        
        {/* Slider input */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {/* Custom thumb (purely visual, follows the value) */}
        <div 
          className="absolute top-1/2 -mt-3 -ml-3 w-6 h-6 bg-cyan-400 rounded-full border-2 border-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.8)] pointer-events-none transition-transform"
          style={{ left: `${value}%` }}
        />
        
        {/* Today marker */}
        <div className="absolute top-0 bottom-0 w-1 bg-white left-[40%]" />
      </div>
      
      <div className="flex justify-between text-xs text-slate-400 mt-2">
        <span>2024</span>
        <span className="font-bold text-white relative -left-[10%]">TODAY</span>
        <span>2028</span>
      </div>
    </div>
  );
}
