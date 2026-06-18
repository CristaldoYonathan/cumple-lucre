import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getQuizState, updateQuizState } from "@/lib/db";
import { QUESTIONS, TOTAL_QUESTIONS } from "@/lib/questions";
import { shuffleOptionOrder } from "@/lib/shuffle";

function startQuestion(index: number, timeLimit?: number) {
  const q = QUESTIONS[index];
  const optionOrder = shuffleOptionOrder(q.options.length);

  return updateQuizState({
    status: "active",
    currentQuestionIndex: index,
    questionStartedAt: new Date().toISOString(),
    optionOrder,
    ...(timeLimit ? { timeLimitSeconds: timeLimit } : {}),
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action as string;
    const timeLimit = body.timeLimitSeconds
      ? Number(body.timeLimitSeconds)
      : undefined;

    switch (action) {
      case "start":
        await startQuestion(0, timeLimit);
        break;

      case "next": {
        const state = await getQuizState();
        const nextIndex = state.currentQuestionIndex + 1;

        if (nextIndex >= TOTAL_QUESTIONS) {
          await updateQuizState({
            status: "finished",
            currentQuestionIndex: TOTAL_QUESTIONS - 1,
            questionStartedAt: null,
            optionOrder: null,
            ...(timeLimit ? { timeLimitSeconds: timeLimit } : {}),
          });
        } else {
          await startQuestion(nextIndex, timeLimit);
        }
        break;
      }

      case "setTimeLimit": {
        if (!timeLimit || timeLimit < 5 || timeLimit > 120) {
          return NextResponse.json(
            { error: "Tiempo inválido (5-120 seg)" },
            { status: 400 }
          );
        }
        const state = await getQuizState();
        if (state.status !== "waiting") {
          return NextResponse.json(
            { error: "Solo se puede cambiar el tiempo en espera o al pasar de pregunta" },
            { status: 400 }
          );
        }
        await updateQuizState({ timeLimitSeconds: timeLimit });
        break;
      }

      case "finish":
        await updateQuizState({
          status: "finished",
          questionStartedAt: null,
          optionOrder: null,
        });
        break;

      case "waiting":
        await updateQuizState({
          status: "waiting",
          currentQuestionIndex: -1,
          questionStartedAt: null,
          optionOrder: null,
        });
        break;

      default:
        return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    const state = await getQuizState();
    return NextResponse.json(state);
  } catch {
    return NextResponse.json({ error: "Error al actualizar quiz" }, { status: 500 });
  }
}
