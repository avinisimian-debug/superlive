"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { AdminOverview, ActivityEvent, UserRole } from "@/lib/types";
import {
  LogoMark,
  UsersIcon,
  ChartIcon,
  RadarIcon,
  ShieldIcon,
  UserIcon,
  WazeIcon,
  ShareIcon,
} from "./icons";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "מנהל",
  user: "משתמש",
};

function fmt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ActivityIcon({ type }: { type: ActivityEvent["type"] }) {
  const cls = "h-4 w-4";
  if (type === "login") return <UserIcon className={cls} />;
  if (type === "report") return <WazeIcon className={cls} />;
  return <ShareIcon className={cls} />;
}

export function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login?redirect=/admin");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || user?.role !== "admin") return;
    let active = true;
    fetch("/api/admin/overview", { cache: "no-store" })
      .then(async (res) => {
        if (!active) return;
        if (res.status === 401) {
          router.replace("/login?redirect=/admin");
          return;
        }
        if (res.status === 403) {
          setError("forbidden");
          return;
        }
        if (!res.ok) {
          setError("load_failed");
          return;
        }
        const json = (await res.json()) as AdminOverview;
        if (active) setData(json);
      })
      .catch(() => {
        if (active) setError("load_failed");
      });
    return () => {
      active = false;
    };
  }, [authLoading, user, router]);

  if (authLoading || (!user && !error)) {
    return (
      <div className="full-bleed flex min-h-dvh items-center justify-center bg-slate-50">
        <p className="text-[0.9rem] font-semibold text-slate-400">טוען…</p>
      </div>
    );
  }

  if (user && user.role !== "admin") {
    return (
      <div
        data-testid="admin-unauthorized"
        className="full-bleed flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center"
      >
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldIcon className="h-7 w-7" />
        </span>
        <h1 className="text-[1.3rem] font-extrabold text-slate-900">
          אין הרשאה לגשת לפאנל הניהול
        </h1>
        <p className="max-w-sm text-[0.9rem] text-slate-500">
          החשבון <span dir="ltr" className="font-bold">{user.email}</span> אינו
          בעל הרשאות מנהל.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-5 text-[0.9rem] font-bold text-white"
        >
          חזרה לאפליקציה
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="full-bleed flex min-h-dvh items-center justify-center bg-slate-50">
        <p className="text-[0.9rem] font-semibold text-slate-400">
          {error === "forbidden" ? "אין הרשאה" : "טוען נתוני ניהול…"}
        </p>
      </div>
    );
  }

  const { stats, users, activity } = data;

  return (
    <div
      data-testid="admin-dashboard"
      className="full-bleed min-h-dvh bg-slate-50"
    >
      {/* header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-glow">
              <ShieldIcon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-[1.2rem] font-extrabold tracking-tight text-slate-900">
                פאנל ניהול Zerem
              </h1>
              <p className="text-[0.78rem] font-semibold text-slate-400">
                סקירה, משתמשים ופעילות בזמן אמת
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              data-testid="admin-email-badge"
              dir="ltr"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[0.76rem] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-500/15"
            >
              <ShieldIcon className="h-3.5 w-3.5" />
              {user?.email}
            </span>
            <Link
              href="/"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-[0.82rem] font-bold text-white transition hover:bg-slate-800"
            >
              <LogoMark className="h-4 w-4" />
              חזרה לאפליקציה
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        {/* stats */}
        <div className="grid gap-5 sm:grid-cols-3">
          <StatCard
            testid="stat-users"
            icon={<UsersIcon className="h-5 w-5" />}
            tint="from-emerald-500 to-teal-500"
            label="סך משתמשים רשומים"
            value={stats.totalUsers}
          />
          <StatCard
            testid="stat-logins"
            icon={<ChartIcon className="h-5 w-5" />}
            tint="from-sky-500 to-indigo-500"
            label="כניסות היום"
            value={stats.loginsToday}
          />
          <StatCard
            testid="stat-reports"
            icon={<RadarIcon className="h-5 w-5" />}
            tint="from-violet-500 to-fuchsia-500"
            label="סך דיווחי עומס"
            value={stats.totalReports}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* users table */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-[1.02rem] font-bold text-slate-900">
                משתמשים רשומים
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.72rem] font-bold text-slate-500">
                {users.length}
              </span>
            </div>

            {users.length === 0 ? (
              <p className="px-5 py-10 text-center text-[0.88rem] text-slate-400">
                אין משתמשים רשומים עדיין.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table data-testid="users-table" className="w-full text-right">
                  <thead>
                    <tr className="border-b border-slate-100 text-[0.72rem] font-bold uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-bold">שם</th>
                      <th className="px-5 py-3 font-bold">מייל</th>
                      <th className="px-5 py-3 font-bold">הצטרפות</th>
                      <th className="px-5 py-3 font-bold">כניסה אחרונה</th>
                      <th className="px-5 py-3 font-bold">תפקיד</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.email}
                        className="border-b border-slate-50 text-[0.86rem] last:border-0 hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {u.name || "—"}
                        </td>
                        <td
                          dir="ltr"
                          className="px-5 py-3.5 text-left font-semibold text-slate-800"
                        >
                          {u.email}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {fmt(u.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {fmt(u.lastLoginAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${
                              u.role === "admin"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {ROLE_LABEL[u.role]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* activity feed */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-[1.02rem] font-bold text-slate-900">
                יומן פעילות
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-bold text-emerald-600">
                <span className="live-dot" aria-hidden="true" />
                LIVE
              </span>
            </div>

            <ul
              data-testid="activity-feed"
              className="max-h-[26rem] space-y-1 overflow-y-auto px-3 py-3"
            >
              {activity.length === 0 ? (
                <li className="px-2 py-10 text-center text-[0.86rem] text-slate-400">
                  אין פעילות להצגה.
                </li>
              ) : (
                activity.map((e, i) => (
                  <li
                    key={`${e.at}-${i}`}
                    className="flex items-start gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-slate-50"
                  >
                    <span
                      className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        e.type === "login"
                          ? "bg-emerald-50 text-emerald-600"
                          : e.type === "report"
                            ? "bg-violet-50 text-violet-600"
                            : "bg-sky-50 text-sky-600"
                      }`}
                    >
                      <ActivityIcon type={e.type} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.85rem] font-semibold text-slate-800">
                        {e.text}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.72rem] text-slate-400">
                        {e.email ? (
                          <span dir="ltr" className="font-medium">
                            {e.email}
                          </span>
                        ) : null}
                        <span>{fmt(e.at)}</span>
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  testid,
  icon,
  tint,
  label,
  value,
}: {
  testid: string;
  icon: React.ReactNode;
  tint: string;
  label: string;
  value: number;
}) {
  return (
    <div
      data-testid={testid}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card"
    >
      <div
        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tint} text-white shadow-glow`}
      >
        {icon}
      </div>
      <p className="mt-4 text-[2rem] font-extrabold tracking-tight text-slate-900">
        {value.toLocaleString("he-IL")}
      </p>
      <p className="mt-0.5 text-[0.86rem] font-semibold text-slate-500">
        {label}
      </p>
    </div>
  );
}
