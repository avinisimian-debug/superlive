"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLive } from "@/lib/store";
import { LoginForm } from "./LoginForm";
import { ZeremProModal } from "./ZeremProModal";
import { AddBranchModal } from "./AddBranchModal";
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
  CrownIcon,
  PlusIcon,
  BellIcon,
  CheckIcon,
} from "./icons";

export function PersonalArea({
  onGoToFavorites,
}: {
  onGoToFavorites: () => void;
}) {
  const { user, logout } = useAuth();
  const {
    favorites,
    myReports,
    totalSubmissions,
    showToast,
    isPro,
    customBranches,
    smartAlerts,
    toggleSmartAlerts,
  } = useLive();

  const [loggingOut, setLoggingOut] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [addBranchOpen, setAddBranchOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      showToast("התנתקת בהצלחה מהחשבון");
    } finally {
      setLoggingOut(false);
    }
  };

  // Points algorithm
  const points = myReports.length * 20 + favorites.length * 5 + (isPro ? 100 : 0);
  const level = points > 150 ? "סייר עומסים Pro" : points > 40 ? "מדווח שכונתי" : "קונה חכם";

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-2">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 pt-2">
        <h1 className="text-xl font-black text-slate-900">
          אזור אישי והגדרות
        </h1>
        <div className="flex items-center gap-1.5">
          {isPro ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 text-xs font-black text-white shadow-xs">
              <CrownIcon className="h-3.5 w-3.5" />
              Zerem VIP
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Zerem Live
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* VIP Pro Upgrade Banner */}
        <div className={`overflow-hidden rounded-3xl p-5 shadow-card transition-all ${
          isPro
            ? "border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-100/60"
            : "border border-sky-200 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-black ${
                  isPro ? "bg-amber-400 text-slate-900" : "bg-amber-400/90 text-slate-950"
                }`}>
                  <CrownIcon className="h-3.5 w-3.5" />
                  {isPro ? "מנוי VIP פעיל" : "שדרוג לחשבון Pro"}
                </span>
                {!isPro && (
                  <span className="text-[0.68rem] text-sky-300 font-bold">
                    ₪9.90 / חודש בלבד
                  </span>
                )}
              </div>
              <h2 className={`mt-2 text-base font-black ${isPro ? "text-slate-900" : "text-white"}`}>
                {isPro ? "חבר מועדון Zerem Pro 👑" : "הצטרפו למועדון הקונים החכמים"}
              </h2>
              <p className={`mt-1 text-xs leading-relaxed ${isPro ? "text-slate-600" : "text-slate-300"}`}>
                {isPro
                  ? "החשבון שלך נהנה מהתראות עומס חכמות, הוספת סופרים בלתי מוגבלת, ודיווחי קהילה בעדיפות כפולה."
                  : "קבלו התראות עומס בלייב כשהסופר המועדף מתפנה, הוסיפו סופרים ומכולות חדשות, והשפיעו על הקהילה."}
              </p>
            </div>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              isPro ? "bg-amber-400 text-slate-900 shadow-md" : "bg-white/10 text-amber-300 backdrop-blur-xs"
            }`}>
              <CrownIcon className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setProModalOpen(true)}
              className={`flex-1 min-h-10 inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 text-xs font-black transition active:scale-98 ${
                isPro
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 shadow-md"
              }`}
            >
              <CrownIcon className="h-4 w-4" />
              {isPro ? "פרטי מנוי ותמיכה" : "שדרגו עכשיו ל-Pro"}
            </button>

            <button
              type="button"
              onClick={() => setAddBranchOpen(true)}
              className={`min-h-10 inline-flex items-center justify-center gap-1.5 rounded-2xl border px-3.5 text-xs font-bold transition active:scale-98 ${
                isPro
                  ? "border-amber-300 bg-white text-slate-900 hover:bg-amber-50"
                  : "border-white/20 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              הוספת סופר למפה
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        {user ? (
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
                      isPro
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {isPro ? "משתמש VIP" : level}
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
                  <CrownIcon className="h-4 w-4" />
                  <span className="text-base font-black tabular-nums">
                    {points}
                  </span>
                </div>
                <p className="mt-0.5 text-[0.68rem] font-bold text-slate-500">
                  נקודות מוניטין
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card">
            <LoginForm
              title="התחברו ל-Zerem"
              onSuccess={() => {
                showToast("ברוך הבא! התחברת בהצלחה ל-Zerem");
              }}
            />
          </div>
        )}

        {/* Preferences and Actions */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
          <div className="bg-slate-100/90 px-4 py-2 text-xs font-bold text-slate-600">
            העדפות והגדרות
          </div>
          <div className="divide-y divide-slate-100">
            {/* Smart Alerts Toggle */}
            <div className="flex items-center justify-between p-3.5 text-right">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <BellIcon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">התראות עומס חכמות</p>
                  <p className="text-xs text-slate-500">עדכון כשהסופר המועדף מתפנה מקופות</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSmartAlerts}
                className={`h-6 w-11 rounded-full p-1 transition ${
                  smartAlerts ? "bg-sky-500" : "bg-slate-200"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${
                    smartAlerts ? "-translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Add Custom Branch */}
            <button
              type="button"
              onClick={() => setAddBranchOpen(true)}
              className="flex w-full items-center justify-between p-3.5 text-right transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <PlusIcon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">הוספת סופרמרקט חדש</p>
                  <p className="text-xs text-slate-500">
                    {customBranches.length > 0
                      ? `הוספת ${customBranches.length} סניפים מותאמים אישית`
                      : "הוסף מכולת או סופר שכונתי למפה"}
                  </p>
                </div>
              </div>
              <span className="text-slate-400 font-bold">←</span>
            </button>

            {/* Quick Favorites shortcut */}
            <button
              type="button"
              onClick={onGoToFavorites}
              className="flex w-full items-center justify-between p-3.5 text-right transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <StarIcon filled className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">סניפים מועדפים ({favorites.length})</p>
                  <p className="text-xs text-slate-500">גישה מהירה וניווט מיידי לסופרים שלך</p>
                </div>
              </div>
              <span className="text-slate-400 font-bold">←</span>
            </button>

            {user?.role === "admin" ? (
              <Link
                href="/admin"
                className="flex w-full items-center justify-between p-3.5 text-right transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <ShieldIcon className="h-4.5 w-4.5" />
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

        {/* App download section */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
          <div className="bg-slate-100/90 px-4 py-2 text-xs font-bold text-slate-600">
            הורדת אפליקציית Zerem למכשיר
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
                  <p className="text-xs text-slate-500">הורדה מהירה למסך הבית ללא חנות</p>
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
                  <p className="text-xs text-slate-500">התקנה ישירה בלחיצה אחת</p>
                </div>
              </div>
              <span className="text-slate-400 font-bold">←</span>
            </a>
          </div>
        </div>

        {/* Logout Button */}
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/70 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-98 disabled:opacity-50"
          >
            <LogoutIcon className="h-4 w-4" />
            {loggingOut ? "מתנתק…" : "התנתקות מהחשבון"}
          </button>
        ) : null}
      </div>

      {/* Pro Modal */}
      {proModalOpen ? (
        <ZeremProModal onClose={() => setProModalOpen(false)} />
      ) : null}

      {/* Add Branch Modal */}
      {addBranchOpen ? (
        <AddBranchModal onClose={() => setAddBranchOpen(false)} />
      ) : null}
    </div>
  );
}
