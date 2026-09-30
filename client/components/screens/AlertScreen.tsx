import React from 'react';
import ImpactAssessment from '../ui/ImpactAssessment';
import EvidenceChain from '../ui/EvidenceChain';
import EventTimeline from '../ui/EventTimeline';

export function AlertScreen() {
  return (
    <div className="min-h-screen bg-black text-slate-200 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <button className="text-slate-400 hover:text-white flex items-center gap-1">
          <span>←</span> Back
        </button>
        <div className="font-mono text-sm tracking-wider">CASE-017</div>
        <div className="flex items-center gap-1 bg-rose-500/20 text-rose-500 px-2 py-1 rounded text-xs font-bold border border-rose-500/30">
          <span className="animate-pulse">🔴</span> CRIT
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-white tracking-tight uppercase leading-none mb-1">
            Flood Inundation
          </h1>
          <p className="text-[13px] text-slate-400">
            Sundarbans Mangrove, Bangladesh
          </p>
          <p className="text-[13px] text-slate-500 mt-1">
            Started: Sep 12, 2026
          </p>
        </div>

        {/* Before / After Optical vs SAR Comparison */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div 
            className="h-36 rounded-lg border border-slate-700 relative overflow-hidden flex flex-col justify-end p-2 bg-cover bg-center shadow-inner"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop")' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-md border border-white/10">BEFORE (Optical)</div>
            <div className="text-xs text-emerald-300 font-medium z-10 drop-shadow-md">Clear land / Vegetation</div>
          </div>
          
          <div 
            className="h-36 rounded-lg border border-rose-500/30 relative overflow-hidden flex flex-col justify-end p-2 bg-cover bg-center"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop&sat=-100")' }}
          >
            {/* Fake SAR colorization overlay */}
            <div className="absolute inset-0 bg-rose-900/40 mix-blend-color" />
            {/* Radar scan lines */}
            <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute top-2 left-2 bg-rose-600/90 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-md border border-rose-400/30 shadow-[0_0_10px_rgba(225,29,72,0.5)]">AFTER (SAR L-Band)</div>
            <div className="text-xs text-rose-300 font-medium z-10 drop-shadow-md">Specular reflection loss (Water)</div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
            <div className="text-xl font-mono text-rose-400 font-bold">-8.3</div>
            <div className="text-xs text-slate-500 mt-1 uppercase">dB</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
            <div className="text-xl font-mono text-rose-400 font-bold">142</div>
            <div className="text-xs text-slate-500 mt-1 uppercase">km²</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
            <div className="text-xl font-mono text-emerald-400 font-bold">87%</div>
            <div className="text-xs text-slate-500 mt-1 uppercase">Conf</div>
          </div>
        </div>

        {/* Core Components */}
        <ImpactAssessment />
        
        <EvidenceChain />
        
        <EventTimeline />

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          <button className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-lg flex flex-col items-center justify-center gap-1 border border-slate-700 transition-colors">
            <span className="text-2xl">🎵</span>
            <span className="text-sm font-bold">HEAR IT</span>
            <span className="text-xs text-slate-400">Experience →</span>
          </button>
          <button className="bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 p-4 rounded-lg flex flex-col items-center justify-center gap-1 border border-emerald-500/30 transition-colors">
            <span className="text-2xl">📸</span>
            <span className="text-sm font-bold">VERIFY IT</span>
            <span className="text-xs text-emerald-500/70">Ground Truth →</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1">
            🔗 Open Full Analysis in Web →
          </a>
        </div>
      </div>
    </div>
  );
}
