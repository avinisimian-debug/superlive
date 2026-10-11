"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";
import { LogoMark, CheckIcon, ChevronDownIcon } from "./icons";

export function LoginForm({
  onSuccess,
  title = "התחברות ל-Zerem",
}: {
  onSuccess?: (user: AuthUser) => void;
  title?: string;
}) {
  const { setUser } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async (target: string) => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
        devOtp?: string;
      };
      if (!res.ok || !data.success) {
        setError(data.error || "שליחת הקוד נכשלה, נסו שוב");
        return;
      }
      setStep("code");
      setCode(data.devOtp ?? "");
      setDevOtp(data.devOtp ?? null);
      setNotice("שלחנו קוד בן 6 ספרות למייל שלך");
    } catch {
      setError("שגיאת רשת. בדקו את החיבור ונסו שוב");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        user?: AuthUser;
      };
      if (!res.ok || !data.success || !data.user) {
        setError(data.error || "ההתחברות נכשלה, נסו שוב");
        return;
      }
      setUser(data.user);
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
          {title}
        </h2>
        <p className="mt-1 text-[0.9rem] text-slate-500">
          {step === "email"
            ? "הזן את כתובת המייל שלך לקבלת קוד אימות"
            : "הזן את קוד האימות בן 6 הספרות שנשלח למייל"}
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

      {step === "email" ? (
        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            void sendCode(email);
          }}
        >
          <label className="block text-[0.82rem] font-bold text-slate-700">
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
          <button
            type="submit"
            data-testid="login-send"
            disabled={loading}
            className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 text-[1.05rem] font-bold text-white shadow-glow transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "שולח קוד…" : "שלח קוד אימות"}
          </button>
        </form>
      ) : (
        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          {notice ? (
            <p className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-center text-[0.82rem] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/15">
              <CheckIcon className="h-4 w-4" />
              {notice}
            </p>
          ) : null}

          <p className="mt-4 text-center text-[0.85rem] text-slate-500">
            הקוד נשלח אל{" "}
            <span dir="ltr" className="font-bold text-slate-800">
              {email}
            </span>
          </p>

          {devOtp ? (
            <button
              type="button"
              data-testid="dev-otp"
              onClick={() => setCode(devOtp)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2.5 text-center text-[0.8rem] font-semibold leading-snug text-amber-800 ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100 active:scale-[0.99]"
            >
              קוד אימות לבדיקה:{" "}
              <span className="font-mono font-extrabold tracking-wider">
                {devOtp}
              </span>{" "}
              (חבר RESEND_API_KEY לשליחה ישירה למייל)
            </button>
          ) : null}

          <label className="mt-4 block text-[0.82rem] font-bold text-slate-700">
            קוד אימות
          </label>
          <input
            data-testid="login-code"
            type="text"
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="mt-2 min-h-14 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center font-mono text-[1.75rem] tracking-[0.5em] text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />

          <button
            type="submit"
            data-testid="login-verify"
            disabled={loading || code.length < 6}
            className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[1.05rem] font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "מאמת…" : "התחבר"}
          </button>

          <div className="mt-3 flex items-center justify-center gap-4 text-[0.82rem] font-semibold">
            <button
              type="button"
              onClick={() => void sendCode(email)}
              disabled={loading}
              className="text-emerald-700 underline-offset-4 hover:underline disabled:opacity-60"
            >
              שלח קוד חדש
            </button>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
                setDevOtp(null);
              }}
              className="inline-flex items-center gap-1 text-slate-500 underline-offset-4 hover:underline"
            >
              <ChevronDownIcon className="h-3.5 w-3.5 rotate-90" />
              כתובת אחרת
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
