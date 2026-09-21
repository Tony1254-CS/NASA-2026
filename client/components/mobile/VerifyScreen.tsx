'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  Clock,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/lib/useGeolocation';
import {
  fetchCases,
  createFieldObservation,
  type FieldObservationResponse,
} from '@/lib/api';

interface VerifyScreenProps {
  initialCaseId?: string | null;
  onSuccess?: () => void;
}

export function VerifyScreen({ initialCaseId, onSuccess }: VerifyScreenProps) {
  const { location, status: locationStatus, error: locationError, requestLocation } = useGeolocation();

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(initialCaseId || null);
  const [caseList, setCaseList] = useState<Array<{ case_id: string; event_type: string }>>([]);

  const [note, setNote] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<FieldObservationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Handle photo file selection or camera capture
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 10MB limit.');
      return;
    }

    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Field Observation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) {
      setErrorMessage('Please select an active TRACE investigation case.');
      return;
    }

    if (!location) {
      setErrorMessage('GPS location is required to submit a ground observation.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        photo_reference: photoName || (photoPreview ? 'photo_captured.jpg' : null),
        note: note.trim() || 'Ground observation verified in field.',
        observed_at: new Date().toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
      };

      const res = await createFieldObservation(selectedCaseId, payload);
      setSubmitSuccess(res);
      setNote('');
      handleRemovePhoto();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit ground observation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto px-4">
      {/* SECTION 1: CASE PICKER */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Contribute Field Ground Evidence
          </label>
        </div>

        {caseList.length > 0 && (
          <select
            value={selectedCaseId || ''}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              setSubmitSuccess(null);
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

      {/* SECTION 2: HUMAN OBSERVATION DISCLAIMER BADGE */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs space-y-1">
        <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider text-[11px]">
          <UserCheck className="h-4 w-4" />
          Human Ground Observation
        </div>
        <p className="text-[11px] text-muted-foreground">
          Submissions are attached as independent ground-truth field evidence. They provide physical context to satellite observations.
        </p>
      </div>

      {/* SUCCESS CARD */}
      {submitSuccess && (
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="p-4 space-y-2 text-xs text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-emerald-500">Field Observation Recorded</h3>
            <p className="text-[11px] text-muted-foreground font-mono">
              Observation ID: {submitSuccess.id} attached to {submitSuccess.case_id}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubmitSuccess(null)}
              className="h-7 text-xs mt-2"
            >
              Submit Another Observation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* FORM CARD */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
            <span>Ground Truth Report</span>
            <span className="text-[10px] font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {selectedCaseId || 'SELECT CASE'}
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Capture field photos, notes, and device GPS location.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-2 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PHOTO CAPTURE & PREVIEW */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Camera className="h-3.5 w-3.5 text-primary" />
                Field Photo
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
                id="photo-upload-input"
              />

              {photoPreview ? (
                <div className="relative rounded-lg border border-border/80 overflow-hidden bg-black/40 text-center">
                  {/* Image Preview */}
                  <img
                    src={photoPreview}
                    alt="Field observation preview"
                    className="max-h-48 w-full object-cover"
                  />
                  <div className="p-2 bg-card/90 backdrop-blur-sm border-t border-border flex items-center justify-between">
                    <span className="text-[11px] font-mono truncate max-w-[200px] text-muted-foreground">
                      {photoName || 'Captured Photo'}
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="h-7 px-2 text-[11px] gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="photo-upload-input"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
                >
                  <Camera className="h-8 w-8 text-primary mb-2" />
                  <span className="text-xs font-semibold text-foreground">Take Photo / Select Image</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Supports camera capture & file upload</span>
                </label>
              )}
            </div>

            {/* FIELD OBSERVATION NOTE */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Observation Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Standing surface water observed along road boundary."
                rows={3}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* GPS LOCATION CAPTURE */}
            <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Captured Coordinates
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={requestLocation}
                  disabled={locationStatus === 'loading'}
                  className="h-6 text-[10px] px-2 gap-1"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${locationStatus === 'loading' ? 'animate-spin' : ''}`} />
                  Refresh GPS
                </Button>
              </div>

              {location ? (
                <p className="text-xs font-mono font-medium text-foreground">
                  {location.latitude.toFixed(5)}°, {location.longitude.toFixed(5)}° (±{Math.round(location.accuracy || 0)}m)
                </p>
              ) : (
                <p className="text-xs text-amber-500 font-medium">
                  {locationError || 'GPS location required for field submission.'}
                </p>
              )}
            </div>

            {/* TIMESTAMP */}
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" />
              Timestamp: {new Date().toLocaleString()}
            </div>

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              disabled={submitting || !selectedCaseId || !location}
              className="w-full h-11 text-xs font-bold uppercase tracking-wider gap-2 shadow-md"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Submitting Evidence...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Submit Ground Evidence
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
