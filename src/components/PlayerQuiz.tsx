"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Cherry,
  Clock,
  Gamepad2,
  PartyPopper,
  Sparkles,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { ConfettiBackground } from "./ConfettiBackground";
import { TimerBar } from "./TimerBar";
import { formatPoints } from "@/lib/scoring";
import { isQuestionTimeExpired } from "@/lib/quizTime";
import { resizeImage } from "@/lib/resizeImage";
import type { Participant, QuestionPublic } from "@/lib/types";

interface QuizStateResponse {
  status: "waiting" | "active" | "finished";
  currentQuestionIndex: number;
  questionStartedAt: string | null;
  timeLimitSeconds: number;
  sessionVersion: number;
  question: QuestionPublic | null;
  totalQuestions: number;
}

const STORAGE_KEY = "lucre_participant";
const SESSION_KEY = "lucre_session_version";

type Phase = "register" | "lobby" | "playing" | "answered" | "finished";

export function PlayerQuiz() {
  const [phase, setPhase] = useState<Phase>("register");
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [quizState, setQuizState] = useState<QuizStateResponse | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [error, setError] = useState("");
  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const lastQuestionRef = useRef(-1);
  const questionStartRef = useRef<number>(0);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
    setParticipant(null);
    setPhase("register");
    setTotalPoints(0);
    setCorrectCount(0);
    lastQuestionRef.current = -1;
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const p = JSON.parse(stored) as Participant;
        setParticipant(p);
        setPhase("lobby");
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const fetchState = useCallback(async () => {
    const res = await fetch("/api/quiz/state");
    if (!res.ok) return;
    const data: QuizStateResponse = await res.json();

    const storedVersion = Number(localStorage.getItem(SESSION_KEY) ?? 0);
    if (data.sessionVersion > storedVersion) {
      clearSession();
      localStorage.setItem(SESSION_KEY, String(data.sessionVersion));
      setQuizState(data);
      return;
    }
    if (storedVersion === 0) {
      localStorage.setItem(SESSION_KEY, String(data.sessionVersion));
    }

    setQuizState(data);

    if (data.status === "finished") {
      setPhase("finished");
      return;
    }

    if (data.status === "active" && data.question) {
      if (data.currentQuestionIndex !== lastQuestionRef.current) {
        lastQuestionRef.current = data.currentQuestionIndex;
        questionStartRef.current = Date.now();
        setSelectedOption(null);
        setTimeExpired(false);
        setPhase("playing");
      } else if (
        isQuestionTimeExpired(data.questionStartedAt, data.timeLimitSeconds)
      ) {
        setTimeExpired(true);
      }
    } else if (data.status === "waiting") {
      if (participant) setPhase("lobby");
      else setPhase("register");
    }
  }, [participant, clearSession]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 1500);
    return () => clearInterval(id);
  }, [fetchState]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setCompressingPhoto(true);
    try {
      const compressed = await resizeImage(file);
      setPhoto(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la foto");
      setPhoto(null);
    } finally {
      setCompressingPhoto(false);
      e.target.value = "";
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("¡Escribí tu nombre!");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), profilePhoto: photo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al registrarse");
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setParticipant(data);
      setPhase("lobby");
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    setTimeExpired(true);
  }, []);

  const submitAnswer = async (optionIndex: number) => {
    if (!participant || !quizState?.question || submitting || timeExpired) return;

    if (
      isQuestionTimeExpired(
        quizState.questionStartedAt,
        quizState.timeLimitSeconds
      )
    ) {
      setTimeExpired(true);
      return;
    }

    setSubmitting(true);
    setSelectedOption(optionIndex);

    const responseTimeMs = Date.now() - questionStartRef.current;

    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: participant.id,
          questionIndex: quizState.currentQuestionIndex,
          selectedOptionIndex: optionIndex,
          responseTimeMs,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTotalPoints((p) => p + (data.pointsEarned ?? 0));
        if (data.isCorrect) setCorrectCount((c) => c + 1);
        setPhase("answered");
      } else if (data.error === "Se acabó el tiempo") {
        setTimeExpired(true);
        setSelectedOption(null);
      }
    } catch {
      setError("No se pudo enviar la respuesta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrap">
      <ConfettiBackground />

      <header className="hero">
        <p className="hero-badge">
          <Cherry size={18} className="icon-inline icon-strawberry" />
          Quiz de cumpleaños
        </p>
        <h1>¿Cuánto conocés a Lucre?</h1>
        <p className="hero-sub">
          <Sparkles size={16} className="icon-inline icon-purple" />
          Lucrecia · La cumpleañera del día
        </p>
      </header>

      {phase === "register" && (
        <section className="card">
          <h2>
            <PartyPopper size={22} className="icon-inline icon-pink" />
            ¡Sumate al juego!
          </h2>
          <p className="card-desc">Poné tu nombre y una foto para que todos te reconozcan</p>
          <form onSubmit={handleRegister} className="register-form">
            <div className="photo-upload">
              <label className={`photo-label ${compressingPhoto ? "photo-label-loading" : ""}`}>
                {compressingPhoto ? (
                  <span className="photo-placeholder">
                    <Camera size={28} className="icon-purple" />
                    <br />
                    Comprimiendo...
                  </span>
                ) : photo ? (
                  <img src={photo} alt="Tu foto" className="photo-preview" />
                ) : (
                  <span className="photo-placeholder">
                    <Camera size={28} className="icon-purple" />
                    <br />
                    Foto
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={compressingPhoto}
                />
              </label>
            </div>
            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              maxLength={50}
            />
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Registrando..." : (
                <>
                  <Gamepad2 size={18} />
                  ¡Listo, quiero jugar!
                </>
              )}
            </button>
          </form>
        </section>
      )}

      {phase === "lobby" && participant && (
        <section className="card card-lobby">
          <div className="player-badge">
            {participant.profilePhoto ? (
              <img
                src={participant.profilePhoto}
                alt={participant.name}
                className="player-avatar"
              />
            ) : (
              <div className="player-avatar player-avatar-fallback">
                {participant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="player-name">¡Hola, {participant.name}!</p>
              <p className="player-wait">
                <Clock size={16} className="icon-inline icon-purple" />
                Esperando que empiece el quiz...
              </p>
            </div>
          </div>
          <div className="pulse-dots">
            <span /><span /><span />
          </div>
          <p className="lobby-hint">La admin va a iniciar el juego cuando estén todos 🍓</p>
        </section>
      )}

      {(phase === "playing" || phase === "answered") && quizState?.question && (
        <section className="card card-quiz">
          <div className="question-header">
            <span className="question-num">
              Pregunta {quizState.currentQuestionIndex + 1} / {quizState.totalQuestions}
            </span>
            {quizState.questionStartedAt && (
              <TimerBar
                startedAt={quizState.questionStartedAt}
                timeLimitSeconds={quizState.timeLimitSeconds}
                onTimeUp={handleTimeUp}
              />
            )}
          </div>

          <h2 className="question-text">{quizState.question.text}</h2>

          <div className="options-grid">
            {quizState.question.options.map((opt, i) => {
              const colors = ["opt-pink", "opt-yellow", "opt-purple", "opt-blue", "opt-green"];
              const isSelected = selectedOption === i;
              const disabled =
                phase === "answered" || submitting || timeExpired;

              return (
                <button
                  key={i}
                  className={`option-btn ${colors[i % colors.length]} ${isSelected ? "option-selected" : ""}`}
                  onClick={() => submitAnswer(i)}
                  disabled={disabled}
                >
                  <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {phase === "answered" && (
            <p className="answered-msg">
              ✅ ¡Respuesta enviada! Esperá la siguiente...
            </p>
          )}

          {timeExpired && phase === "playing" && (
            <p className="timeout-msg">⏰ ¡Se acabó el tiempo! Esperá la siguiente...</p>
          )}
        </section>
      )}

      {phase === "finished" && participant && (
        <section className="card card-finished">
          <div className="finished-emoji">
            <Trophy size={48} className="icon-yellow" />
          </div>
          <h2>¡Fin del quiz!</h2>
          <p className="finished-score">
            Puntaje: <strong>{formatPoints(totalPoints)}</strong> pts
          </p>
          <p className="finished-detail">
            {correctCount} de {quizState?.totalQuestions ?? 12} correctas
          </p>
          <p className="finished-thanks">¡Gracias por jugar, {participant.name}! 💖</p>
        </section>
      )}
    </div>
  );
}
