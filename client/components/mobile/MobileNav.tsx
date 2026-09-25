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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 pb-safe">
      <div className="max-w-xl mx-auto flex items-center justify-around h-14 px-2">
        {/* SCAN TAB */}
        <button
          onClick={() => onTabChange('scan')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
            activeTab === 'scan'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Scan Tab"
        >
          <Crosshair className={`h-4.5 w-4.5 ${activeTab === 'scan' ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">SCAN</span>
        </button>

        {/* PULSE TAB */}
        <button
          onClick={() => onTabChange('pulse')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
            activeTab === 'pulse'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Global Pulse Tab"
        >
          <Globe className={`h-4.5 w-4.5 ${activeTab === 'pulse' ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">PULSE</span>
        </button>

        {/* CHAR GUARDIAN TAB */}
        <button
          onClick={() => onTabChange('char')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
            activeTab === 'char'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Char Guardian Tab"
        >
          <Anchor className={`h-4.5 w-4.5 ${activeTab === 'char' ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">CHAR</span>
        </button>

        {/* FEEL TAB */}
        <button
          onClick={() => onTabChange('feel')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
            activeTab === 'feel'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Feel Tab"
        >
          <Activity className={`h-4.5 w-4.5 ${activeTab === 'feel' ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">FEEL</span>
        </button>

        {/* VERIFY TAB */}
        <button
          onClick={() => onTabChange('verify')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
            activeTab === 'verify'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Verify Tab"
        >
          <ShieldCheck className={`h-4.5 w-4.5 ${activeTab === 'verify' ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">VERIFY</span>
        </button>
      </div>
    </nav>
  );
}

