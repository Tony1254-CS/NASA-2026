import React from 'react';

export default function EventTimeline() {
  const events = [
    { date: 'Sep 5', label: 'Baseline', type: 'past' },
    { date: 'Sep 8', label: 'Rain spike', type: 'past' },
    { date: 'Sep 12', label: 'Δσ⁰ detect', type: 'past' },
    { date: 'Sep 14', label: 'Field obs', type: 'past' },
    { date: 'Today', label: 'Now', type: 'current' },
  ];

  return (
    <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">⏱️</span>
        <h2 className="text-lg font-bold text-slate-200 tracking-wide uppercase">Event Timeline</h2>
      </div>

      <div className="relative pt-2 pb-6 min-w-[300px]">
        {/* Horizontal Line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-700"></div>

        <div className="flex justify-between relative z-10">
          {events.map((event, idx) => (
            <div key={idx} className="flex flex-col items-center w-16 cursor-pointer group">
              <div 
                className={`w-4 h-4 rounded-full border-2 mb-2 transition-transform group-hover:scale-125
                  ${event.type === 'current' 
                    ? 'bg-emerald-500 border-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.8)]' 
                    : 'bg-slate-400 border-slate-900'}`}
              ></div>
              <div className={`text-xs font-bold ${event.type === 'current' ? 'text-emerald-400' : 'text-slate-300'}`}>
                {event.date}
              </div>
              <div className={`text-[10px] text-center mt-1 ${event.type === 'current' ? 'text-emerald-500/80' : 'text-slate-500'}`}>
                {event.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
