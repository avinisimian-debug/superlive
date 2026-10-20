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
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            אזור אישי
          </h1>
          <p className="text-xs text-slate-500">
            ניהול חשבון, מועדפים ודיווחי עומס
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-bold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Zerem Live
        </span>
      </div>

      {user ? (
        /* Logged In View */
        <div className="space-y-4">
          {/* Profile Card */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/50 p-5 shadow-card">
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-xl font-black text-white shadow-md shadow-emerald-500/20">
                {(user.name ? user.name[0] : user.email[0]).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-extrabold text-slate-900">
                    {user.name || "חבר קהילת זרם"}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.64rem] font-bold ${
                      user.role === "admin"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {user.role === "admin" ? "מנהל מערכת" : "תורם קהילה"}
                  </span>
                </div>
                <p dir="ltr" className="truncate text-xs text-slate-500 text-right mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
              <button
                type="button"
                onClick={onGoToFavorites}
                className="rounded-xl bg-slate-50 p-2.5 transition hover:bg-slate-100 active:scale-95"
              >
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  <StarIcon filled className="h-4 w-4" />
                  <span className="text-base font-black text-slate-900">
                    {favorites.length}
                  </span>
                </div>
                <p className="mt-1 text-[0.68rem] font-bold text-slate-500">
                  מועדפים
                </p>
              </button>

              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="flex items-center justify-center gap-1 text-emerald-600">
                  <UsersIcon className="h-4 w-4" />
                  <span className="text-base font-black text-slate-900">
                    {myReports.length || totalSubmissions}
                  </span>
                </div>
                <p className="mt-1 text-[0.68rem] font-bold text-slate-500">
                  דיווחים
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="flex items-center justify-center gap-1 text-brand-600">
                  <SparkIcon className="h-4 w-4 text-sky-500" />
                  <span className="text-base font-black text-slate-900">
                    {(myReports.length || totalSubmissions) * 15 + 50}
                  </span>
                </div>
                <p className="mt-1 text-[0.68rem] font-bold text-slate-500">
                  נקודות קהילה
                </p>
              </div>
            </div>

            {/* Admin Link if Admin */}
            {user.role === "admin" ? (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <Link
                  href="/admin"
                  className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <ShieldIcon className="h-4 w-4 text-emerald-400" />
                    כניסה לפאנל ניהול אדמין
                  </span>
                  <span className="text-[0.7rem] text-slate-400">מעבר לדשבורד &larr;</span>
                </Link>
              </div>
            ) : null}
          </section>

          {/* My Recent Reports */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
              <ClockIcon className="h-4 w-4 text-emerald-600" />
              הדיווחים שלי בלייב
            </h3>
            {myReports.length > 0 ? (
              <ul className="mt-3 divide-y divide-slate-100">
                {myReports.slice(0, 5).map((rep, idx) => (
                  <li
                    key={`${rep.branchId}-${rep.at}-${idx}`}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {rep.branchName}
                      </p>
                      <p className="mt-0.5 text-[0.7rem] text-slate-500">
                        {CONGESTION_LABELS[rep.congestion] || "עומס עודכן"} ·{" "}
                        {PARKING_LABELS[rep.parking] || "חניה עודכנה"}
                      </p>
                    </div>
                    <span className="text-[0.68rem] font-medium text-slate-400">
                      {formatTimeAgo(rep.at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-xs font-semibold text-slate-600">
                  טרם דיווחת עומס בסופרמרקט
                </p>
                <p className="mt-1 text-[0.7rem] text-slate-400">
                  בפעם הבאה שאתם בקניות, לחצו על כפתור &quot;דווח עומס בסניף&quot; ועזרו
                  לישראלים לחסוך זמן יקר.
                </p>
              </div>
            )}
          </section>

          {/* Download & Install App */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
              <DownloadIcon className="h-4 w-4 text-sky-500" />
              הורדת אפליקציית Zerem למכשיר
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              התקינו את האפליקציה במסך הבית לגישה מיידית לפני שיוצאים לקניות.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/download"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <AppleIcon className="h-4 w-4" />
                אייפון (iOS)
              </Link>
              <a
                href="/zerem.apk"
                download="zerem.apk"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <AndroidIcon className="h-4 w-4 text-emerald-600" />
                אנדרואיד (APK)
              </a>
            </div>
          </section>

          {/* Account Actions */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/60 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100/60 active:scale-98 disabled:opacity-50"
          >
            <LogoutIcon className="h-4 w-4" />
            {loggingOut ? "מתנתק…" : "התנתקות מהחשבון"}
          </button>
        </div>
      ) : (
        /* Logged Out View */
        <div className="space-y-4">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">
            <LoginForm
              title="התחברו כדי לשמור מועדפים ולדווח"
              onSuccess={() => {
                showToast("ברוך הבא! התחברת בהצלחה ל-Zerem");
              }}
            />
          </section>

          {/* App download section */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
              <DownloadIcon className="h-4 w-4 text-sky-500" />
              הורדת אפליקציית Zerem
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              קבלו גישה ישירה למפת העומסים המלאה של ישראל, סופרים פנויים וניווט Waze ישיר.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/download"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <AppleIcon className="h-4 w-4" />
                התקנה לאייפון
              </Link>
              <a
                href="/zerem.apk"
                download="zerem.apk"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <AndroidIcon className="h-4 w-4 text-emerald-600" />
                הורדת APK
              </a>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
