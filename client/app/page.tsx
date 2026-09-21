'use client';

import React, { useEffect, useState } from 'react';
import { fetchHealthStatus } from '@/lib/api';
import { useGeolocation } from '@/lib/useGeolocation';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileNav, type MobileTab } from '@/components/mobile/MobileNav';
import { ScanScreen } from '@/components/mobile/ScanScreen';
import { FeelScreen } from '@/components/mobile/FeelScreen';
import { VerifyScreen } from '@/components/mobile/VerifyScreen';

export default function HomePage() {
  const { status: locationStatus } = useGeolocation();
  const [serverStatus, setServerStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [activeTab, setActiveTab] = useState<MobileTab>('scan');
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20">
      {/* TRACE FIELD Header */}
      <MobileHeader locationStatus={locationStatus} serverStatus={serverStatus} />

      {/* Main Content Area */}
      <main className="flex-1 pt-4 pb-20">
        {activeTab === 'scan' && (
          <ScanScreen
            onNavigateToFeel={() => setActiveTab('feel')}
            onNavigateToVerify={() => setActiveTab('verify')}
          />
        )}

        {activeTab === 'feel' && (
          <FeelScreen
            initialCaseId={currentCaseId}
            onNavigateToVerify={() => setActiveTab('verify')}
          />
        )}

        {activeTab === 'verify' && (
          <VerifyScreen
            initialCaseId={currentCaseId}
            onSuccess={() => setActiveTab('scan')}
          />
        )}
      </main>

      {/* TRACE FIELD Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
