"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Gamepad2,
  Lock,
  Play,
  RefreshCw,
  RotateCcw,
  SkipForward,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { ConfettiBackground } from "./ConfettiBackground";
import { ResetModal } from "./ResetModal";
import { TimerBar } from "./TimerBar";
import { getPublicQuestion } from "@/lib/questions";
import { formatPoints } from "@/lib/scoring";
import type { Participant, QuizState } from "@/lib/types";

interface AdminData {
  state: QuizState;
  participants: Participant[];
  results: {
    participant: Participant;
    totalCorrect: number;
    totalPoints: number;
    totalTimeMs: number;
    answers: {
      questionIndex: number;
      isCorrect: boolean;
      responseTimeMs: number;
      pointsEarned: number;
    }[];
  }[];
  questionStats: {
    index: number;
    text: string;
    correctOption: string;
    answers: {
      participantName: string;
      selectedOption: string;
      isCorrect: boolean;
      responseTimeMs: number;
      pointsEarned: number;
      timeLimitSeconds: number;
      pointsDetail: string;
    }[];
  }[];
  totalQuestions: number;
}

function formatMs(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTimeVsLimit(responseMs: number, limitSeconds: number) {
  return `${formatMs(responseMs)} de ${limitSeconds}s`;
}

function parseTimeLimitInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  if (isNaN(n)) return null;
  return Math.min(120, Math.max(5, n));
}

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [nextTimeLimit, setNextTimeLimit] = useState(15);
  const [timeLimitInput, setTimeLimitInput] = useState("15");
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"control" | "results" | "questions">("control");

  const checkSession = useCallback(async () => {
    const res = await fetch("/api/admin/session");
    const json = await res.json();
    setAuthenticated(json.authenticated);
    setChecking(false);
  }, []);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/admin/results");
    if (res.ok) {
      const json = await res.json();
      setData(json);
      if (json.state.status === "waiting") {
        setNextTimeLimit(json.state.timeLimitSeconds);
        setTimeLimitInput(String(json.state.timeLimitSeconds));
      }
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!authenticated) return;
    fetchData();
    const id = setInterval(fetchData, 2000);
    return () => clearInterval(id);
  }, [authenticated, fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
      setPassword("");
    } else {
      setLoginError("Contraseña incorrecta 🔒");
    }
  };

  const commitTimeLimit = useCallback((): number => {
    const parsed = parseTimeLimitInput(timeLimitInput);
    if (parsed === null) {
      setTimeLimitInput(String(nextTimeLimit));
      return nextTimeLimit;
    }
    setTimeLimitInput(String(parsed));
    setNextTimeLimit(parsed);
    return parsed;
  }, [timeLimitInput, nextTimeLimit]);

  const persistTimeLimitIfWaiting = useCallback(
    async (seconds: number) => {
      if (data?.state.status !== "waiting") return;
      await fetch("/api/admin/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setTimeLimit", timeLimitSeconds: seconds }),
      });
    },
    [data?.state.status]
  );

  const handleTimeLimitBlur = async () => {
    const committed = commitTimeLimit();
    await persistTimeLimitIfWaiting(committed);
  };

  const control = async (action: string) => {
    const limit = commitTimeLimit();
    setLoading(true);
    await fetch("/api/admin/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, timeLimitSeconds: limit }),
    });
    await fetchData();
    setLoading(false);
  };

  const handleReset = async (resetPassword: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    if (!res.ok) {
      setLoading(false);
      throw new Error("Contraseña incorrecta");
    }
    await fetchData();
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="page-wrap admin-wrap">
        <p className="loading-text">Cargando...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="page-wrap admin-wrap">
        <ConfettiBackground />
        <section className="card card-login">
          <h1>
            <Lock size={24} className="icon-inline icon-purple" />
            Admin
          </h1>
          <p className="card-desc">Panel de control del quiz de Lucre</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
            {loginError && <p className="error-msg">{loginError}</p>}
            <button type="submit" className="btn btn-primary">
              Entrar
            </button>
          </form>
        </section>
      </div>
    );
  }

  const state = data?.state;
  const currentQuestion =
    state &&
    state.status === "active" &&
    state.currentQuestionIndex >= 0 &&
    state.optionOrder
      ? getPublicQuestion(state.currentQuestionIndex, state.optionOrder)
      : null;

  return (
    <div className="page-wrap admin-wrap">
      <ConfettiBackground />
      <ResetModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        loading={loading}
      />

      <header className="hero hero-admin">
        <h1>🎀 Panel Admin</h1>
        <p className="hero-sub">Quiz de cumpleaños de Lucre</p>
      </header>

      <nav className="admin-tabs">
        {(
          [
            { id: "control", label: "Control", icon: Gamepad2, color: "icon-pink" },
            { id: "results", label: "Resultados", icon: Trophy, color: "icon-yellow" },
            { id: "questions", label: "Por pregunta", icon: BarChart3, color: "icon-purple" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} className={`icon-inline ${tab.color}`} />
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "control" && (
        <div className="admin-grid">
          <section className="card">
            <h2>Estado del juego</h2>
            <div className="status-badge">
              {state?.status === "waiting" && "⏳ Esperando jugadores"}
              {state?.status === "active" && "▶️ En curso"}
              {state?.status === "finished" && "✅ Finalizado"}
            </div>

            {currentQuestion && state?.questionStartedAt && (
              <div className="admin-question-live">
                <p className="current-q">
                  Pregunta {state.currentQuestionIndex + 1}: {currentQuestion.text}
                </p>
                <TimerBar
                  startedAt={state.questionStartedAt}
                  timeLimitSeconds={state.timeLimitSeconds}
                />
                <ul className="admin-options-preview">
                  {currentQuestion.options.map((opt, i) => (
                    <li key={i}>
                      <span className="option-letter-sm">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="participant-count">
              <Users size={18} className="icon-inline icon-pink" />
              {data?.participants.length ?? 0} participantes
            </p>

            <div className="time-setting">
              <label>
                <Timer size={16} className="icon-inline icon-purple" />
                Tiempo por pregunta (seg):
                <input
                  type="text"
                  inputMode="numeric"
                  value={timeLimitInput}
                  onChange={(e) =>
                    setTimeLimitInput(e.target.value.replace(/[^\d]/g, ""))
                  }
                  onBlur={handleTimeLimitBlur}
                  className="input input-small"
                  aria-label="Tiempo por pregunta en segundos"
                />
              </label>
              {state?.status === "active" && (
                <p className="time-hint">
                  Ahora: <strong>{state.timeLimitSeconds}s</strong> · el cambio aplica a la{" "}
                  <strong>siguiente</strong> pregunta
                </p>
              )}
              {state?.status === "waiting" && (
                <p className="time-hint">
                  Se aplicará al iniciar el quiz
                </p>
              )}
              <p className="time-hint">
                ⚡ Los primeros{" "}
                {Math.round((parseTimeLimitInput(timeLimitInput) ?? nextTimeLimit) * 0.2)}s
                dan puntaje completo (1.000 pts)
              </p>
            </div>

            <div className="control-btns">
              {state?.status === "waiting" && (
                <button
                  className="btn btn-primary"
                  onClick={() => control("start")}
                  disabled={loading}
                >
                  <Play size={18} />
                  Iniciar quiz
                </button>
              )}
              {state?.status === "active" && (
                <button
                  className="btn btn-primary"
                  onClick={() => control("next")}
                  disabled={loading}
                >
                  <SkipForward size={18} />
                  Siguiente pregunta
                </button>
              )}
              {state?.status === "finished" && (
                <button
                  className="btn btn-secondary"
                  onClick={() => control("waiting")}
                  disabled={loading}
                >
                  <RotateCcw size={18} />
                  Volver a lobby
                </button>
              )}
              <button
                className="btn btn-danger"
                onClick={() => setShowResetModal(true)}
                disabled={loading}
              >
                <RefreshCw size={18} />
                Reiniciar todo
              </button>
            </div>
          </section>

          <section className="card">
            <h2>
              <Users size={20} className="icon-inline icon-pink" />
              Participantes
            </h2>
            {data?.participants.length === 0 && (
              <p className="empty-msg">Nadie se registró aún</p>
            )}
            <ul className="participant-list">
              {data?.participants.map((p) => (
                <li key={p.id} className="participant-item">
                  {p.profilePhoto ? (
                    <img src={p.profilePhoto} alt="" className="list-avatar" />
                  ) : (
                    <div className="list-avatar list-avatar-fallback">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <span>{p.name}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {activeTab === "results" && (
        <section className="card">
          <h2>
            <Trophy size={22} className="icon-inline icon-yellow" />
            Ranking
          </h2>
          <p className="scoring-legend">
            Hasta 1.000 pts por pregunta · zona rápida (20% del tiempo) = puntaje completo
          </p>
          {data?.results.length === 0 && (
            <p className="empty-msg">Sin resultados aún</p>
          )}
          <div className="results-table-wrap">
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jugador</th>
                  <th>Puntos</th>
                  <th>Aciertos</th>
                  <th>Tiempo total</th>
                </tr>
              </thead>
              <tbody>
                {data?.results.map((r, i) => (
                  <tr key={r.participant.id}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="table-player">
                        {r.participant.profilePhoto ? (
                          <img
                            src={r.participant.profilePhoto}
                            alt=""
                            className="table-avatar"
                          />
                        ) : (
                          <div className="table-avatar table-avatar-fallback">
                            {r.participant.name.charAt(0)}
                          </div>
                        )}
                        {r.participant.name}
                      </div>
                    </td>
                    <td>
                      <strong className="points-cell">
                        {formatPoints(r.totalPoints)}
                      </strong>
                    </td>
                    <td>
                      {r.totalCorrect} / {data.totalQuestions}
                    </td>
                    <td>{formatMs(r.totalTimeMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "questions" && (
        <div className="questions-stats">
          {data?.questionStats.map((qs) => (
            <section key={qs.index} className="card card-question-stat">
              <h3>
                {qs.index + 1}. {qs.text}
              </h3>
              <p className="correct-answer">
                ✅ Correcta: <strong>{qs.correctOption}</strong>
              </p>
              {qs.answers.length === 0 ? (
                <p className="empty-msg">Sin respuestas</p>
              ) : (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Jugador</th>
                      <th>Respuesta</th>
                      <th>Tiempo</th>
                      <th>Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qs.answers
                      .sort((a, b) => b.pointsEarned - a.pointsEarned)
                      .map((a, i) => (
                        <tr
                          key={i}
                          className={a.isCorrect ? "row-correct" : "row-wrong"}
                        >
                          <td>{a.participantName}</td>
                          <td>
                            {a.isCorrect ? "✅" : "❌"} {a.selectedOption}
                          </td>
                          <td>
                            {formatTimeVsLimit(a.responseTimeMs, a.timeLimitSeconds)}
                          </td>
                          <td className="points-detail">{a.pointsDetail}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
