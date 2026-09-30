import React from 'react';

export default function EvidenceChain() {
  return (
    <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-800">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
        <span className="text-xl">🛡️</span>
        <h2 className="text-lg font-bold text-slate-200 tracking-wide uppercase">Evidence Chain</h2>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-emerald-500">✅</span> NISAR L-Band
          </div>
          <div className="font-mono text-emerald-400">Δσ⁰ = -8.3 dB</div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-emerald-500">✅</span> GPM IMERG
          </div>
          <div className="font-mono text-emerald-400">+47mm precip</div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-slate-600">⬜</span> FIRMS
          </div>
          <div className="font-mono text-slate-500">No fire signal</div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-emerald-500">✅</span> MODIS NDVI
          </div>
          <div className="font-mono text-emerald-400">-0.31 drop</div>
        </div>
      </div>

      <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/50">
        <div className="font-bold text-emerald-500 mb-1 flex items-center gap-2">
          <span>🛡️</span> Self-Audit: PASSED
        </div>
        <p className="text-sm text-slate-400 italic">
          "Temporal correlation observed. Non-causal. Recommend field verification."
        </p>
      </div>
    </div>
  );
}
