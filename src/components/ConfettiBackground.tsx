"use client";

import { useEffect, useState } from "react";

const CONFETTI = ["🍓", "🎀", "🎂", "🎈", "✨", "💛", "🎉", "⭐", "💖", "🦋"];

export function ConfettiBackground() {
  const [pieces, setPieces] = useState<
    { id: number; emoji: string; left: number; delay: number; duration: number }[]
  >([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        emoji: CONFETTI[i % CONFETTI.length],
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 6 + Math.random() * 8,
      }))
    );
  }, []);

  return (
    <div className="confetti-layer" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
