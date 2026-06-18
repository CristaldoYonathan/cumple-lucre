"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ResetModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  loading: boolean;
}

export function ResetModal({ open, onClose, onConfirm, loading }: ResetModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setPassword("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await onConfirm(password);
      onClose();
    } catch {
      setError("Contraseña incorrecta");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        <div className="modal-icon">
          <AlertTriangle size={32} className="icon-warning" />
        </div>
        <h2>🔄 ¿Reiniciar todo?</h2>
        <p className="card-desc">
          Se eliminarán <strong>todos los participantes</strong> y{" "}
          <strong>todos los puntajes</strong>. Esta acción no se puede deshacer.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Ingresá la contraseña admin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoFocus
          />
          {error && <p className="error-msg">{error}</p>}
          <div className="modal-btns">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading || !password}
            >
              {loading ? "Reiniciando..." : "Sí, reiniciar todo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
