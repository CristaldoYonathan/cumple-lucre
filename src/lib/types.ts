export type QuizStatus = "waiting" | "active" | "finished";

export interface QuizState {
  status: QuizStatus;
  currentQuestionIndex: number;
  questionStartedAt: string | null;
  timeLimitSeconds: number;
  optionOrder: number[] | null;
  sessionVersion: number;
}

export interface Participant {
  id: number;
  name: string;
  profilePhoto: string | null;
  createdAt: string;
}

export interface Answer {
  id: number;
  participantId: number;
  questionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
  responseTimeMs: number;
  pointsEarned: number;
  timeLimitSeconds: number | null;
  optionOrder: number[] | null;
  answeredAt: string;
}

export interface QuestionPublic {
  index: number;
  text: string;
  options: string[];
}

export interface ParticipantResult {
  participant: Participant;
  answers: Answer[];
  totalCorrect: number;
  totalPoints: number;
  totalTimeMs: number;
}
