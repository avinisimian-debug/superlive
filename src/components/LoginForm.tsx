"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLive } from "@/lib/store";
import type { AuthUser } from "@/lib/types";
import { LogoMark } from "./icons";

type Mode = "login" | "signup";

export function LoginForm({
  onSuccess,
  title = "התחברות ל-Zerem",
}: {
  onSuccess?: (user: AuthUser) => void;
  title?: string;
}) {
  const { setUser } = useAuth();
  const { showToast } = useLive();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = async () => {
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (mode === "signup" && cleanName.length < 2) {
      setError("נא להזין שם מלא (לפחות 2 תווים)");
      return;
    }
    if (!cleanEmail) {
      setError("נא להזין כתובת מייל");
      return;
    }
    if (password.length < 4) {
      setError("הסיסמה חייבת להכיל לפחות 4 תווים");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        mode === "signup" ? "/api/auth/signup" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "signup"
              ? { name: cleanName, email: cleanEmail, password }
              : { email: cleanEmail, password },
          ),
        },
      );
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        user?: AuthUser;
      };
      if (!res.ok || !data.success || !data.user) {
        setError(
          data.error ||
            (mode === "signup"
              ? "ההרשמה נכשלה, נסו שוב"
              : "מייל או סיסמה שגויים"),
        );
        return;
      }

      setUser(data.user);
      try {
        window.localStorage.setItem("zerem_user", JSON.stringify(data.user));
      } catch {
        /* storage may be unavailable — the cookie still persists the session */
      }
      if (mode === "signup") {
        showToast(`ברוך הבא, ${data.user.name || cleanName}!`);
      }
      onSuccess?.(data.user);
    } catch {
      setError("שגיאת רשת. בדקו את החיבור ונסו שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="login-form" className="w-full">
      <div className="flex flex-col items-center text-center">
        <LogoMark className="h-12 w-12" />
        <h2 className="mt-3 text-[1.35rem] font-extrabold tracking-tight text-slate-900">
          {mode === "signup" ? "הרשמה ל-Zerem" : title}
        </h2>
        <p className="mt-1 text-[0.9rem] text-slate-500">
          {mode === "signup"
            ? "פתחו חשבון עם שם, מייל וסיסמה"
            : "התחברו עם המייל והסיסמה שלכם"}
        </p>
      </div>

      {error ? (
        <p
          data-testid="login-error"
          className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-center text-[0.85rem] font-semibold text-red-700 ring-1 ring-inset ring-red-200"
        >
          {error}
        </p>
      ) : null}

      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div
          data-testid="login-mode-tabs"
          className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
        >
          <button
            type="button"
            data-testid="tab-login"
            aria-pressed={mode === "login"}
            onClick={() => switchMode("login")}
            className={`min-h-10 rounded-lg text-[0.9rem] font-bold transition ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            התחברות
          </button>
          <button
            type="button"
            data-testid="tab-signup"
            aria-pressed={mode === "signup"}
            onClick={() => switchMode("signup")}
            className={`min-h-10 rounded-lg text-[0.9rem] font-bold transition ${
              mode === "signup"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            הרשמה
          </button>
        </div>

        {mode === "signup" ? (
          <>
            <label className="block text-[0.82rem] font-bold text-slate-700">
              שם מלא
            </label>
            <input
              data-testid="signup-name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ישראל ישראלי"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-right text-[0.95rem] text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </>
        ) : null}

        <label
          className={`block text-[0.82rem] font-bold text-slate-700 ${
            mode === "signup" ? "mt-4" : ""
          }`}
        >
          כתובת מייל
        </label>
        <input
          data-testid="login-email"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-[0.95rem] text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />

        <label className="mt-4 block text-[0.82rem] font-bold text-slate-700">
          סיסמה
        </label>
        <input
          data-testid="login-password"
          type="password"
          dir="ltr"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={4}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-[0.95rem] text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />

        <button
          type="submit"
          data-testid="login-submit"
          disabled={loading}
          className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 text-[1.05rem] font-bold text-white shadow-glow transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
        >
          {loading
            ? "רק רגע…"
            : mode === "signup"
              ? "הרשמה וכניסה"
              : "התחברות"}
        </button>
      </form>
    </div>
  );
}