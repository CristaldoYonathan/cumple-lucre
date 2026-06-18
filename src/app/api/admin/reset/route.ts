import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, verifyPassword } from "@/lib/auth";
import { resetQuiz } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const password = String(body.password ?? "");

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    await resetQuiz();
    const { getQuizState } = await import("@/lib/db");
    const state = await getQuizState();
    return NextResponse.json({ success: true, sessionVersion: state.sessionVersion });
  } catch {
    return NextResponse.json({ error: "Error al reiniciar" }, { status: 500 });
  }
}
