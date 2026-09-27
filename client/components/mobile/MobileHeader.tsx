'use client';

import React, { useState, useEffect } from 'react';
import {
  Radar,
  Navigation,
  Server,
  CloudOff,
  Menu,
  X,
  Crosshair,
  Globe,
  Anchor,
  Activity,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import type { LocationStatus } from '@/lib/useGeolocation';
import { useOfflineSync } from '@/lib/useOfflineSync';
import type { MobileTab } from '@/components/mobile/MobileNav';

interface MobileHeaderProps {
  locationStatus: LocationStatus;
  serverStatus: 'loading' | 'connected' | 'disconnected';
  activeTab?: MobileTab;
  onTabChange?: (tab: MobileTab) => void;
}

const MISSION_MODULES: Array<{
  id: MobileTab;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    id: 'scan',
    title: 'SCAN',
    description: 'Detect change',
    icon: Crosshair,
  },
  {
    id: 'pulse',
    title: 'PULSE',
    description: 'Explore activity',
    icon: Globe,
  },
  {
    id: 'char',
    title: 'CHAR',
    description: 'Characterize change',
    icon: Anchor,
  },
  {
    id: 'feel',
    title: 'FEEL',
    description: 'Experience change',
    icon: Activity,
  },
  {
    id: 'verify',
    title: 'VERIFY',
    description: 'Review evidence',
    icon: ShieldCheck,
  },
];

export function MobileHeader({
  locationStatus,
  serverStatus,
  activeTab,
  onTabChange,
}: MobileHeaderProps) {
  const { pendingCount } = useOfflineSync();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Close drawer on Escape key press
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  // Determine active mission module
  const activeModuleId: MobileTab =
    activeTab === 'pulse'
      ? 'pulse'
      : activeTab === 'char'
      ? 'char'
      : activeTab === 'feel'
      ? 'feel'
      : activeTab === 'verify'
      ? 'verify'
      : 'scan';

  const handleSelectModule = (moduleId: MobileTab) => {
    if (onTabChange) {
      if (moduleId === 'scan') {
        onTabChange('overview');
      } else {
        onTabChange(moduleId);
      }
    }
    setMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#060b17]/90 border-b border-sky-500/20 px-3 sm:px-4 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* LEFT: TRACE FIELD Brand */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-400/30 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)] shrink-0">
              <Radar className="h-4.5 w-4.5 animate-pulse text-sky-400" />
              <div className="absolute inset-0 rounded-lg bg-sky-400/5 animate-ping pointer-events-none" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5 font-mono">
                TRACE{' '}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase tracking-widest shadow-[0_0_8px_rgba(56,189,248,0.2)]">
                  FIELD
                </span>
              </h1>
              <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse" />
                <span className="hidden xs:inline">Temporal Radar Assessment</span>
                <span className="xs:hidden">Sentinel Radar</span>
              </p>
            </div>
          </div>

          {/* RIGHT: Status Pills + Hamburger Menu Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* OFFLINE QUEUE PILL */}
            {pendingCount > 0 && (
              <div
                className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                title={`${pendingCount} offline observations pending sync`}
              >
                <CloudOff className="h-3 w-3 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">{pendingCount} PENDING</span>
              </div>
            )}

            {/* GPS Status Pill */}
            <div
              className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-slate-900/80 border-slate-800 text-slate-300 shadow-sm"
              title={`GPS Status: ${locationStatus}`}
            >
              <Navigation
                className={`h-3 w-3 ${
                  locationStatus === 'granted'
                    ? 'text-emerald-400 fill-emerald-400/20'
                    : locationStatus === 'loading'
                    ? 'text-amber-400 animate-spin'
                    : 'text-slate-500'
                }`}
              />
              <span className="hidden md:inline">
                {locationStatus === 'granted'
                  ? 'GPS READY'
                  : locationStatus === 'loading'
                  ? 'LOCATING...'
                  : 'GPS OFF'}
              </span>
            </div>

            {/* Backend Status Indicator */}
            <div
              className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-slate-900/80 border-slate-800 text-slate-300 shadow-sm"
              title={`Backend Status: ${serverStatus}`}
            >
              <Server className="h-3 w-3 text-slate-400" />
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  serverStatus === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : serverStatus === 'loading'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="hidden md:inline text-[9px] text-slate-400 font-mono uppercase">
                {serverStatus === 'connected' ? 'SYS: OK' : serverStatus}
              </span>
            </div>

            {/* Hamburger Menu Button */}
            {onTabChange && (
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open Mission Modules Menu"
                aria-expanded={menuOpen}
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-400/30 text-sky-400 hover:text-white hover:bg-sky-500/25 hover:border-sky-400 transition-all active:scale-95 shadow-[0_0_10px_rgba(56,189,248,0.15)] ml-1"
                title="Mission Modules"
              >
                <Menu className="h-4.5 w-4.5 text-sky-400" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE MISSION MODULES DRAWER / MODAL */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mission Modules Navigation"
          className="fixed inset-0 z-50 flex justify-end"
        >
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative w-full max-w-[320px] sm:max-w-xs bg-[#060b17] border-l border-sky-500/30 shadow-[-12px_0_40px_rgba(0,0,0,0.95)] flex flex-col h-full z-10">
            {/* Tech Decorative Corners */}
            <div className="tech-corner-tl" />
            <div className="tech-corner-bl" />

            {/* Drawer Header */}
            <div className="p-4 border-b border-sky-500/20 flex items-center justify-between bg-slate-950/70">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-widest text-sky-300 uppercase">
                    MISSION MODULES
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-400 border border-sky-400/30">
                    APP
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  Select operational mode
                </p>
              </div>

              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close Mission Menu"
                className="w-8 h-8 rounded-lg border border-slate-800 hover:border-sky-500/40 text-slate-400 hover:text-white hover:bg-sky-500/15 flex items-center justify-center transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modules List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {MISSION_MODULES.map((m) => {
                const Icon = m.icon;
                const isSelected = activeModuleId === m.id;

                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectModule(m.id)}
                    className={`w-full group relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98] ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-sky-500/30 hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Module Icon Container */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                          : 'bg-slate-900/90 text-sky-400 border-sky-500/20 group-hover:border-sky-400/50 group-hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${isSelected ? 'stroke-[2.5px]' : ''}`} />
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-xs tracking-wider ${
                            isSelected ? 'text-white' : 'text-slate-200'
                          }`}
                        >
                          {m.title}
                        </span>
                        {isSelected && (
                          <span className="text-[8px] font-mono font-semibold px-1 py-0.2 rounded bg-sky-500/25 text-sky-300 border border-sky-400/40">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {m.description}
                      </p>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-sky-300 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-3.5 border-t border-sky-500/20 bg-slate-950/70 font-mono text-[10px] text-slate-500 flex items-center justify-between">
              <span>TRACE FIELD // MISSION CONTROL</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
