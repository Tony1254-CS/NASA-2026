import React, { useState, useEffect } from 'react';

interface CountUpNumberProps {
  value: number;
  duration?: number;
  format?: boolean;
  className?: string;
}

export function CountUpNumber({ value, duration = 1500, format = true, className = '' }: CountUpNumberProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // easeOutExpo
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      setCount(Math.floor(ease * value));

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  const displayValue = format ? new Intl.NumberFormat().format(count) : count;

  return <span className={className}>{displayValue}</span>;
}
