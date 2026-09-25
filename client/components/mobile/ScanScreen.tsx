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
  Bell,
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

interface ScanScreenProps {
  overrideCaseId?: string | null;
  onNavigateToFeel?: () => void;
  onNavigateToVerify?: () => void;
}

export function ScanScreen({
  overrideCaseId,
  onNavigateToFeel,
  onNavigateToVerify,
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

  const hasTriggeredAlert = useMemo(() => {
    return caseDetail?.threshold_alerts?.some((a) => a.is_active && a.triggered_state === 'TRIGGERED');
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

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto px-4">
      {/* SECTION 1: LOCATION STATUS CARD */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Device Location
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={requestLocation}
              disabled={locationStatus === 'loading'}
              className="h-7 text-xs px-2.5 gap-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${locationStatus === 'loading' ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Location Status Message */}
          {locationStatus === 'loading' && (
            <p className="text-xs text-amber-500 font-medium animate-pulse flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 animate-spin" />
              Acquiring GPS location lock...
            </p>
          )}

          {locationStatus === 'granted' && location && (
            <div className="flex items-center justify-between bg-muted/40 rounded-lg p-2.5 border border-border/40">
              <div className="space-y-0.5">
                <p className="text-xs font-mono font-medium text-foreground">
                  {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                </p>

                <p className="text-[10px] text-muted-foreground">
                  Accuracy: ±{Math.round(location.accuracy || 0)}m
                </p>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </span>
            </div>
          )}

          {locationStatus === 'denied' && (
            <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Location Permission Denied
              </p>
              <p className="text-[11px] text-muted-foreground">
                Showing selected TRACE investigation. Grant GPS permission to auto-detect nearby cases.
              </p>
            </div>
          )}

          {locationStatus === 'unavailable' && (
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5">
              <p className="font-medium">{locationError || 'GPS location unavailable.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: CASE SELECTION */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Radar className="h-3.5 w-3.5 text-primary" />
            TRACE Investigation
          </label>
          <span className="text-[11px] text-muted-foreground font-mono">
            {cases.length} case{cases.length === 1 ? '' : 's'} available
          </span>
        </div>

        {cases.length > 0 && (
          <select
            value={selectedCaseId || ''}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {cases.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} — {c.event_type.toUpperCase()} ({c.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* SECTION 3: API ERROR / RETRY */}
      {apiError && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-4 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-destructive">Backend Server Unreachable</h3>
              <p className="text-[11px] text-muted-foreground">{apiError}</p>
            </div>
            <Button size="sm" variant="outline" onClick={loadCaseList} className="h-8 text-xs">
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SECTION 4: LOADING SKELETON */}
      {loadingCases && (
        <Card className="border-border/50 animate-pulse">
          <CardContent className="p-6 space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 5: SELECTED CASE CARD */}
      {!loadingCases && !apiError && caseDetail && (
        <Card className="border-primary/30 bg-gradient-to-b from-card to-card/80 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                {caseDetail.case_id}
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAlertModalOpen(true)}
                  className={`h-6 text-[10px] px-2 gap-1 ${
                    hasTriggeredAlert
                      ? 'border-amber-500/50 text-amber-500 bg-amber-500/10 animate-pulse font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Configure Anomaly Threshold Alert"
                >
                  <BellRing className="h-3 w-3" />
                  {hasTriggeredAlert ? 'EXCEEDED' : 'Alert'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareCaseLink}
                  className="h-6 text-[10px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                  title="Copy Web ↔ Mobile Case Link"
                >
                  {copiedLink ? <Check className="h-3 w-3 text-emerald-500" /> : <Share2 className="h-3 w-3" />}
                  {copiedLink ? 'Copied' : 'Share Link'}
                </Button>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    caseDetail.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  ● {caseDetail.status}
                </span>
              </div>
            </div>

            <CardTitle className="text-lg font-bold text-foreground capitalize mt-2 flex items-center gap-2">
              {caseDetail.event_type}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Observation Start: {new Date(caseDetail.observation_start).toLocaleDateString()}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-2 space-y-4">
            {/* GRID METRICS */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* NISAR CHANGE MEASUREMENT */}
              <div className="bg-muted/30 border border-border/50 rounded-lg p-2.5 space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Activity className="h-3 w-3 text-primary" />
                  NISAR Change
                </span>

                {primaryNisarMeasurement?.delta_backscatter != null ? (
                  <p className="text-sm font-bold font-mono text-foreground">
                    {primaryNisarMeasurement.delta_backscatter > 0 ? '+' : ''}
                    {primaryNisarMeasurement.delta_backscatter.toFixed(2)} dB
                  </p>
                ) : (
                  <p className="text-[11px] font-medium text-muted-foreground italic">
                    Measurement unavailable
                  </p>
                )}
              </div>

              {/* DISTANCE FROM USER */}
              <div className="bg-muted/30 border border-border/50 rounded-lg p-2.5 space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Compass className="h-3 w-3 text-primary" />
                  Distance
                </span>

                {distanceToUser != null ? (
                  <p className="text-sm font-bold font-mono text-foreground">{distanceToUser} km</p>
                ) : (
                  <p className="text-[11px] font-medium text-muted-foreground italic">
                    {locationStatus === 'granted' ? 'Location centroid unknown' : 'GPS disabled'}
                  </p>
                )}
              </div>
            </div>

            {/* QUICK ACTIONS FOR FEEL & VERIFY */}
            <div className="grid grid-cols-2 gap-2">
              {onNavigateToFeel && (
                <Button
                  variant="outline"
                  onClick={onNavigateToFeel}
                  className="h-9 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Activity className="h-3.5 w-3.5" />
                  FEEL Signal
                </Button>
              )}

              {onNavigateToVerify && (
                <Button
                  variant="outline"
                  onClick={onNavigateToVerify}
                  className="h-9 text-xs gap-1.5 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  VERIFY Ground
                </Button>
              )}
            </div>

            {/* LOCATION COORDINATES */}
            {selectedCentroid && (
              <div className="text-xs flex items-center justify-between border-t border-border/40 pt-2 text-muted-foreground">
                <span className="flex items-center gap-1 text-[11px]">
                  <MapPin className="h-3 w-3 text-primary" />
                  AOI Centroid:
                </span>
                <span className="font-mono text-[11px] font-medium text-foreground">
                  {selectedCentroid.latitude.toFixed(4)}°, {selectedCentroid.longitude.toFixed(4)}°
                </span>
              </div>
            )}

            {/* PRIMARY ACTION BUTTON */}
            <Button
              className="w-full h-10 text-xs font-bold uppercase tracking-wider gap-2 shadow-sm"
              onClick={() => setIsModalOpen(true)}
            >
              Open Full Investigation State
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SECTION 6: NO CASES EMPTY STATE */}
      {!loadingCases && !apiError && cases.length === 0 && (
        <Card className="border-border/60 text-center">
          <CardContent className="p-8 space-y-3">
            <Radar className="h-10 w-10 text-muted-foreground mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">No TRACE Investigation Nearby</h3>
              <p className="text-xs text-muted-foreground">
                No active satellite investigation cases found in the backend database.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 7: INVESTIGATION DETAIL MODAL / DRAWER */}
      {isModalOpen && caseDetail && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col justify-end sm:justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full mx-auto max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <span className="text-[10px] font-mono font-semibold text-primary uppercase">
                  {caseDetail.case_id}
                </span>
                <h2 className="text-base font-bold text-foreground capitalize">
                  {caseDetail.event_type} Investigation
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Overview */}
              <div className="space-y-2">
                <h4 className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3 text-primary" />
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
                    <Activity className="h-3 w-3 text-primary" />
                    Backend NISAR Measurements
                  </h4>
                  {caseDetail.nisar_measurements.map((m) => (
                    <div
                      key={m.id}
                      className="bg-card border border-border/60 p-3 rounded-lg space-y-1 font-mono text-[11px]"
                    >
                      <div className="flex justify-between font-semibold">
                        <span>{m.product_id}</span>
                        <span className="text-primary">
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

              {/* Timeline */}
              {timeline && timeline.events.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    Chronological Timeline
                  </h4>
                  <div className="space-y-2 border-l-2 border-primary/30 ml-2 pl-3">
                    {timeline.events.map((evt) => (
                      <div key={evt.id} className="relative space-y-0.5">
                        <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-primary" />
                        <p className="font-semibold text-foreground">{evt.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(evt.timestamp).toLocaleString()} ({evt.phase.toUpperCase()})
                        </p>
                      </div>
                    ))}
                  </div>
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
      {/* SECTION 8: THRESHOLD ALERT MODAL */}
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
