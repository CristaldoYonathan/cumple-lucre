"use client";

import { useEffect, useState } from "react";

interface TimerBarProps {
  startedAt: string;
  timeLimitSeconds: number;
  onTimeUp?: () => void;
}

export function TimerBar({
  startedAt,
  timeLimitSeconds,
  onTimeUp,
}: TimerBarProps) {
  const [remaining, setRemaining] = useState(timeLimitSeconds);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    setFired(false);
    const tick = () => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      const left = Math.max(0, timeLimitSeconds - elapsed);
      setRemaining(left);
      if (left <= 0 && !fired) {
        setFired(true);
        onTimeUp?.();
      }
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [startedAt, timeLimitSeconds, onTimeUp, fired]);

  const pct = (remaining / timeLimitSeconds) * 100;
  const urgent = remaining <= 5;

  return (
    <div className="timer-wrap">
      <div className="timer-label">
        <span>⏱️ Tiempo</span>
        <span className={urgent ? "timer-urgent" : ""}>
          {Math.ceil(remaining)}s
        </span>
      </div>
      <div className="timer-track">
        <div
          className={`timer-fill ${urgent ? "timer-fill-urgent" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
