'use client';

import React from 'react';

export const PhaseColorBar: React.FC = () => {
  return (
    <div className="flex flex-col gap-1 w-full mt-2">
      <div className="flex justify-between text-[10px] font-mono text-slate-400">
        <span>-π</span>
        <span>0</span>
        <span>+π</span>
      </div>
      <div className="h-4 w-full rounded" style={{
        background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)'
      }} />
      <div className="text-center text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">
        1 Color Cycle = 1 Fringe = λ/2 Displacement
      </div>
    </div>
  );
};
