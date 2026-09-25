'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  fetchCaseAlerts,
  createCaseAlert,
  updateCaseAlert,
  type ThresholdAlertResponse,
} from '@/lib/api';

interface ThresholdAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string | null;
  currentDeltaBackscatter?: number | null;
  currentAffectedArea?: number | null;
  onAlertSaved?: () => void;
}

export function ThresholdAlertModal({
  isOpen,
  onClose,
  caseId,
  currentDeltaBackscatter,
  currentAffectedArea,
  onAlertSaved,
}: ThresholdAlertModalProps) {
  const [metricName, setMetricName] = useState<'delta_backscatter' | 'affected_area'>('delta_backscatter');
  const [thresholdValue, setThresholdValue] = useState<number>(-2.0);
  const [comparison, setComparison] = useState<'less_than' | 'greater_than' | 'abs_greater_than'>('less_than');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [existingAlert, setExistingAlert] = useState<ThresholdAlertResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Determine current active measurement value based on selected metric
  const currentVal = metricName === 'delta_backscatter' ? currentDeltaBackscatter : currentAffectedArea;

  useEffect(() => {
    if (!isOpen || !caseId) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    fetchCaseAlerts(caseId)
      .then((alerts) => {
        if (alerts.length > 0) {
          const match = alerts.find((a) => a.metric_name === metricName) || alerts[0];
          setExistingAlert(match);
          setMetricName((match.metric_name as any) || 'delta_backscatter');
          setThresholdValue(match.threshold_value);
          setComparison((match.comparison as any) || 'less_than');
          setIsActive(match.is_active);
        } else {
          setExistingAlert(null);
          if (metricName === 'delta_backscatter') {
            setThresholdValue(-2.0);
            setComparison('less_than');
          } else {
            setThresholdValue(50.0);
            setComparison('greater_than');
          }
        }
      })
      .catch((err) => {
        logger_fallback(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, caseId, metricName]);

  if (!isOpen) return null;

  const logger_fallback = (err: any) => {
    setErrorMessage(err.message || 'Unable to load alert state.');
  };

  const handleMetricChange = (metric: 'delta_backscatter' | 'affected_area') => {
    setMetricName(metric);
    if (metric === 'delta_backscatter') {
      setThresholdValue(-2.0);
      setComparison('less_than');
    } else {
      setThresholdValue(50.0);
      setComparison('greater_than');
    }
  };

  const handlePresetSelect = (val: number) => {
    setThresholdValue(val);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        metric_name: metricName,
        threshold_value: Number(thresholdValue),
        comparison,
        is_active: isActive,
      };

      const res = await createCaseAlert(caseId, payload);
      setExistingAlert(res);
      setSuccessMessage('Threshold alert configured & armed.');

      if (onAlertSaved) {
        onAlertSaved();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save threshold alert.');
    } finally {
      setSaving(false);
    }
  };

  const isTriggered = existingAlert?.triggered_state === 'TRIGGERED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl overflow-hidden relative">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          aria-label="Close Modal"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="p-4 pb-2 space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Satellite Anomaly Threshold Alert
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                {caseId || 'SELECT CASE'} — Real NISAR Pass Evaluation
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4 text-xs">
          {/* TRIGGERED / ARMED ALERT STATUS BANNER */}
          {existingAlert && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isTriggered
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              }`}
            >
              {isTriggered ? (
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 text-left">
                <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>{isTriggered ? 'Threshold Exceeded' : 'Alert Armed & Active'}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20">
                    {existingAlert.triggered_state}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isTriggered
                    ? `Unusual NISAR measurement detected: current value (${existingAlert.last_evaluated_val ?? currentVal ?? 'N/A'}) crossed threshold (${existingAlert.threshold_value}).`
                    : `Monitoring satellite observations. Alert triggers if measurement crosses ${existingAlert.threshold_value}.`}
                </p>
                {existingAlert.last_triggered_at && (
                  <p className="text-[10px] font-mono text-muted-foreground pt-1">
                    Triggered at: {new Date(existingAlert.last_triggered_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* METRIC SELECTION */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Target NISAR Measurement
                </span>
                {currentVal !== undefined && currentVal !== null && (
                  <span className="text-[10px] font-mono text-primary font-bold">
                    Current: {currentVal} {metricName === 'delta_backscatter' ? 'dB' : 'ha'}
                  </span>
                )}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleMetricChange('delta_backscatter')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                    metricName === 'delta_backscatter'
                      ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <div className="font-semibold text-xs">Backscatter Change</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">delta_backscatter (dB)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleMetricChange('affected_area')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                    metricName === 'affected_area'
                      ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <div className="font-semibold text-xs">Affected Inundation Area</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">affected_area (hectares)</div>
                </button>
              </div>
            </div>

            {/* THRESHOLD VALUE & PRESETS */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5 text-primary" />
                  Anomaly Threshold Limit
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {comparison === 'less_than' ? 'Trigger if ≤ value' : 'Trigger if ≥ value'}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. -2.0"
                />
                <span className="text-xs font-mono font-semibold text-muted-foreground shrink-0 w-12">
                  {metricName === 'delta_backscatter' ? 'dB' : 'ha'}
                </span>
              </div>

              {/* QUICK PRESETS */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] font-semibold text-muted-foreground">Presets:</span>
                {metricName === 'delta_backscatter' ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetSelect(-1.5)}
                      className="h-6 text-[10px] px-2 py-0"
                    >
                      -1.5 dB
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetSelect(-2.0)}
                      className="h-6 text-[10px] px-2 py-0"
                    >
                      -2.0 dB
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetSelect(-2.5)}
                      className="h-6 text-[10px] px-2 py-0"
                    >
                      -2.5 dB
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetSelect(30.0)}
                      className="h-6 text-[10px] px-2 py-0"
                    >
                      30 ha
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetSelect(50.0)}
                      className="h-6 text-[10px] px-2 py-0"
                    >
                      50 ha
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetSelect(100.0)}
                      className="h-6 text-[10px] px-2 py-0"
                    >
                      100 ha
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* ALERT ACTIVE TOGGLE */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-primary" />
                Alert Subscription Enabled
              </span>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* SUCCESS / ERROR TOAST MESSAGES */}
            {successMessage && (
              <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2.5 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SAFETY DISCLAIMER */}
            <p className="text-[10px] text-muted-foreground leading-tight italic">
              Observational anomaly alert evaluated against satellite data. Does not constitute an emergency prediction or forecast.
            </p>

            {/* SAVE BUTTON */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-1/3 h-10 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !caseId || loading}
                className="w-2/3 h-10 text-xs font-bold uppercase tracking-wider gap-2 shadow-md"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Saving Alert...
                  </>
                ) : (
                  <>
                    <BellRing className="h-3.5 w-3.5" />
                    Save Alert Subscription
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
