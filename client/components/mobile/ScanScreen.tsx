'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Radar,
  Calendar,
  Layers,
  Activity,
  Compass,
  CheckCircle2,
  X,
  Share2,
  ShieldCheck,
  Check,
  BellRing,
  Clock,
  Radio,
  Crosshair,
} from 'lucide-react';
import { ThresholdAlertModal } from '@/components/mobile/ThresholdAlertModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useGeolocation,
  calculateDistance,
  getGeometryCentroid,
} from '@/lib/useGeolocation';
import {
  fetchCases,
  fetchCaseDetail,
  fetchCaseTimeline,
  type CaseListItem,
  type CaseDetailResponse,
  type TimelineResponse,
} from '@/lib/api';
import { OverviewView } from '@/components/mobile/OverviewView';
import { SignalsView } from '@/components/mobile/SignalsView';
import { PayloadAuditView } from '@/components/mobile/PayloadAuditView';
import { TimelineView } from '@/components/mobile/TimelineView';
import { isBrowserRenderableImageUri } from '@/components/scientific/OpticalSarSwipeComparison';

export type MobileScanView = 'overview' | 'signals' | 'payloads' | 'timeline';

interface ScanScreenProps {
  overrideCaseId?: string | null;
  onNavigateToFeel?: () => void;
  onNavigateToVerify?: () => void;
  currentMobileView?: MobileScanView;
  onMobileViewChange?: (view: MobileScanView) => void;
}

export function ScanScreen({
  overrideCaseId,
  onNavigateToFeel,
  onNavigateToVerify,
  currentMobileView,
  onMobileViewChange,
}: ScanScreenProps) {
  const { location, status: locationStatus, error: locationError, requestLocation } = useGeolocation();

  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(overrideCaseId || null);
  const [caseDetail, setCaseDetail] = useState<CaseDetailResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);

  const [loadingCases, setLoadingCases] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Local segmented tab state (defaults to 'overview')
  const [localActiveView, setLocalActiveView] = useState<MobileScanView>('overview');

  const activeView = currentMobileView || localActiveView;

  const handleViewChange = (view: MobileScanView) => {
    setLocalActiveView(view);
    onMobileViewChange?.(view);
  };

  // 1. Fetch case list on mount
  const loadCaseList = async () => {
    setLoadingCases(true);
    setApiError(null);
    try {
      const res = await fetchCases(1, 50);
      setCases(res.items);
      if (res.items.length > 0) {
        setSelectedCaseId((prev) => overrideCaseId || prev || res.items[0].case_id);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to connect to TRACE backend server.');
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    loadCaseList();
  }, [overrideCaseId]);

  // 2. Automatically pick nearest case if user location is available and no override provided
  useEffect(() => {
    if (location && cases.length > 0 && !overrideCaseId) {
      let nearestId = cases[0].case_id;
      let minDistance = Infinity;

      for (const item of cases) {
        const centroid = getGeometryCentroid(item.geometry);
        if (centroid) {
          const dist = calculateDistance(
            location.latitude,
            location.longitude,
            centroid.latitude,
            centroid.longitude
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearestId = item.case_id;
          }
        }
      }

      if (nearestId) {
        setSelectedCaseId(nearestId);
      }
    }
  }, [location, cases, overrideCaseId]);

  // 3. Fetch case detail & timeline whenever selectedCaseId changes
  useEffect(() => {
    if (!selectedCaseId) return;

    let isMounted = true;
    setLoadingDetail(true);

    Promise.all([
      fetchCaseDetail(selectedCaseId).catch(() => null),
      fetchCaseTimeline(selectedCaseId).catch(() => null),
    ]).then(([detailRes, timelineRes]) => {
      if (isMounted) {
        setCaseDetail(detailRes);
        setTimeline(timelineRes);
        setLoadingDetail(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCaseId]);

  // Calculate distance to selected case centroid
  const selectedCentroid = useMemo(() => {
    if (!caseDetail) return null;
    return getGeometryCentroid(caseDetail.geometry);
  }, [caseDetail]);

  const distanceToUser = useMemo(() => {
    if (!location || !selectedCentroid) return null;
    return calculateDistance(
      location.latitude,
      location.longitude,
      selectedCentroid.latitude,
      selectedCentroid.longitude
    );
  }, [location, selectedCentroid]);

  // Primary NISAR measurement
  const primaryNisarMeasurement = useMemo(() => {
    if (!caseDetail || !caseDetail.nisar_measurements || caseDetail.nisar_measurements.length === 0) {
      return null;
    }
    return caseDetail.nisar_measurements[0];
  }, [caseDetail]);

  // Data-aware Optical Image Candidate from backend API records
  const opticalUriCandidate = useMemo(() => {
    if (!caseDetail) return null;

    // 1. Check ground field observations
    if (caseDetail.field_observations && caseDetail.field_observations.length > 0) {
      const photoObs = caseDetail.field_observations.find((fo) => isBrowserRenderableImageUri(fo.photo_reference));
      if (photoObs?.photo_reference) return photoObs.photo_reference;
    }

    // 2. Check evidence records for optical satellite imagery
    if (caseDetail.evidence && caseDetail.evidence.length > 0) {
      const opticalEv = caseDetail.evidence.find(
        (e) =>
          isBrowserRenderableImageUri(e.visualization_uri) &&
          (e.role === 'optical' || ['modis', 'landsat', 'sentinel-2', 'optical', 'viirs'].includes(e.source_type?.toLowerCase() || ''))
      );
      if (opticalEv?.visualization_uri) return opticalEv.visualization_uri;

      // Fall back to any valid evidence visualization URI
      const anyValidEv = caseDetail.evidence.find((e) => isBrowserRenderableImageUri(e.visualization_uri));
      if (anyValidEv?.visualization_uri) return anyValidEv.visualization_uri;
    }

    return null;
  }, [caseDetail]);

  // Data-aware SAR Image Candidate from backend API records
  const sarUriCandidate = useMemo(() => {
    if (!caseDetail) return null;

    // 1. Check primary NISAR measurement raster reference (if browser-renderable HTTP/HTTPS URL)
    if (primaryNisarMeasurement?.raster_reference && isBrowserRenderableImageUri(primaryNisarMeasurement.raster_reference)) {
      return primaryNisarMeasurement.raster_reference;
    }

    // 2. Check evidence records for SAR/NISAR browser-renderable imagery
    if (caseDetail.evidence && caseDetail.evidence.length > 0) {
      const sarEv = caseDetail.evidence.find(
        (e) =>
          isBrowserRenderableImageUri(e.visualization_uri) &&
          (e.role === 'sar' || ['nisar', 'sentinel-1', 'sar'].includes(e.source_type?.toLowerCase() || ''))
      );
      if (sarEv?.visualization_uri) return sarEv.visualization_uri;
    }

    return null;
  }, [caseDetail, primaryNisarMeasurement]);

  const hasTriggeredAlert = useMemo(() => {
    return caseDetail?.threshold_alerts?.some((a) => a.is_active && a.triggered_state === 'TRIGGERED') || false;
  }, [caseDetail]);

  const handleShareCaseLink = () => {
    if (!selectedCaseId) return;
    const deepLinkUrl = `${window.location.origin}/field/case/${encodeURIComponent(selectedCaseId)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(deepLinkUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const navSegments: Array<{ id: MobileScanView; label: string; icon: React.ElementType }> = [
    { id: 'overview', label: 'OVERVIEW', icon: Crosshair },
    { id: 'signals', label: 'SIGNALS', icon: Activity },
    { id: 'payloads', label: 'PAYLOADS', icon: Layers },
    { id: 'timeline', label: 'TIMELINE', icon: Calendar },
  ];

  return (
    <div className="space-y-3 pb-24 max-w-md md:max-w-4xl mx-auto px-3 sm:px-4">
      {/* 5. MOBILE SEGMENTED VIEW CONTROLS */}
      <div className="glass-panel border-sky-500/25 p-1 rounded-xl shadow-lg flex items-center justify-between gap-1 relative overflow-hidden">
        {navSegments.map((seg) => {
          const Icon = seg.icon;
          const isActive = activeView === seg.id;
          return (
            <button
              key={seg.id}
              onClick={() => handleViewChange(seg.id)}
              className={`flex-1 py-1.5 px-1 rounded-lg text-center font-mono font-bold text-[10px] tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`h-3 w-3 ${isActive ? 'text-slate-950 stroke-[2.5px]' : 'text-slate-400'}`} />
              <span>{seg.label}</span>
            </button>
          );
        })}
      </div>

      {/* API ERROR / RETRY */}
      {apiError && (
        <Card className="border-rose-500/30 bg-rose-950/20 backdrop-blur-md">
          <CardContent className="p-4 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold font-mono text-rose-300 uppercase">Backend Server Unreachable</h3>
              <p className="text-[11px] text-slate-400">{apiError}</p>
            </div>
            <Button size="sm" variant="outline" onClick={loadCaseList} className="h-8 text-xs font-mono border-rose-500/40 text-rose-300">
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* LOADING SKELETON */}
      {loadingCases && (
        <Card className="border-sky-500/20 bg-slate-950/60 backdrop-blur-md animate-pulse">
          <CardContent className="p-6 space-y-4">
            <div className="h-4 bg-slate-800 rounded w-1/3" />
            <div className="h-8 bg-slate-800 rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-800 rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* NO CASES FOUND EMPTY STATE */}
      {!loadingCases && !apiError && cases.length === 0 && (
        <Card className="glass-panel border-sky-500/20 text-center p-8">
          <CardContent className="p-4 space-y-3">
            <Radar className="h-10 w-10 text-sky-400 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-mono text-slate-200 uppercase">No TRACE Investigation Nearby</h3>
              <p className="text-xs text-slate-400 leading-normal">
                No active satellite investigation cases found in the backend database.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FOUR SEGMENTED VIEWS */}
      {!loadingCases && !apiError && caseDetail && (
        <>
          {/* VIEW 1: OVERVIEW */}
          {activeView === 'overview' && (
            <OverviewView
              location={location}
              locationStatus={locationStatus}
              locationError={locationError}
              requestLocation={requestLocation}
              cases={cases}
              selectedCaseId={selectedCaseId}
              onSelectCaseId={setSelectedCaseId}
              caseDetail={caseDetail}
              primaryNisarMeasurement={primaryNisarMeasurement}
              selectedCentroid={selectedCentroid}
              distanceToUser={distanceToUser}
              hasTriggeredAlert={hasTriggeredAlert}
              onOpenAlertModal={() => setIsAlertModalOpen(true)}
              onShareCase={handleShareCaseLink}
              copiedLink={copiedLink}
              opticalUriCandidate={opticalUriCandidate}
              sarUriCandidate={sarUriCandidate}
              onNavigateToFeel={onNavigateToFeel}
              onNavigateToVerify={onNavigateToVerify}
              onOpenDetailModal={() => setIsModalOpen(true)}
              onSelectPayload={() => handleViewChange('payloads')}
            />
          )}

          {/* VIEW 2: SIGNALS */}
          {activeView === 'signals' && (
            <SignalsView
              caseDetail={caseDetail}
              primaryNisarMeasurement={primaryNisarMeasurement}
              onNavigateToFeel={onNavigateToFeel}
            />
          )}

          {/* VIEW 3: PAYLOADS / AUDIT */}
          {activeView === 'payloads' && (
            <PayloadAuditView
              caseId={selectedCaseId || ''}
              caseDetail={caseDetail}
            />
          )}

          {/* VIEW 4: TIMELINE */}
          {activeView === 'timeline' && (
            <TimelineView
              timeline={timeline}
              observationStart={caseDetail?.observation_start}
              observationEnd={caseDetail?.observation_end}
              onNavigateToVerify={onNavigateToVerify}
            />
          )}
        </>
      )}

      {/* INVESTIGATION DETAIL MODAL / DRAWER */}
      {isModalOpen && caseDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex flex-col justify-end sm:justify-center p-4">
          <div className="glass-panel border-sky-500/30 rounded-2xl max-w-md w-full mx-auto max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
            <div className="tech-corner-tl" />
            <div className="tech-corner-tr" />

            {/* Modal Header */}
            <div className="p-4 border-b border-sky-500/20 flex items-center justify-between bg-slate-900/60">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-300 uppercase tracking-widest bg-sky-500/15 px-2 py-0.5 rounded border border-sky-400/30">
                  CASE // {caseDetail.case_id}
                </span>
                <h2 className="text-base font-extrabold text-white capitalize mt-1 font-mono">
                  {caseDetail.event_type} Investigation
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0 rounded-full border-sky-500/30 text-sky-300 hover:bg-sky-500/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Overview */}
              <div className="space-y-2">
                <h4 className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3 text-sky-400" />
                  Investigation Overview
                </h4>
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-lg border border-border/40">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Status</span>
                    <p className="font-semibold capitalize">{caseDetail.status}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Field Observations</span>
                    <p className="font-semibold">{caseDetail.field_observations.length} Recorded</p>
                  </div>
                </div>
              </div>

              {/* Scientific Measurements */}
              {caseDetail.nisar_measurements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3 text-sky-400" />
                    Backend NISAR Measurements
                  </h4>
                  {caseDetail.nisar_measurements.map((m) => (
                    <div
                      key={m.id}
                      className="bg-card border border-border/60 p-3 rounded-lg space-y-1 font-mono text-[11px]"
                    >
                      <div className="flex justify-between font-semibold">
                        <span>{m.product_id}</span>
                        <span className="text-sky-400">
                          {m.delta_backscatter != null ? `${m.delta_backscatter} dB` : 'N/A'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-sans">
                        Observed: {new Date(m.observation_time).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Recorded Ground Field Observations */}
              {caseDetail.field_observations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold uppercase tracking-wider text-[10px] text-emerald-500 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Human Ground Observations ({caseDetail.field_observations.length})
                  </h4>
                  {caseDetail.field_observations.map((fo) => (
                    <div
                      key={fo.id}
                      className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg space-y-1 text-[11px]"
                    >
                      <p className="font-semibold text-foreground">{fo.note}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Ref: {fo.photo_reference || 'Ground Observation'} — {new Date(fo.observed_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-border bg-muted/20">
              <Button
                variant="outline"
                className="w-full h-9 text-xs"
                onClick={() => setIsModalOpen(false)}
              >
                Close Investigation View
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* THRESHOLD ALERT MODAL */}
      <ThresholdAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        caseId={selectedCaseId}
        currentDeltaBackscatter={primaryNisarMeasurement?.delta_backscatter}
        currentAffectedArea={primaryNisarMeasurement?.affected_area}
        onAlertSaved={() => {
          if (selectedCaseId) {
            fetchCaseDetail(selectedCaseId).then(setCaseDetail).catch(() => null);
          }
        }}
      />
    </div>
  );
}
