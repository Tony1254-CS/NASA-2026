'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Volume2,
  VolumeX,
  Play,
  Square,
  AlertTriangle,
  Layers,
  Radar,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/lib/useHaptics';
import { fetchCases, fetchCaseDetail, type CaseDetailResponse } from '@/lib/api';

interface FeelScreenProps {
  initialCaseId?: string | null;
  onNavigateToVerify?: () => void;
}

export function FeelScreen({ initialCaseId, onNavigateToVerify }: FeelScreenProps) {
  const {
    isPlaying,
    hapticsSupported,
    sensitivity,
    setSensitivity,
    isAudioMuted,
    setIsAudioMuted,
    feelDetails,
    startFeel,
    stopFeel,
  } = useHaptics();

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(initialCaseId || null);
  const [caseList, setCaseList] = useState<Array<{ case_id: string; event_type: string }>>([]);
  const [caseDetail, setCaseDetail] = useState<CaseDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load available cases
  useEffect(() => {
    fetchCases(1, 20)
      .then((res) => {
        if (res.items.length > 0) {
          setCaseList(res.items);
          if (!selectedCaseId) {
            setSelectedCaseId(res.items[0].case_id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch case detail when selectedCaseId changes
  useEffect(() => {
    if (!selectedCaseId) return;

    setLoading(true);
    fetchCaseDetail(selectedCaseId)
      .then((res) => {
        setCaseDetail(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [selectedCaseId]);

  const activeMeasurement = caseDetail?.nisar_measurements?.[0];
  const deltaValue = activeMeasurement?.delta_backscatter;

  const handleToggleFeel = () => {
    if (isPlaying) {
      stopFeel();
    } else if (deltaValue != null) {
      startFeel(deltaValue);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto px-4">
      {/* SECTION 1: HEADER & CASE PICKER */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            Select Investigation to Feel
          </label>
        </div>

        {caseList.length > 0 && (
          <select
            value={selectedCaseId || ''}
            onChange={(e) => {
              stopFeel();
              setSelectedCaseId(e.target.value);
            }}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {caseList.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} — {c.event_type.toUpperCase()}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* SECTION 2: HAPTICS SUPPORT NOTICE */}
      {!hapticsSupported && (
        <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Haptic Feedback Unavailable
          </div>
          <p className="text-[11px] text-muted-foreground">
            Browser/device does not support direct vibration API (e.g. iOS Safari). Audio pulse synthesizer is enabled.
          </p>
        </div>
      )}

      {/* SECTION 3: CORE FEEL DISPLAY */}
      {loading ? (
        <Card className="border-border/50 animate-pulse">
          <CardContent className="p-8 text-center space-y-3">
            <Radar className="h-10 w-10 text-muted-foreground mx-auto animate-spin" />
            <p className="text-xs text-muted-foreground">Loading measurement from TRACE backend...</p>
          </CardContent>
        </Card>
      ) : caseDetail ? (
        <Card className="border-primary/40 bg-gradient-to-b from-card to-card/90 shadow-lg relative overflow-hidden">
          {/* RADAR PULSE CANVAS / VISUALIZATION */}
          <div className="relative p-6 text-center border-b border-border/50 bg-muted/20">
            <div className="relative inline-flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div
                className={`w-32 h-32 rounded-full border-2 border-primary/30 flex items-center justify-center transition-all duration-300 ${
                  isPlaying ? 'animate-ping opacity-75 bg-primary/10' : ''
                }`}
              />
              {/* Inner ring */}
              <div
                className={`absolute w-24 h-24 rounded-full border border-primary/60 flex items-center justify-center bg-card ${
                  isPlaying ? 'scale-110 shadow-[0_0_20px_rgba(56,189,248,0.4)]' : ''
                }`}
              >
                <Activity className={`h-10 w-10 text-primary ${isPlaying ? 'animate-pulse' : ''}`} />
              </div>
            </div>

            {/* CASE IDENTITY */}
            <div className="mt-4 space-y-1">
              <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                {caseDetail.case_id}
              </span>
              <h2 className="text-lg font-bold text-foreground capitalize mt-1">
                {caseDetail.event_type}
              </h2>
            </div>
          </div>

          {/* MEASUREMENT METRICS */}
          <CardContent className="p-5 space-y-5">
            <div className="bg-muted/40 border border-border/60 rounded-xl p-4 text-center space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actual Backend NISAR Measurement
              </span>

              {deltaValue != null ? (
                <div className="space-y-0.5">
                  <p className="text-3xl font-extrabold font-mono text-foreground tracking-tight">
                    {deltaValue > 0 ? '+' : ''}
                    {deltaValue.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">dB</span>
                  </p>
                  {feelDetails && (
                    <p className="text-[11px] font-medium text-primary">{feelDetails.description}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">
                  No scientific measurement recorded for this case.
                </p>
              )}
            </div>

            {/* CONTROLS (SENSITIVITY & AUDIO) */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Sensitivity Control */}
              <div className="bg-muted/30 border border-border/50 rounded-lg p-2.5 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sliders className="h-3 w-3 text-primary" />
                  Haptic Scale
                </span>
                <div className="flex gap-1">
                  {[0.5, 1.0, 1.5, 2.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSensitivity(val)}
                      className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                        sensitivity === val
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {val}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Toggle */}
              <div className="bg-muted/30 border border-border/50 rounded-lg p-2.5 space-y-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  {isAudioMuted ? <VolumeX className="h-3 w-3 text-destructive" /> : <Volume2 className="h-3 w-3 text-emerald-500" />}
                  Audio Pulse
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className="h-7 text-[11px] w-full gap-1"
                >
                  {isAudioMuted ? 'Unmute Audio' : 'Audio On'}
                </Button>
              </div>
            </div>

            {/* PRIMARY ACTION BUTTON */}
            <Button
              disabled={deltaValue == null}
              onClick={handleToggleFeel}
              className={`w-full h-12 text-xs font-bold uppercase tracking-wider gap-2 shadow-md ${
                isPlaying
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="h-4 w-4 fill-current" />
                  Stop Physical Feedback
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Feel The Change
                </>
              )}
            </Button>

            {/* NEXT STEP ACTION: VERIFY */}
            {onNavigateToVerify && (
              <Button
                variant="outline"
                onClick={onNavigateToVerify}
                className="w-full h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                Proceed to VERIFY Ground Evidence
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border text-center p-6">
          <p className="text-xs text-muted-foreground">Select a valid TRACE case to perceive feedback.</p>
        </Card>
      )}
    </div>
  );
}
