import { NextResponse } from "next/server";
import { getQuizState } from "@/lib/db";
import { getPublicQuestion, TOTAL_QUESTIONS } from "@/lib/questions";

export async function GET() {
  const state = await getQuizState();
  const question =
    state.status === "active" &&
    state.currentQuestionIndex >= 0 &&
    state.optionOrder
      ? getPublicQuestion(state.currentQuestionIndex, state.optionOrder)
      : null;

  return NextResponse.json({
    status: state.status,
    currentQuestionIndex: state.currentQuestionIndex,
    questionStartedAt: state.questionStartedAt,
    timeLimitSeconds: state.timeLimitSeconds,
    sessionVersion: state.sessionVersion,
    question,
    totalQuestions: TOTAL_QUESTIONS,
  });
}
