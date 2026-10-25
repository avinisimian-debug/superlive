"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { LoginModal } from "./LoginModal";
import { UserIcon, LogoutIcon, ShieldIcon } from "./icons";

export function AuthButton({ tone = "light" }: { tone?: "light" | "dark" } = {}) {
  const dark = tone === "dark";
  const { user, logout, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  if (loading) {
    return (
      <span className={`inline-flex h-9 w-24 animate-pulse rounded-full ${dark ? "bg-white/10" : "bg-slate-100"}`} />
    );
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          data-testid="auth-login-btn"
          onClick={() => setLoginOpen(true)}
          className={`press inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[0.74rem] font-bold ${
            dark
              ? "glass-dark text-white hover:bg-white/15"
              : "bg-ink-900 text-white shadow-sm hover:bg-ink-800"
          }`}
        >
          <UserIcon className="h-3.5 w-3.5" />
          התחברות
        </button>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  }

  const initial = user.email.charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        data-testid="auth-profile-btn"
        onClick={() => setMenuOpen((v) => !v)}
        className={`press inline-flex h-9 items-center gap-2 rounded-full pe-3 ps-1 text-[0.72rem] font-bold text-white ${
          dark ? "glass-dark" : "bg-ink-900"
        }`}
      >
        <span className="bg-brand-gradient inline-flex h-7 w-7 items-center justify-center rounded-full text-[0.72rem] font-extrabold">
          {initial}
        </span>
        <span dir="ltr" className="max-w-28 truncate">
          {user.email.split("@")[0]}
        </span>
      </button>

      {menuOpen ? (
        <div
          data-testid="auth-menu"
          className="animate-pop absolute end-0 top-[calc(100%+0.5rem)] z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-float"
        >
          <div className="px-3 py-2">
            <p className="text-[0.68rem] font-semibold text-slate-400">
              מחובר בתור
            </p>
            <p dir="ltr" className="truncate text-[0.82rem] font-bold text-slate-800">
              {user.email}
            </p>
            <span
              className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[0.62rem] font-bold ${
                user.role === "admin"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {user.role === "admin" ? "מנהל" : "משתמש"}
            </span>
          </div>

          {user.role === "admin" ? (
            <Link
              href="/admin"
              data-testid="auth-admin-link"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-[0.85rem] font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <ShieldIcon className="h-4 w-4 text-emerald-600" />
              פאנל ניהול
            </Link>
          ) : null}

          <button
            type="button"
            data-testid="auth-logout"
            onClick={() => {
              setMenuOpen(false);
              void logout();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[0.85rem] font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogoutIcon className="h-4 w-4" />
            התנתקות
          </button>
        </div>
      ) : null}
    </div>
  );
}
