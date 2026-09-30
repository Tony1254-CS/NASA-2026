import React from 'react';
import { Play } from 'lucide-react';
import { PulseVisualizer } from '../ui/PulseVisualizer';
import { IntensityMeter } from '../ui/IntensityMeter';

export function ExperienceScreen({ onClose }: { onClose?: () => void }) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [displacement, setDisplacement] = React.useState(-34.7);
  const [frequency, setFrequency] = React.useState(247);
  const [intensity, setIntensity] = React.useState(0.8);
  const [showSummary, setShowSummary] = React.useState(false);

  const startExperience = () => {
    setIsPlaying(true);
    // Mock simulation
    setTimeout(() => {
      setIsPlaying(false);
      setShowSummary(true);
    }, 18000);
  };

  const getBackgroundColor = () => {
    if (!isPlaying) return 'bg-slate-950';
    if (displacement < -40) return 'bg-rose-950';
    if (displacement < -20) return 'bg-amber-950';
    if (displacement > 0) return 'bg-cyan-950';
    return 'bg-blue-950';
  };

  return (
    <div className={`min-h-[calc(100vh-64px)] flex flex-col items-center justify-between p-6 transition-colors duration-1000 overflow-y-auto ${getBackgroundColor()}`}>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[250px] relative py-8">
        <PulseVisualizer intensity={intensity} isPlaying={isPlaying} />
      </div>

      <div className="w-full space-y-6 z-10 pb-20">
        <IntensityMeter displacement={displacement} frequency={frequency} intensity={intensity} />
        
        <p className="text-slate-300 text-sm text-center px-4">
          "Subsidence detected. Ground sinking at rate exceeding urban safety threshold."
        </p>

        {!isPlaying && !showSummary && (
          <button 
            onClick={startExperience}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-bold text-lg hover:bg-cyan-500/20 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <Play size={24} fill="currentColor" />
            START EXPERIENCE
          </button>
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md">
          <h4 className="text-white font-bold mb-2">What am I hearing?</h4>
          <ul className="text-sm text-slate-400 space-y-2">
            <li><span className="text-slate-200">Low rumble</span> = ground sinking (subsidence)</li>
            <li><span className="text-slate-200">High crystal tone</span> = ground rising (uplift)</li>
            <li><span className="text-slate-200">Vibration intensity</span> = magnitude of change</li>
          </ul>
          <div className="mt-4 font-mono text-xs text-cyan-400/70 border-t border-white/10 pt-2">
            d_LOS = λΔφ / 4π
          </div>
        </div>
      </div>

      {showSummary && (
        <div className="absolute inset-x-4 bottom-24 bg-slate-900/90 border border-slate-700 p-6 rounded-2xl backdrop-blur-xl animate-in slide-in-from-bottom-10 fade-in duration-500 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">SESSION SUMMARY</h3>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <div className="text-slate-500">Duration</div>
              <div className="text-white font-mono">18 seconds</div>
            </div>
            <div>
              <div className="text-slate-500">Transect</div>
              <div className="text-white font-mono">120 points</div>
            </div>
            <div>
              <div className="text-slate-500">Peak</div>
              <div className="text-rose-400 font-mono">-47.2 mm</div>
            </div>
            <div>
              <div className="text-slate-500">Mean</div>
              <div className="text-amber-400 font-mono">-22.1 mm</div>
            </div>
          </div>
          <p className="text-sm text-slate-300 italic border-l-2 border-rose-500 pl-3">
            "Severe ground subsidence detected along transect. Pattern consistent with aquifer depletion."
          </p>
          <button 
            onClick={() => setShowSummary(false)}
            className="mt-6 w-full py-3 rounded-lg bg-white/10 text-white font-medium"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
