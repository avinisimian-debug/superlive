"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { useAuth } from "@/lib/auth";
import { LogoMark } from "./icons";

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const redirect = useMemo(() => {
    const target = searchParams.get("redirect");
    return target && target.startsWith("/") ? target : "/";
  }, [searchParams]);

  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, redirect, router]);

  return (
    <div className="full-bleed relative flex min-h-dvh w-full items-center justify-center overflow-y-auto bg-slate-50 px-5 py-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-aura absolute -top-32 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.2),transparent)]" />
        <div className="absolute bottom-[-8rem] left-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.16),transparent)]" />
      </div>

      <div className="relative my-auto w-full max-w-md">
        <Link
          href="/"
          className="mb-5 flex items-center justify-center gap-2 text-slate-500 transition hover:text-slate-800"
        >
          <LogoMark className="h-7 w-7" />
          <span className="text-[0.85rem] font-bold">חזרה לאפליקציה</span>
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lift">
          <LoginForm onSuccess={() => router.replace(redirect)} />
        </div>

        <p className="mt-5 text-center text-[0.78rem] text-slate-400">
          זרם · התחברות מאובטחת עם מייל וסיסמה
        </p>
      </div>
    </div>
  );
}
