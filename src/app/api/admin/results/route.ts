import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAnswers, getParticipants, getQuizState } from "@/lib/db";
import {
  getCorrectOptionText,
  getSelectedOptionText,
  QUESTIONS,
} from "@/lib/questions";
import { describePoints, formatPoints } from "@/lib/scoring";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [state, participants, answers] = await Promise.all([
    getQuizState(),
    getParticipants(),
    getAnswers(),
  ]);

  const results = participants.map((participant) => {
    const participantAnswers = answers.filter(
      (a) => a.participantId === participant.id
    );
    return {
      participant,
      answers: participantAnswers,
      totalCorrect: participantAnswers.filter((a) => a.isCorrect).length,
      totalPoints: participantAnswers.reduce(
        (sum, a) => sum + a.pointsEarned,
        0
      ),
      totalTimeMs: participantAnswers.reduce(
        (sum, a) => sum + a.responseTimeMs,
        0
      ),
    };
  });

  results.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.totalCorrect !== a.totalCorrect) return b.totalCorrect - a.totalCorrect;
    return a.totalTimeMs - b.totalTimeMs;
  });

  const questionStats = QUESTIONS.map((q, index) => {
    const questionAnswers = answers.filter((a) => a.questionIndex === index);
    return {
      index,
      text: q.text,
      correctOption: getCorrectOptionText(index),
      answers: questionAnswers.map((a) => {
        const p = participants.find((p) => p.id === a.participantId);
        const order = a.optionOrder ?? [];
        const selectedOption =
          order.length > 0
            ? getSelectedOptionText(index, a.selectedOptionIndex, order)
            : q.options[a.selectedOptionIndex];

        return {
          participantName: p?.name ?? "Desconocido",
          selectedOption,
          isCorrect: a.isCorrect,
          responseTimeMs: a.responseTimeMs,
          timeLimitSeconds: a.timeLimitSeconds ?? state.timeLimitSeconds,
          pointsEarned: a.pointsEarned,
          pointsDetail: describePoints(
            a.isCorrect,
            a.responseTimeMs,
            a.timeLimitSeconds ?? state.timeLimitSeconds,
            a.pointsEarned
          ),
        };
      }),
    };
  });

  return NextResponse.json({
    state,
    participants,
    results,
    questionStats,
    totalQuestions: QUESTIONS.length,
    maxPointsPerQuestion: 1000,
    formatPoints,
  });
}
