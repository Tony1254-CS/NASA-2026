'use client';

import React, { useEffect, useState } from 'react';
import { fetchHealthStatus } from '@/lib/api';
import { useGeolocation } from '@/lib/useGeolocation';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileNav, type MobileTab } from '@/components/mobile/MobileNav';

// Screens
import { OrbitScreen } from '@/components/screens/OrbitScreen';
import { FringeScreen } from '@/components/screens/FringeScreen';
import { SignalScreen } from '@/components/screens/SignalScreen';
import { VerifyScreen } from '@/components/screens/VerifyScreen';
import { RiskScreen } from '@/components/screens/RiskScreen';

export default function HomePage() {
  const { status: locationStatus } = useGeolocation();
  const [serverStatus, setServerStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [activeTab, setActiveTab] = useState<MobileTab>('orbit');

  useEffect(() => {
    let isMounted = true;

    fetchHealthStatus()
      .then(() => {
        if (isMounted) {
          setServerStatus('connected');
        }
      })
      .catch(() => {
        if (isMounted) {
          setServerStatus('disconnected');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#060911] text-foreground flex flex-col antialiased selection:bg-primary/20 overflow-x-hidden">
      {/* 6. TRACE FIELD Header */}
      <MobileHeader
        locationStatus={locationStatus}
        serverStatus={serverStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-safe-content">
        {activeTab === 'orbit' && <OrbitScreen />}
        {activeTab === 'fringe' && <FringeScreen />}
        {activeTab === 'signal' && <SignalScreen />}
        {activeTab === 'verify' && <VerifyScreen />}
        {activeTab === 'risk' && <RiskScreen />}
      </main>

      {/* 12. TRACE FIELD Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
