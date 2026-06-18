export function shuffleOptionOrder(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function getShuffledOptions(
  options: string[],
  order: number[]
): string[] {
  return order.map((i) => options[i]);
}

export function mapShuffledToOriginal(
  shuffledIndex: number,
  order: number[]
): number {
  return order[shuffledIndex];
}
