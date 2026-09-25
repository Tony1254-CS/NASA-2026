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
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/50 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Radar className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
              TRACE <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wider">FIELD</span>
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium">Temporal Radar Assessment</p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          {/* OFFLINE QUEUE PILL */}
          {pendingCount > 0 && (
            <div
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30"
              title={`${pendingCount} offline observations pending sync`}
            >
              <CloudOff className="h-3 w-3 text-amber-400 animate-pulse" />
              <span>{pendingCount} Pending</span>
            </div>
          )}

          {/* GPS Status Pill */}
          <div
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border bg-muted/50"
            title={`GPS Status: ${locationStatus}`}
          >
            <Navigation
              className={`h-3 w-3 ${
                locationStatus === 'granted'
                  ? 'text-emerald-500 fill-emerald-500/20'
                  : locationStatus === 'loading'
                  ? 'text-amber-500 animate-spin'
                  : 'text-muted-foreground'
              }`}
            />
            <span className="hidden sm:inline text-xs">
              {locationStatus === 'granted' ? 'GPS Active' : locationStatus === 'loading' ? 'GPS Locating...' : 'GPS Inactive'}
            </span>
          </div>

          {/* Backend Status Indicator */}
          <div
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border bg-muted/50"
            title={`Backend Status: ${serverStatus}`}
          >
            <Server className="h-3 w-3 text-muted-foreground" />
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                serverStatus === 'connected'
                  ? 'bg-emerald-500'
                  : serverStatus === 'loading'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-destructive'
              }`}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
