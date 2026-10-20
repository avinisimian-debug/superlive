"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLive } from "@/lib/store";
import { LoginForm } from "./LoginForm";
import {
  UserIcon,
  LogoutIcon,
  ShieldIcon,
  StarIcon,
  SparkIcon,
  DownloadIcon,
  AndroidIcon,
  AppleIcon,
  UsersIcon,
  ClockIcon,
} from "./icons";

const CONGESTION_LABELS: Record<string, string> = {
  free: "קופות פנויות",
  medium: "עומס בינוני",
  heavy: "עומס כבד",
};

const PARKING_LABELS: Record<string, string> = {
  plenty: "חניה בשפע",
  partial: "חניה חלקית",
  none: "אין חניה",
};

function formatTimeAgo(at: number): string {
  const diffMinutes = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (diffMinutes < 1) return "כרגע";
  if (diffMinutes === 1) return "לפני דקה";
  if (diffMinutes < 60) return `לפני ${diffMinutes} דקות`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return "לפני שעה";
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  return `לפני ${Math.floor(diffHours / 24)} ימים`;
}

export function PersonalArea({
  onGoToFavorites,
}: {
  onGoToFavorites: () => void;
}) {
  const { user, logout } = useAuth();
  const { favorites, myReports, totalSubmissions, showToast } = useLive();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      showToast("התנתקת בהצלחה מהחשבון");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">
            אזור אישי
          </h1>
          <p className="text-xs text-slate-400">
            פרופיל משתמש, סופרים שמורים ודיווחי קהילה
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-[0.7rem] font-bold text-cyan-300">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          Zerem Pro
        </span>
      </div>

      {user ? (
        /* Logged In View */
        <div className="space-y-4">
          {/* Profile Card */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-gradient-to-tr from-cyan-600 to-blue-600 text-xl font-black text-white shadow-md shadow-cyan-500/20">
                {(user.name ? user.name[0] : user.email[0]).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-extrabold text-white">
                    {user.name || "חבר קהילת זרם"}
                  </h2>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[0.64rem] font-bold ${
                      user.role === "admin"
                        ? "border-amber-500/40 bg-amber-950/60 text-amber-300"
                        : "border-cyan-500/40 bg-cyan-950/60 text-cyan-300"
                    }`}
                  >
                    {user.role === "admin" ? "מנהל מערכת" : "תורם קהילה פעיל"}
                  </span>
                </div>
                <p dir="ltr" className="truncate text-xs text-slate-400 text-right mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-4 text-center">
              <button
                type="button"
                onClick={onGoToFavorites}
                className="rounded-xl border border-slate-800 bg-slate-850 p-2.5 transition hover:border-slate-700"
              >
                <div className="flex items-center justify-center gap-1 text-amber-400">
                  <StarIcon filled className="h-4 w-4" />
                  <span className="text-base font-black tabular-nums">
                    {favorites.length}
                  </span>
                </div>
                <p className="mt-1 text-[0.68rem] font-semibold text-slate-400">
                  מועדפים
                </p>
              </button>

              <div className="rounded-xl border border-slate-800 bg-slate-850 p-2.5">
                <div className="flex items-center justify-center gap-1 text-cyan-400">
                  <SparkIcon className="h-4 w-4" />
                  <span className="text-base font-black tabular-nums">
                    {myReports.length}
                  </span>
                </div>
                <p className="mt-1 text-[0.68rem] font-semibold text-slate-400">
                  דיווחים שלי
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-850 p-2.5">
                <div className="flex items-center justify-center gap-1 text-emerald-400">
                  <UsersIcon className="h-4 w-4" />
                  <span className="text-base font-black tabular-nums">
                    {totalSubmissions}
                  </span>
                </div>
                <p className="mt-1 text-[0.68rem] font-semibold text-slate-400">
                  סה״כ בקהילה
                </p>
              </div>
            </div>

            {user.role === "admin" ? (
              <div className="mt-4 border-t border-slate-800/80 pt-3">
                <Link
                  href="/admin"
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-950/70"
                >
                  <ShieldIcon className="h-4 w-4" />
                  כניסה לדשבורד מנהל המערכת
                </Link>
              </div>
            ) : null}
          </section>

          {/* Download & Install App */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <h3 className="flex items-center gap-2 text-sm font-black text-white">
              <DownloadIcon className="h-4 w-4 text-cyan-400" />
              הורדת אפליקציית Zerem למכשיר
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              התקינו את האפליקציה במסך הבית לגישה מיידית לפני שיוצאים לקניות.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/download"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-850 py-3 text-xs font-bold text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <AppleIcon className="h-4 w-4 text-slate-300" />
                אייפון (iOS)
              </Link>
              <a
                href="/zerem.apk"
                download="zerem.apk"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-850 py-3 text-xs font-bold text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <AndroidIcon className="h-4 w-4 text-emerald-400" />
                אנדרואיד (APK)
              </a>
            </div>
          </section>

          {/* Account Actions */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 py-3 text-xs font-bold text-rose-300 transition hover:bg-rose-950/60 active:scale-98 disabled:opacity-50"
          >
            <LogoutIcon className="h-4 w-4" />
            {loggingOut ? "מתנתק…" : "התנתקות מהחשבון"}
          </button>
        </div>
      ) : (
        /* Logged Out View */
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <LoginForm
              title="התחברו כדי לשמור מועדפים ולדווח"
              onSuccess={() => {
                showToast("ברוך הבא! התחברת בהצלחה ל-Zerem");
              }}
            />
          </section>

          {/* App download section */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <h3 className="flex items-center gap-2 text-sm font-black text-white">
              <DownloadIcon className="h-4 w-4 text-cyan-400" />
              הורדת אפליקציית Zerem
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              קבלו גישה ישירה למפת העומסים המלאה של ישראל, סופרים פנויים וניווט Waze ישיר.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/download"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-850 py-3 text-xs font-bold text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <AppleIcon className="h-4 w-4 text-slate-300" />
                התקנה לאייפון
              </Link>
              <a
                href="/zerem.apk"
                download="zerem.apk"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-850 py-3 text-xs font-bold text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <AndroidIcon className="h-4 w-4 text-emerald-400" />
                הורדת APK
              </a>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
