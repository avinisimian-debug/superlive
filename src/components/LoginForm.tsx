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
        /* storage may be unavailable */
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
        <LogoMark className="h-12 w-12 rounded-2xl border border-cyan-500/30 shadow-md shadow-cyan-500/20" />
        <h2 className="mt-3 text-lg font-black tracking-tight text-white">
          {mode === "signup" ? "פתיחת חשבון Zerem" : title}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {mode === "signup"
            ? "הצטרפו לקהילת הפינטק של Zerem לחיסכון בזמן בקניות"
            : "התחברו עם המייל והסיסמה שלכם"}
        </p>
      </div>

      {error ? (
        <p
          data-testid="login-error"
          className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-2.5 text-center text-xs font-bold text-rose-300"
        >
          {error}
        </p>
      ) : null}

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div
          data-testid="login-mode-tabs"
          className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1"
        >
          <button
            type="button"
            data-testid="tab-login"
            aria-pressed={mode === "login"}
            onClick={() => switchMode("login")}
            className={`min-h-9 rounded-lg text-xs font-bold transition ${
              mode === "login"
                ? "border border-cyan-500/40 bg-slate-800 text-cyan-300 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            התחברות
          </button>
          <button
            type="button"
            data-testid="tab-signup"
            aria-pressed={mode === "signup"}
            onClick={() => switchMode("signup")}
            className={`min-h-9 rounded-lg text-xs font-bold transition ${
              mode === "signup"
                ? "border border-cyan-500/40 bg-slate-800 text-cyan-300 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            הרשמה
          </button>
        </div>

        {mode === "signup" ? (
          <>
            <label className="block text-xs font-bold text-slate-300">
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
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-right text-xs font-semibold text-white outline-none transition focus:border-cyan-500/70"
            />
          </>
        ) : null}

        <label
          className={`block text-xs font-bold text-slate-300 ${
            mode === "signup" ? "mt-3" : ""
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
          className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-left text-xs font-semibold text-white outline-none transition focus:border-cyan-500/70"
        />

        <label className="mt-3 block text-xs font-bold text-slate-300">
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
          className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-left text-xs font-semibold text-white outline-none transition focus:border-cyan-500/70"
        />

        <button
          type="submit"
          data-testid="login-submit"
          disabled={loading}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 text-sm font-black text-slate-950 shadow-md shadow-cyan-400/20 transition hover:bg-cyan-300 active:scale-[0.99] disabled:opacity-60"
        >
          {loading
            ? "מאמת נתונים…"
            : mode === "signup"
              ? "פתיחת חשבון וכניסה"
              : "התחברות לחשבון"}
        </button>
      </form>
    </div>
  );
}
