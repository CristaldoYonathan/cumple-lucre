import { NextRequest, NextResponse } from "next/server";
import { createParticipant } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const profilePhoto = body.profilePhoto ? String(body.profilePhoto) : null;

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "El nombre debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "El nombre es demasiado largo" },
        { status: 400 }
      );
    }

    const participant = await createParticipant(name, profilePhoto);
    return NextResponse.json(participant);
  } catch {
    return NextResponse.json(
      { error: "Error al registrar participante" },
      { status: 500 }
    );
  }
}
