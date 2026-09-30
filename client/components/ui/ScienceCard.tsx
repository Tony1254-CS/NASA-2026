import React from 'react';

interface ScienceCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function ScienceCard({ children, className = '', title }: ScienceCardProps) {
  return (
    <div className={`bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-xs font-mono tracking-widest text-slate-300 uppercase">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
