'use client';

import React from 'react';
import { FrequencyPenetration } from '@/components/ui/FrequencyPenetration';
import { PolarizationMatrix } from '@/components/ui/PolarizationMatrix';

export const SignalScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full bg-[#060911] text-slate-100 overflow-y-auto pb-24 p-4 space-y-6">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-slate-200">SAR Signal Laboratory</h1>
        <p className="text-sm text-slate-400">Interactive physics of synthetic aperture radar.</p>
      </div>

      <FrequencyPenetration />
      
      <PolarizationMatrix />

      <div className="science-card p-4">
        <h3 className="text-xs font-mono tracking-widest text-slate-400 mb-4 uppercase">Backscatter Response Profiles (σ⁰)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[10px] uppercase font-mono text-slate-500 border-b border-slate-700/50">
              <tr>
                <th className="pb-2">Surface Type</th>
                <th className="pb-2">C-band</th>
                <th className="pb-2">L-band</th>
                <th className="pb-2">Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              <tr>
                <td className="py-2">Calm Water</td>
                <td className="py-2">-25 dB</td>
                <td className="py-2">-22 dB</td>
                <td className="py-2 text-slate-400">Specular</td>
              </tr>
              <tr>
                <td className="py-2">Urban</td>
                <td className="py-2">+5 dB</td>
                <td className="py-2">+3 dB</td>
                <td className="py-2 text-slate-400">Corner</td>
              </tr>
              <tr>
                <td className="py-2">Dense Forest</td>
                <td className="py-2">-8 dB</td>
                <td className="py-2">-6 dB</td>
                <td className="py-2 text-slate-400">Volume</td>
              </tr>
              <tr>
                <td className="py-2">Bare Soil</td>
                <td className="py-2">-12 dB</td>
                <td className="py-2">-14 dB</td>
                <td className="py-2 text-slate-400">Roughness</td>
              </tr>
              <tr className="bg-cyan-950/20">
                <td className="py-2 font-bold text-cyan-400">Flood / Veg</td>
                <td className="py-2">-20 → -8</td>
                <td className="py-2">-18 → -4</td>
                <td className="py-2 font-bold text-cyan-400">Double-bounce</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="science-card p-4 border-cyan-900/50 bg-cyan-950/10">
        <h3 className="text-sm font-bold text-cyan-400 mb-2">🛰️ Why NISAR's L-Band is Revolutionary</h3>
        <ul className="text-xs text-slate-300 space-y-2">
          <li className="flex items-start"><span className="text-emerald-500 mr-2">✓</span> Penetrates forest canopy</li>
          <li className="flex items-start"><span className="text-emerald-500 mr-2">✓</span> Maintains coherence over 12+ days</li>
          <li className="flex items-start"><span className="text-emerald-500 mr-2">✓</span> Detects deep-seated landslides</li>
          <li className="flex items-start"><span className="text-emerald-500 mr-2">✓</span> Measures ground beneath vegetation</li>
        </ul>
        <div className="mt-3 text-xs font-mono text-cyan-500 italic">
          "NISAR sees what Sentinel-1 cannot."
        </div>
      </div>
    </div>
  );
};

export default SignalScreen;
