'use client';

import React from 'react';
import { Crosshair, Activity, Layers, Calendar, Clock, Globe } from 'lucide-react';

export type MobileTab =
  | 'scan'
  | 'overview'
  | 'signals'
  | 'payloads'
  | 'timeline'
  | 'feel'
  | 'verify'
  | 'pulse'
  | 'char';

interface MobileNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const isOverview = activeTab === 'scan' || activeTab === 'overview';
  const isSignals = activeTab === 'signals' || activeTab === 'feel';
  const isPayloads = activeTab === 'payloads';
  const isTimeline = activeTab === 'timeline' || activeTab === 'verify';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#060b17]/95 backdrop-blur-xl border-t border-sky-500/20 pb-safe shadow-[0_-4px_25px_rgba(0,0,0,0.7)]">
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around h-14 px-2">
        {/* 1. OVERVIEW TAB */}
        <button
          onClick={() => onTabChange('overview')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all duration-200 ${
            isOverview
              ? 'text-sky-300 font-bold bg-sky-500/15 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          aria-label="Overview Tab"
        >
          <Crosshair className={`h-4 w-4 ${isOverview ? 'stroke-[2.5px] text-sky-400' : ''}`} />
          <span className="text-[9px] mt-0.5 tracking-wider font-mono">OVERVIEW</span>
        </button>

        {/* 2. SIGNALS TAB */}
        <button
          onClick={() => onTabChange('signals')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all duration-200 ${
            isSignals
              ? 'text-sky-300 font-bold bg-sky-500/15 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          aria-label="Signals Tab"
        >
          <Activity className={`h-4 w-4 ${isSignals ? 'stroke-[2.5px] text-sky-400' : ''}`} />
          <span className="text-[9px] mt-0.5 tracking-wider font-mono">SIGNALS</span>
        </button>

        {/* 3. PAYLOADS / AUDIT TAB */}
        <button
          onClick={() => onTabChange('payloads')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all duration-200 ${
            isPayloads
              ? 'text-sky-300 font-bold bg-sky-500/15 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          aria-label="Payloads and Audit Tab"
        >
          <Layers className={`h-4 w-4 ${isPayloads ? 'stroke-[2.5px] text-sky-400' : ''}`} />
          <span className="text-[9px] mt-0.5 tracking-wider font-mono">AUDIT</span>
        </button>

        {/* 4. TIMELINE TAB */}
        <button
          onClick={() => onTabChange('timeline')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all duration-200 ${
            isTimeline
              ? 'text-sky-300 font-bold bg-sky-500/15 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          aria-label="Timeline Tab"
        >
          <Clock className={`h-4 w-4 ${isTimeline ? 'stroke-[2.5px] text-sky-400' : ''}`} />
          <span className="text-[9px] mt-0.5 tracking-wider font-mono">TIMELINE</span>
        </button>
      </div>
    </nav>
  );
}
