import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TRACE FIELD — Temporal Radar Assessment & Cross-mission Evidence',
  description: 'Mobile-first field observation and satellite investigation application.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TRACE',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#03050a] text-foreground antialiased selection:bg-sky-500/30 flex justify-center" suppressHydrationWarning>
        <div className="w-full max-w-[430px] min-h-screen bg-deep-space-container relative shadow-[0_0_50px_rgba(0,0,0,0.5)] sm:border-x border-slate-800/50 flex flex-col overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
