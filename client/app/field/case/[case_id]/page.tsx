'use client';

import React, { use, useState, useEffect } from 'react';
import { fetchHealthStatus } from '@/lib/api';
import { useGeolocation } from '@/lib/useGeolocation';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileNav, type MobileTab } from '@/components/mobile/MobileNav';
import { ScanScreen } from '@/components/mobile/ScanScreen';
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
  const [activeTab, setActiveTab] = useState<MobileTab>('scan');

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20">
      {/* Header */}
      <MobileHeader locationStatus={locationStatus} serverStatus={serverStatus} />

      {/* Main Tab Content */}
      <main className="flex-1 pt-4 pb-20">
        {activeTab === 'scan' && <ScanScreen overrideCaseId={caseId} />}
        {activeTab === 'feel' && (
          <FeelScreen initialCaseId={caseId} onNavigateToVerify={() => setActiveTab('verify')} />
        )}
        {activeTab === 'verify' && (
          <VerifyScreen initialCaseId={caseId} onSuccess={() => setActiveTab('scan')} />
        )}
      </main>

      {/* Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
