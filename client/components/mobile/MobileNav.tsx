'use client';

import React from 'react';
import { Satellite, Layers, Activity, Camera, LineChart } from 'lucide-react';

export type MobileTab = 'orbit' | 'fringe' | 'signal' | 'verify' | 'risk';

interface MobileNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const tabs: { id: MobileTab; label: string; icon: React.ElementType }[] = [
    { id: 'orbit', label: 'ORBIT', icon: Satellite },
    { id: 'fringe', label: 'FRINGE', icon: Layers },
    { id: 'signal', label: 'SIGNAL', icon: Activity },
    { id: 'verify', label: 'VERIFY', icon: Camera },
    { id: 'risk', label: 'RISK', icon: LineChart },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#060b17]/95 backdrop-blur-xl border-t border-sky-500/25 shadow-[0_-4px_25px_rgba(0,0,0,0.8)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Investigation Navigation"
    >
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around h-14 px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-sky-300 font-extrabold bg-sky-500/20 border border-sky-400/50 shadow-[0_0_14px_rgba(56,189,248,0.35)] ring-1 ring-sky-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
              }`}
              aria-label={`${label} Tab`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'stroke-[2.5px] text-sky-400' : ''}`} />
              <span className="text-[9px] mt-0.5 tracking-wider font-mono">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
