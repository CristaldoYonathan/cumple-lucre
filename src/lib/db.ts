import { neon } from "@neondatabase/serverless";
import type { Answer, Participant, QuizState } from "./types";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no configurada");
  return neon(url);
}

function parseOptionOrder(value: unknown): number[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value as number[];
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as number[];
    } catch {
      return null;
    }
  }
  return null;
}

export async function getQuizState(): Promise<QuizState> {
  const sql = getSql();
  const rows = await sql`
    SELECT status, current_question_index, question_started_at, time_limit_seconds,
           option_order, session_version
    FROM quiz_state WHERE id = 1
  `;
  const row = rows[0];
  return {
    status: row.status as QuizState["status"],
    currentQuestionIndex: row.current_question_index,
    questionStartedAt: row.question_started_at,
    timeLimitSeconds: row.time_limit_seconds,
    optionOrder: parseOptionOrder(row.option_order),
    sessionVersion: row.session_version ?? 0,
  };
}

export async function updateQuizState(data: {
  status?: QuizState["status"];
  currentQuestionIndex?: number;
  questionStartedAt?: string | null;
  timeLimitSeconds?: number;
  optionOrder?: number[] | null;
}) {
  const sql = getSql();
  const current = await getQuizState();

  const optionOrderJson =
    data.optionOrder !== undefined
      ? data.optionOrder
        ? JSON.stringify(data.optionOrder)
        : null
      : current.optionOrder
        ? JSON.stringify(current.optionOrder)
        : null;

  await sql`
    UPDATE quiz_state SET
      status = ${data.status ?? current.status},
      current_question_index = ${data.currentQuestionIndex ?? current.currentQuestionIndex},
      question_started_at = ${data.questionStartedAt !== undefined ? data.questionStartedAt : current.questionStartedAt},
      time_limit_seconds = ${data.timeLimitSeconds ?? current.timeLimitSeconds},
      option_order = ${optionOrderJson},
      updated_at = NOW()
    WHERE id = 1
  `;
}

export async function createParticipant(
  name: string,
  profilePhoto: string | null
): Promise<Participant> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO participants (name, profile_photo)
    VALUES (${name}, ${profilePhoto})
    RETURNING id, name, profile_photo, created_at
  `;
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    profilePhoto: row.profile_photo,
    createdAt: row.created_at,
  };
}

export async function getParticipants(): Promise<Participant[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, profile_photo, created_at FROM participants ORDER BY created_at
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    profilePhoto: row.profile_photo,
    createdAt: row.created_at,
  }));
}

export async function saveAnswer(data: {
  participantId: number;
  questionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
  responseTimeMs: number;
  pointsEarned: number;
  timeLimitSeconds: number;
  optionOrder: number[];
}): Promise<Answer | null> {
  const sql = getSql();
  const optionOrderJson = JSON.stringify(data.optionOrder);

  try {
    const rows = await sql`
      INSERT INTO answers (
        participant_id, question_index, selected_option_index,
        is_correct, response_time_ms, points_earned, time_limit_seconds, option_order
      )
      VALUES (
        ${data.participantId},
        ${data.questionIndex},
        ${data.selectedOptionIndex},
        ${data.isCorrect},
        ${data.responseTimeMs},
        ${data.pointsEarned},
        ${data.timeLimitSeconds},
        ${optionOrderJson}
      )
      ON CONFLICT (participant_id, question_index) DO NOTHING
      RETURNING id, participant_id, question_index, selected_option_index,
                is_correct, response_time_ms, points_earned, time_limit_seconds,
                option_order, answered_at
    `;
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      id: row.id,
      participantId: row.participant_id,
      questionIndex: row.question_index,
      selectedOptionIndex: row.selected_option_index,
      isCorrect: row.is_correct,
      responseTimeMs: row.response_time_ms,
      pointsEarned: row.points_earned,
      timeLimitSeconds: row.time_limit_seconds,
      optionOrder: parseOptionOrder(row.option_order),
      answeredAt: row.answered_at,
    };
  } catch {
    return null;
  }
}

export async function getAnswers(): Promise<Answer[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, participant_id, question_index, selected_option_index,
           is_correct, response_time_ms, points_earned, time_limit_seconds,
           option_order, answered_at
    FROM answers ORDER BY question_index, response_time_ms
  `;
  return rows.map((row) => ({
    id: row.id,
    participantId: row.participant_id,
    questionIndex: row.question_index,
    selectedOptionIndex: row.selected_option_index,
    isCorrect: row.is_correct,
    responseTimeMs: row.response_time_ms,
    pointsEarned: row.points_earned ?? 0,
    timeLimitSeconds: row.time_limit_seconds,
    optionOrder: parseOptionOrder(row.option_order),
    answeredAt: row.answered_at,
  }));
}

export async function resetQuiz() {
  const sql = getSql();
  await sql`DELETE FROM answers`;
  await sql`DELETE FROM participants`;
  await sql`
    UPDATE quiz_state SET
      status = 'waiting',
      current_question_index = -1,
      question_started_at = NULL,
      option_order = NULL,
      session_version = session_version + 1,
      updated_at = NOW()
    WHERE id = 1
  `;
}
