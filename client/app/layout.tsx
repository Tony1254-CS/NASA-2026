import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TRACE FIELD — Temporal Radar Assessment & Cross-mission Evidence',
  description: 'Mobile-first field observation and satellite investigation application.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#060911',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-deep-space-container text-foreground antialiased selection:bg-sky-500/30">
        {children}
      </body>
    </html>
  );
}
