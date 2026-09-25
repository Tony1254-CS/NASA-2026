'use client';

import React from 'react';
import { Radar, Navigation, Server } from 'lucide-react';
import type { LocationStatus } from '@/lib/useGeolocation';

import { CloudOff } from 'lucide-react';
import { useOfflineSync } from '@/lib/useOfflineSync';

interface MobileHeaderProps {
  locationStatus: LocationStatus;
  serverStatus: 'loading' | 'connected' | 'disconnected';
}

export function MobileHeader({ locationStatus, serverStatus }: MobileHeaderProps) {
  const { pendingCount, isSyncing } = useOfflineSync();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#060b17]/85 border-b border-sky-500/20 px-4 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-400/30 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
            <Radar className="h-4.5 w-4.5 animate-pulse text-sky-400" />
            <div className="absolute inset-0 rounded-lg bg-sky-400/5 animate-ping pointer-events-none" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5 font-mono">
              TRACE <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase tracking-widest shadow-[0_0_8px_rgba(56,189,248,0.2)]">FIELD</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse" />
              Temporal Radar Assessment
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5">
          {/* OFFLINE QUEUE PILL */}
          {pendingCount > 0 && (
            <div
              className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
              title={`${pendingCount} offline observations pending sync`}
            >
              <CloudOff className="h-3 w-3 text-amber-400 animate-pulse" />
              <span>{pendingCount} PENDING</span>
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
            <span className="hidden sm:inline">
              {locationStatus === 'granted' ? 'GPS READY' : locationStatus === 'loading' ? 'LOCATING...' : 'GPS OFF'}
            </span>
          </div>

          {/* Backend Status Indicator */}
          <div
            className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border bg-slate-900/80 border-slate-800 text-slate-300 shadow-sm"
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
            <span className="hidden xs:inline text-[9px] text-slate-400 font-mono uppercase">
              {serverStatus === 'connected' ? 'SYS: OK' : serverStatus}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
