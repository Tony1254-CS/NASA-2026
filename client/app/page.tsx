'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchHealthStatus, type HealthResponse } from '@/lib/api';

export default function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');

  useEffect(() => {
    let isMounted = true;

    fetchHealthStatus()
      .then((data) => {
        if (isMounted) {
          setHealth(data);
          setStatus('connected');
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus('disconnected');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">TRACE Platform</CardTitle>
          <CardDescription>
            Temporal Radar Assessment & Cross-mission Evidence — Requirement-0 System Status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 border rounded-lg p-4 bg-card">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              System Status
            </h3>
            
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-sm font-medium">Frontend</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium">Backend</span>
              {status === 'loading' && (
                <span className="text-xs font-semibold text-muted-foreground animate-pulse">
                  Connecting...
                </span>
              )}
              {status === 'connected' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Connected ({health?.service || 'TRACE server'})
                </span>
              )}
              {status === 'disconnected' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Disconnected
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            API URL: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
