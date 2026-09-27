'use client';

import React, { useEffect, useState } from 'react';
import { fetchHealthStatus } from '@/lib/api';
import { useGeolocation } from '@/lib/useGeolocation';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileNav, type MobileTab } from '@/components/mobile/MobileNav';
import { ScanScreen, type MobileScanView } from '@/components/mobile/ScanScreen';
import { FeelScreen } from '@/components/mobile/FeelScreen';
import { VerifyScreen } from '@/components/mobile/VerifyScreen';
import { GlobalPulseView } from '@/components/scientific/GlobalPulseView';
import { CharGuardianView } from '@/components/scientific/CharGuardianView';
import { HeroMissionHeader } from '@/components/mobile/HeroMissionHeader';

export default function HomePage() {
  const { status: locationStatus } = useGeolocation();
  const [serverStatus, setServerStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [activeTab, setActiveTab] = useState<MobileTab>('overview');
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);

  const handleSelectCaseFromPulse = (caseId: string) => {
    setCurrentCaseId(caseId);
    setActiveTab('overview');
  };

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

  const isScanScreenView =
    activeTab === 'scan' ||
    activeTab === 'overview' ||
    activeTab === 'signals' ||
    activeTab === 'payloads' ||
    activeTab === 'timeline';

  const currentMobileScanView: MobileScanView =
    activeTab === 'signals' || activeTab === 'payloads' || activeTab === 'timeline'
      ? activeTab
      : 'overview';

  return (
    <div className="min-h-screen bg-[#060911] text-foreground flex flex-col antialiased selection:bg-primary/20 overflow-x-hidden">
      {/* 6. TRACE FIELD Header */}
      <MobileHeader locationStatus={locationStatus} serverStatus={serverStatus} />

      {/* Main Content Area */}
      <main className="flex-1 pt-2 pb-20 space-y-2">
        {isScanScreenView && (
          <>
            {/* Mission Control Hero Explanation & Module Cards — Desktop Only to prevent mobile scrolling */}
            <div className="hidden md:block">
              <HeroMissionHeader activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <ScanScreen
              overrideCaseId={currentCaseId}
              currentMobileView={currentMobileScanView}
              onMobileViewChange={(v) => setActiveTab(v)}
              onNavigateToFeel={() => setActiveTab('feel')}
              onNavigateToVerify={() => setActiveTab('verify')}
            />
          </>
        )}

        {activeTab === 'pulse' && (
          <GlobalPulseView onSelectCase={handleSelectCaseFromPulse} />
        )}

        {activeTab === 'char' && (
          <CharGuardianView
            initialCaseId={currentCaseId}
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
            onSuccess={() => setActiveTab('overview')}
          />
        )}
      </main>

      {/* 12. TRACE FIELD Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
