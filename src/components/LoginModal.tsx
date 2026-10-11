"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
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

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      data-testid="login-modal"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="התחברות"
        className="animate-pop relative my-auto w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8"
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
    </div>,
    document.body,
  );
}
