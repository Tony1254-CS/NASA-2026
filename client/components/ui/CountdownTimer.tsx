import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  function calculateTimeLeft(target: Date) {
    const difference = +target - +new Date();
    let timeLeft = {
      hours: 0,
      minutes: 0,
      seconds: 0
    };

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    return timeLeft;
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const DigitBox = ({ digit }: { digit: string }) => (
    <div className="flex items-center justify-center w-12 h-16 bg-white/5 border border-white/10 rounded-md backdrop-blur-md text-3xl font-mono text-white mx-1">
      {digit}
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <div 
        className="flex items-center p-4 rounded-xl"
        style={{ boxShadow: '0 0 20px rgba(56,189,248,0.3)' }}
      >
        <div className="flex">
          <DigitBox digit={formatNumber(timeLeft.hours)[0]} />
          <DigitBox digit={formatNumber(timeLeft.hours)[1]} />
        </div>
        <div className="text-3xl text-cyan-400 font-bold mx-2 animate-pulse">:</div>
        <div className="flex">
          <DigitBox digit={formatNumber(timeLeft.minutes)[0]} />
          <DigitBox digit={formatNumber(timeLeft.minutes)[1]} />
        </div>
        <div className="text-3xl text-cyan-400 font-bold mx-2 animate-pulse">:</div>
        <div className="flex">
          <DigitBox digit={formatNumber(timeLeft.seconds)[0]} />
          <DigitBox digit={formatNumber(timeLeft.seconds)[1]} />
        </div>
      </div>
      <div className="flex justify-between w-full max-w-[280px] mt-2 text-xs text-cyan-200/70 font-mono tracking-widest px-2">
        <span>HR</span>
        <span>MIN</span>
        <span>SEC</span>
      </div>
    </div>
  );
}
