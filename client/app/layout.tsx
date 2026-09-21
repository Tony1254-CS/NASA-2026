import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TRACE - Earth Observation Platform Foundation',
  description: 'Initial foundation for TRACE client application.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <main className="flex-1 container mx-auto px-4 py-12">{children}</main>
      </body>
    </html>
  );
}
