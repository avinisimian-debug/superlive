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
  NavigationIcon,
  MapPinIcon,
  ClockIcon,
} from "./icons";

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
    <div className="mx-auto max-w-lg px-4 pb-28 pt-2">
      {/* Top Header like Waze Settings */}
      <div className="flex items-center justify-between pb-3 pt-2">
        <h1 className="text-xl font-black text-slate-900">
          אזור אישי והגדרות
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          Zerem Live
        </span>
      </div>

      {user ? (
        <div className="space-y-4">
          {/* User Profile Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card">
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-xl font-black text-white shadow-xs">
                {(user.name ? user.name[0] : user.email[0]).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-extrabold text-slate-900">
                    {user.name || "חבר קהילת זרם"}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.66rem] font-bold ${
                      user.role === "admin"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {user.role === "admin" ? "מנהל מערכת" : "תורם קהילה"}
                  </span>
                </div>
                <p dir="ltr" className="truncate text-xs font-medium text-slate-500 text-right mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
              <button
                type="button"
                onClick={onGoToFavorites}
                className="rounded-2xl bg-slate-50 p-2.5 transition hover:bg-slate-100"
              >
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  <StarIcon filled className="h-4 w-4" />
                  <span className="text-base font-black tabular-nums">
                    {favorites.length}
                  </span>
                </div>
                <p className="mt-0.5 text-[0.68rem] font-bold text-slate-500">
                  מועדפים
                </p>
              </button>

              <div className="rounded-2xl bg-slate-50 p-2.5">
                <div className="flex items-center justify-center gap-1 text-sky-600">
                  <SparkIcon className="h-4 w-4" />
                  <span className="text-base font-black tabular-nums">
                    {myReports.length}
                  </span>
                </div>
                <p className="mt-0.5 text-[0.68rem] font-bold text-slate-500">
                  דיווחים שלי
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-2.5">
                <div className="flex items-center justify-center gap-1 text-emerald-600">
                  <UsersIcon className="h-4 w-4" />
                  <span className="text-base font-black tabular-nums">
                    {totalSubmissions}
                  </span>
                </div>
                <p className="mt-0.5 text-[0.68rem] font-bold text-slate-500">
                  דיווחים בארץ
                </p>
              </div>
            </div>
          </div>

          {/* Waze-Style Menu List */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
            {/* Sub-header 1: כללי */}
            <div className="bg-slate-100/90 px-4 py-2 text-xs font-bold text-slate-600">
              כללי
            </div>
            <div className="divide-y divide-slate-100">
              {/* Item: Favorites */}
              <button
                type="button"
                onClick={onGoToFavorites}
                className="flex w-full items-center justify-between p-3.5 text-right transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <StarIcon filled className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">סופרמרקטים מועדפים</p>
                    <p className="text-xs text-slate-500">גישה מהירה לסניפים השמורים שלך</p>
                  </div>
                </div>
                <span className="text-slate-400 font-bold">←</span>
              </button>

              {/* Item: Install iPhone */}
              <Link
                href="/download"
                className="flex w-full items-center justify-between p-3.5 text-right transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <AppleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">התקנה באייפון (iOS)</p>
                    <p className="text-xs text-slate-500">הוספה בלחיצה אחת למסך הבית</p>
                  </div>
                </div>
                <span className="text-slate-400 font-bold">←</span>
              </Link>

              {/* Item: Download Android APK */}
              <a
                href="/zerem.apk"
                download="zerem.apk"
                className="flex w-full items-center justify-between p-3.5 text-right transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <AndroidIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">הורדת אפליקציה לאנדרואיד (APK)</p>
                    <p className="text-xs text-slate-500">התקנה ישירה לקובץ Zerem APK</p>
                  </div>
                </div>
                <span className="text-slate-400 font-bold">←</span>
              </a>
            </div>

            {/* Sub-header 2: העדפות נסיעה וקהילה */}
            <div className="bg-slate-100/90 px-4 py-2 text-xs font-bold text-slate-600">
              העדפות נסיעה וקהילה
            </div>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <NavigationIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">ניווט ישיר ב-Waze</p>
                    <p className="text-xs text-slate-500">פתיחה מיידית של מסלול מדויק לקופות ולחניה</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.66rem] font-bold text-emerald-800">
                  מופעל
                </span>
              </div>

              {user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="flex w-full items-center justify-between p-3.5 text-right transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <ShieldIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">דשבורד מנהל מערכת</p>
                      <p className="text-xs text-slate-500">אנליטיקה, סניפים ומשתמשים</p>
                    </div>
                  </div>
                  <span className="text-slate-400 font-bold">←</span>
                </Link>
              ) : null}
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/70 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-98 disabled:opacity-50"
          >
            <LogoutIcon className="h-4 w-4" />
            {loggingOut ? "מתנתק…" : "התנתקות מהחשבון"}
          </button>
        </div>
      ) : (
        /* Logged Out View */
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">
            <LoginForm
              title="התחברו ל-Zerem"
              onSuccess={() => {
                showToast("ברוך הבא! התחברת בהצלחה ל-Zerem");
              }}
            />
          </div>

          {/* App download section */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
            <div className="bg-slate-100/90 px-4 py-2 text-xs font-bold text-slate-600">
              הורדת אפליקציית Zerem
            </div>
            <div className="divide-y divide-slate-100">
              <Link
                href="/download"
                className="flex items-center justify-between p-3.5 text-right transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <AppleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">התקנה לאייפון (iOS)</p>
                    <p className="text-xs text-slate-500">הורדה ישירה למסך הבית ללא חנות</p>
                  </div>
                </div>
                <span className="text-slate-400 font-bold">←</span>
              </Link>
              <a
                href="/zerem.apk"
                download="zerem.apk"
                className="flex items-center justify-between p-3.5 text-right transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <AndroidIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">הורדת קובץ לאנדרואיד (APK)</p>
                    <p className="text-xs text-slate-500">התקנה מהירה למכשירי אנדרואיד</p>
                  </div>
                </div>
                <span className="text-slate-400 font-bold">←</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
