import React from 'react';

type Severity = 'critical' | 'moderate' | 'low';

interface AlertCardProps {
  severity: Severity;
  timeAgo: string;
  title: string;
  location: string;
  metrics: string;
  populationImpact: string;
  onClick?: () => void;
}

export function AlertCard({ severity, timeAgo, title, location, metrics, populationImpact, onClick }: AlertCardProps) {
  const severityConfig = {
    critical: {
      color: 'bg-rose-500',
      border: 'border-rose-500',
      text: 'text-rose-500',
      icon: '🔴',
      label: 'CRITICAL',
    },
    moderate: {
      color: 'bg-amber-500',
      border: 'border-amber-500',
      text: 'text-amber-500',
      icon: '🟡',
      label: 'MODERATE',
    },
    low: {
      color: 'bg-emerald-500',
      border: 'border-emerald-500',
      text: 'text-emerald-500',
      icon: '🟢',
      label: 'LOW',
    },
  };

  const config = severityConfig[severity];

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden bg-slate-900/60 border border-white/5 backdrop-blur-sm rounded-lg p-4 pl-5 mb-3 cursor-pointer transition-all hover:bg-slate-800/80 active:scale-[0.98] animate-in slide-in-from-right-8 duration-500 fade-in`}
    >
      {/* Left colored border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.color}`} />
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider">
          <span>{config.icon}</span>
          <span className={config.text}>{config.label}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{timeAgo}</span>
        </div>
      </div>
      
      <h3 className="text-white font-bold text-lg leading-tight mb-1">{title}</h3>
      <p className="text-slate-300 text-sm mb-3">{location}</p>
      
      <div className="text-cyan-200/80 text-xs font-mono mb-3">
        {metrics}
      </div>
      
      <div className="pt-3 border-t border-white/5">
        <div className={`text-sm font-semibold ${severity === 'critical' ? 'text-rose-400' : severity === 'moderate' ? 'text-amber-400' : 'text-slate-400'}`}>
          {populationImpact}
        </div>
      </div>
    </div>
  );
}
