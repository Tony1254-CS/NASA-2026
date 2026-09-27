'use client';

import React from 'react';
import { ShieldCheck, MapPin, Eye } from 'lucide-react';
import { EvidenceConfidenceWall } from '@/components/scientific/EvidenceConfidenceWall';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type CaseDetailResponse } from '@/lib/api';

interface PayloadAuditViewProps {
  caseId: string;
  caseDetail: CaseDetailResponse | null;
}

export function PayloadAuditView({ caseId, caseDetail }: PayloadAuditViewProps) {
  const observations = caseDetail?.field_observations || [];

  return (
    <div className="space-y-4">
      {/* 1. CORE EVIDENCE & SELF-AUDIT MATRIX */}
      <EvidenceConfidenceWall caseId={caseId} />

      {/* 2. GROUND FIELD OBSERVATIONS AUDIT TRAIL */}
      {observations.length > 0 && (
        <Card className="glass-panel border-emerald-500/30 shadow-lg">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Human Ground Sentinel Field Reports
              </CardTitle>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {observations.length} RECORDED
              </span>
            </div>
            <CardDescription className="text-[11px] text-slate-400">
              Corroborating ground truth entries recorded by field sentinels during the observation window.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            {observations.map((fo) => (
              <div
                key={fo.id}
                className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1 text-xs font-mono"
              >
                <p className="font-semibold text-slate-200">{fo.note}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>Ref: {fo.photo_reference || 'Field Observation'}</span>
                  <span>{new Date(fo.observed_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
