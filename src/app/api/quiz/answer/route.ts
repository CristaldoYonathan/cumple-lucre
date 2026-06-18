import { NextRequest, NextResponse } from "next/server";
import { getQuizState, saveAnswer } from "@/lib/db";
import { checkAnswer } from "@/lib/questions";
import { calculatePoints } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const participantId = Number(body.participantId);
    const questionIndex = Number(body.questionIndex);
    const selectedOptionIndex = Number(body.selectedOptionIndex);
    const responseTimeMs = Number(body.responseTimeMs);

    if (
      !participantId ||
      questionIndex < 0 ||
      selectedOptionIndex < 0 ||
      responseTimeMs < 0
    ) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const state = await getQuizState();

    if (state.status !== "active") {
      return NextResponse.json(
        { error: "El quiz no está activo" },
        { status: 400 }
      );
    }

    if (state.currentQuestionIndex !== questionIndex) {
      return NextResponse.json(
        { error: "Esta pregunta ya no está activa" },
        { status: 400 }
      );
    }

    if (!state.optionOrder) {
      return NextResponse.json({ error: "Pregunta no lista" }, { status: 400 });
    }

    if (state.questionStartedAt) {
      const elapsed =
        Date.now() - new Date(state.questionStartedAt).getTime();
      const limit = state.timeLimitSeconds * 1000 + 2000;
      if (elapsed > limit) {
        return NextResponse.json({ error: "Se acabó el tiempo" }, { status: 400 });
      }
    }

    const isCorrect = checkAnswer(
      questionIndex,
      selectedOptionIndex,
      state.optionOrder
    );
    const pointsEarned = calculatePoints(
      isCorrect,
      responseTimeMs,
      state.timeLimitSeconds
    );

    const answer = await saveAnswer({
      participantId,
      questionIndex,
      selectedOptionIndex,
      isCorrect,
      responseTimeMs,
      pointsEarned,
      timeLimitSeconds: state.timeLimitSeconds,
      optionOrder: state.optionOrder,
    });

    if (!answer) {
      return NextResponse.json(
        { error: "Ya respondiste esta pregunta" },
        { status: 409 }
      );
    }

    return NextResponse.json({ ...answer, isCorrect, pointsEarned });
  } catch {
    return NextResponse.json(
      { error: "Error al guardar respuesta" },
      { status: 500 }
    );
  }
}
