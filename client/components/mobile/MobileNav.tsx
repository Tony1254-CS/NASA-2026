'use client';

import React from 'react';
import { Crosshair, Activity, ShieldCheck, Globe, Anchor } from 'lucide-react';

export type MobileTab = 'scan' | 'feel' | 'verify' | 'pulse' | 'char';

interface MobileNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#060b17]/90 backdrop-blur-xl border-t border-sky-500/20 pb-safe shadow-[0_-4px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-xl mx-auto flex items-center justify-around h-14 px-2">
        {/* SCAN TAB */}
        <button
          onClick={() => onTabChange('scan')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 ${
            activeTab === 'scan'
              ? 'text-sky-300 font-bold bg-sky-500/15 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          aria-label="Scan Tab"
        >
          <Crosshair className={`h-4.5 w-4.5 ${activeTab === 'scan' ? 'stroke-[2.5px] text-sky-400' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-wider font-mono">SCAN</span>
        </button>

        {/* PULSE TAB */}
        <button
          onClick={() => onTabChange('pulse')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 ${
            activeTab === 'pulse'
              ? 'text-sky-300 font-bold bg-sky-500/15 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          aria-label="Global Pulse Tab"
        >
          <Globe className={`h-4.5 w-4.5 ${activeTab === 'pulse' ? 'stroke-[2.5px] text-sky-400' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-wider font-mono">PULSE</span>
        </button>

        {/* CHAR GUARDIAN TAB */}
        <button
          onClick={() => onTabChange('char')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 ${
            activeTab === 'char'
              ? 'text-sky-300 font-bold bg-sky-500/15 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          aria-label="Char Guardian Tab"
        >
          <Anchor className={`h-4.5 w-4.5 ${activeTab === 'char' ? 'stroke-[2.5px] text-sky-400' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-wider font-mono">CHAR</span>
        </button>

        {/* FEEL TAB */}
        <button
          onClick={() => onTabChange('feel')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 ${
            activeTab === 'feel'
              ? 'text-sky-300 font-bold bg-sky-500/15 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          aria-label="Feel Tab"
        >
          <Activity className={`h-4.5 w-4.5 ${activeTab === 'feel' ? 'stroke-[2.5px] text-sky-400' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-wider font-mono">FEEL</span>
        </button>

        {/* VERIFY TAB */}
        <button
          onClick={() => onTabChange('verify')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 ${
            activeTab === 'verify'
              ? 'text-sky-300 font-bold bg-sky-500/15 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          aria-label="Verify Tab"
        >
          <ShieldCheck className={`h-4.5 w-4.5 ${activeTab === 'verify' ? 'stroke-[2.5px] text-sky-400' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-wider font-mono">VERIFY</span>
        </button>
      </div>
    </nav>
  );
}

