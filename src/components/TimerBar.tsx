"use client";

import { useEffect, useRef, useState } from "react";

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
  const firedRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    firedRef.current = false;
    const tick = () => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      const left = Math.max(0, timeLimitSeconds - elapsed);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeUpRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [startedAt, timeLimitSeconds]);

  const pct = timeLimitSeconds > 0 ? (remaining / timeLimitSeconds) * 100 : 0;
  const urgent = remaining <= 5;
  const expired = remaining <= 0;

  return (
    <div className="timer-wrap">
      <div className="timer-label">
        <span>⏱️ Tiempo</span>
        <span className={urgent ? "timer-urgent" : ""}>
          {expired ? "0s" : `${Math.ceil(remaining)}s`}
        </span>
      </div>
      <div className="timer-track">
        <div
          className={`timer-fill ${urgent || expired ? "timer-fill-urgent" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
