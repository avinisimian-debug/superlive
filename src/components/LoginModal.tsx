"use client";

import { useEffect } from "react";
import { LoginForm } from "./LoginForm";
import { CloseIcon } from "./icons";
import type { AuthUser } from "@/lib/types";

export function LoginModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: (user: AuthUser) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="login-modal"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="התחברות"
        className="animate-pop relative w-full max-w-sm rounded-3xl bg-white p-7 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="סגור"
          className="absolute left-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
        >
          <CloseIcon className="h-4.5 w-4.5" />
        </button>
        <LoginForm
          onSuccess={(user) => {
            onSuccess?.(user);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
