/** Puntos base por respuesta correcta */
export const BASE_POINTS = 1000;

/** Porcentaje del tiempo sin penalización (primer 20%) */
export const FAST_WINDOW_RATIO = 0.2;

export function calculatePoints(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitSeconds: number
): number {
  if (!isCorrect) return 0;

  const timeLimitMs = timeLimitSeconds * 1000;
  const fastWindowMs = timeLimitMs * FAST_WINDOW_RATIO;

  if (responseTimeMs <= fastWindowMs) {
    return BASE_POINTS;
  }

  const penaltyZone = timeLimitMs - fastWindowMs;
  const overtime = responseTimeMs - fastWindowMs;
  const ratio = Math.min(1, overtime / penaltyZone);

  return Math.max(0, Math.round(BASE_POINTS * (1 - ratio)));
}

export function formatPoints(points: number): string {
  return points.toLocaleString("es-AR");
}

export function describePoints(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitSeconds: number,
  points: number
): string {
  if (!isCorrect) return "0 pts (incorrecta)";
  const timeLimitMs = timeLimitSeconds * 1000;
  const fastWindowMs = timeLimitMs * FAST_WINDOW_RATIO;
  if (responseTimeMs <= fastWindowMs) {
    return `${formatPoints(points)} pts (zona rápida ⚡)`;
  }
  const deducted = BASE_POINTS - points;
  return `${formatPoints(points)} pts (-${formatPoints(deducted)} por tiempo)`;
}
