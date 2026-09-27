'use client';

import React, { use, useState, useEffect } from 'react';
import { fetchHealthStatus } from '@/lib/api';
import { useGeolocation } from '@/lib/useGeolocation';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileNav, type MobileTab } from '@/components/mobile/MobileNav';
import { ScanScreen, type MobileScanView } from '@/components/mobile/ScanScreen';
import { FeelScreen } from '@/components/mobile/FeelScreen';
import { VerifyScreen } from '@/components/mobile/VerifyScreen';

interface PageProps {
  params: Promise<{ case_id: string }>;
}

export default function DeepLinkCasePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.case_id;

  const { status: locationStatus } = useGeolocation();
  const [serverStatus, setServerStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [activeTab, setActiveTab] = useState<MobileTab>('overview');

  useEffect(() => {
    let isMounted = true;
    fetchHealthStatus()
      .then(() => {
        if (isMounted) setServerStatus('connected');
      })
      .catch(() => {
        if (isMounted) setServerStatus('disconnected');
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
      {/* Header */}
      <MobileHeader locationStatus={locationStatus} serverStatus={serverStatus} />

      {/* Main Tab Content */}
      <main className="flex-1 pt-2 pb-20">
        {isScanScreenView && (
          <ScanScreen
            overrideCaseId={caseId}
            currentMobileView={currentMobileScanView}
            onMobileViewChange={(v) => setActiveTab(v)}
            onNavigateToFeel={() => setActiveTab('feel')}
            onNavigateToVerify={() => setActiveTab('verify')}
          />
        )}
        {activeTab === 'feel' && (
          <FeelScreen initialCaseId={caseId} onNavigateToVerify={() => setActiveTab('verify')} />
        )}
        {activeTab === 'verify' && (
          <VerifyScreen initialCaseId={caseId} onSuccess={() => setActiveTab('overview')} />
        )}
      </main>

      {/* Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
