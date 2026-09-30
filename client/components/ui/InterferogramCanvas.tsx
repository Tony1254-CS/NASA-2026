'use client';

import React, { useEffect, useRef, useState } from 'react';
import { InterferogramSample } from '@/lib/sampleInterferograms';
import { phaseToColor, coherenceToColor, displacementToColor } from '@/lib/colorMaps';

interface Props {
  data: InterferogramSample;
  mode: 'phase' | 'amplitude' | 'coherence' | 'displacement';
}

export const InterferogramCanvas: React.FC<Props> = ({ data, mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, phase: number, coh: number, disp: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [rows, cols] = data.grid_size;
    
    // Resize canvas visually, keep internal resolution to grid_size
    canvas.width = cols;
    canvas.height = rows;

    const imageData = ctx.createImageData(cols, rows);
    const d = imageData.data;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const idx = i * cols + j;
        let r=0, g=0, b=0;

        if (mode === 'phase') {
          [r, g, b] = phaseToColor(data.wrapped_phase[idx]);
        } else if (mode === 'coherence') {
          [r, g, b] = coherenceToColor(data.coherence[idx]);
        } else if (mode === 'amplitude') {
          const v = Math.floor(data.amplitude[idx] * 255);
          r = v; g = v; b = v;
        } else if (mode === 'displacement') {
          [r, g, b] = displacementToColor(data.displacement_mm[idx], Math.abs(data.peak_displacement_mm));
        }

        const px = idx * 4;
        d[px] = r;
        d[px+1] = g;
        d[px+2] = b;
        d[px+3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [data, mode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Map client coordinates to internal canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const [rows, cols] = data.grid_size;
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      const idx = y * cols + x;
      setHoverInfo({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        phase: data.wrapped_phase[idx],
        coh: data.coherence[idx],
        disp: data.displacement_mm[idx]
      });
    } else {
      setHoverInfo(null);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 shadow-lg">
      <canvas 
        ref={canvasRef} 
        className="w-full h-auto aspect-square cursor-crosshair rendering-pixelated"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverInfo(null)}
      />
      {hoverInfo && (
        <div 
          className="absolute pointer-events-none bg-slate-900/90 text-cyan-300 font-mono text-[10px] p-2 rounded backdrop-blur border border-slate-700"
          style={{ left: Math.min(hoverInfo.x + 10, 200), top: Math.min(hoverInfo.y + 10, 200) }}
        >
          Phase: {hoverInfo.phase.toFixed(2)} rad<br/>
          Coherence: {hoverInfo.coh.toFixed(2)}<br/>
          Disp: {hoverInfo.disp.toFixed(1)} mm
        </div>
      )}
    </div>
  );
};
