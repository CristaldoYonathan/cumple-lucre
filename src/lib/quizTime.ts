export function isQuestionTimeExpired(
  questionStartedAt: string | null,
  timeLimitSeconds: number
): boolean {
  if (!questionStartedAt) return false;
  const elapsed = Date.now() - new Date(questionStartedAt).getTime();
  return elapsed >= timeLimitSeconds * 1000;
}
