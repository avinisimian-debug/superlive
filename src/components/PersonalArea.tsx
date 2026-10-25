"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLive } from "@/lib/store";
import type { Branch } from "@/lib/types";
import { openStatus, scheduleOf } from "@/lib/schedules";
import { LoginForm } from "./LoginForm";
import { ZeremProModal } from "./ZeremProModal";
import { AddBranchModal } from "./AddBranchModal";
import { ChainLogo } from "./ChainLogo";
import { CountUp, CrowdMeter, SectionTitle, TONE } from "./ui";
import {
  UserIcon,
  LogoutIcon,
  ShieldIcon,
  StarIcon,
  SparkIcon,
  AndroidIcon,
  AppleIcon,
  CrownIcon,
  PlusIcon,
  BellIcon,
  CheckIcon,
  MapPinIcon,
  UsersIcon,
  ZapIcon,
  ChartIcon,
} from "./icons";

const LEVELS = [
  { min: 0, name: "קונה חכם" },
  { min: 40, name: "מדווח שכונתי" },
  { min: 150, name: "סייר עומסים" },
  { min: 400, name: "אגדת זרם" },
];

function levelFor(points: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].min) i += 1;
  const current = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  const progress = next ? (points - current.min) / (next.min - current.min) : 1;
  return { index: i, current, next, progress: Math.max(0, Math.min(1, progress)) };
}

function ago(at: number, now: number): string {
  const m = Math.max(0, Math.round((now - at) / 60000));
  if (m < 1) return "עכשיו";
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "לפני שעה" : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  return d === 1 ? "אתמול" : `לפני ${d} ימים`;
}

export function PersonalArea({
  onGoToFavorites,
  onOpenBranch,
  allBranches,
}: {
  onGoToFavorites: () => void;
  onOpenBranch: (branch: Branch) => void;
  allBranches: Branch[];
}) {
  const { user, logout } = useAuth();
  const {
    now,
    getLive,
    favorites,
    myReports,
    showToast,
    isPro,
    proExpiresAt,
    proDaysLeft,
    proExpired,
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
      showToast("התנתקת מהחשבון");
    } finally {
      setLoggingOut(false);
    }
  };

  const points = myReports.length * 20 + favorites.length * 5 + (isPro ? 100 : 0);
  const level = levelFor(points);

  const byId = useMemo(() => new Map(allBranches.map((b) => [b.id, b])), [allBranches]);
  const favoriteBranches = useMemo(
    () => favorites.map((id) => byId.get(id)).filter((b): b is Branch => Boolean(b)),
    [favorites, byId],
  );
  const recent = useMemo(() => [...myReports].sort((a, b) => b.at - a.at).slice(0, 5), [myReports]);

  const badges = [
    { key: "first", label: "דיווח ראשון", hint: "שלחו דיווח אחד", done: myReports.length >= 1, icon: <SparkIcon className="h-5 w-5" /> },
    { key: "regular", label: "מדווח קבוע", hint: "5 דיווחים", done: myReports.length >= 5, icon: <UsersIcon className="h-5 w-5" /> },
    { key: "hawk", label: "עין הנץ", hint: "20 דיווחים", done: myReports.length >= 20, icon: <ZapIcon className="h-5 w-5" /> },
    { key: "collector", label: "אספן סופרים", hint: "3 מועדפים", done: favorites.length >= 3, icon: <StarIcon filled className="h-5 w-5" /> },
    { key: "mapper", label: "ממפה", hint: "הוספת סניף", done: customBranches.length >= 1, icon: <MapPinIcon className="h-5 w-5" /> },
    { key: "vip", label: "VIP", hint: "מנוי Pro", done: isPro, icon: <CrownIcon className="h-5 w-5" /> },
  ];
  const earned = badges.filter((b) => b.done).length;

  const displayName = user ? user.name || user.email.split("@")[0] : null;
  const initial = user ? (user.name ? user.name[0] : user.email[0]).toUpperCase() : null;

  // Progress ring around the avatar
  const R = 38;
  const C = 2 * Math.PI * R;

  return (
    <div className="pb-8">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero px-5 pb-6 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)]">
        <span className="aurora aurora-a" aria-hidden="true" />
        <span className="aurora aurora-b" aria-hidden="true" />

        <div className="flex items-center justify-between">
          <h1 className="text-[1.05rem] font-extrabold text-white/90">אזור אישי</h1>
          {isPro ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-3 py-1 text-[0.7rem] font-black text-ink-950">
              <CrownIcon className="h-3.5 w-3.5" />
              VIP
            </span>
          ) : (
            <span className="glass-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-bold text-white/80">
              <span className="live-dot !h-1.5 !w-1.5 text-cyan-300" />
              Zerem Live
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center gap-4 animate-rise">
          <div className="relative h-[5.5rem] w-[5.5rem] shrink-0">
            <svg viewBox="0 0 88 88" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
              <circle
                cx="44"
                cy="44"
                r={R}
                fill="none"
                stroke="url(#lvl)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - (user ? level.progress : 0))}
                className="ring-progress"
              />
              <defs>
                <linearGradient id="lvl" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00c2ff" />
                  <stop offset="100%" stopColor="#12b76a" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-[9px] grid place-items-center rounded-full bg-brand-gradient text-2xl font-black shadow-glow">
              {initial ?? <UserIcon className="h-8 w-8" />}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {user ? (
              <>
                <p className="truncate text-xl font-black tracking-tight">{displayName}</p>
                <p dir="ltr" className="truncate text-right text-[0.72rem] font-medium text-white/50">
                  {user.email}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[0.7rem] font-bold text-cyan-200">
                  <ChartIcon className="h-3.5 w-3.5" />
                  {level.current.name}
                  {level.next ? (
                    <span className="font-semibold text-white/45">
                      · עוד {level.next.min - points} נק׳ ל{level.next.name}
                    </span>
                  ) : null}
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-black tracking-tight">היי, נעים להכיר</p>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-white/60">
                  מתחברים כדי לשמור פרופיל, לצבור נקודות ולפתוח הישגים.
                </p>
                <a
                  href="#login"
                  className="press mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[0.76rem] font-extrabold text-ink-900"
                >
                  <UserIcon className="h-4 w-4" />
                  התחברות או הרשמה
                </a>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatTile label="דיווחים" value={myReports.length} accent="text-cyan-300" />
          <button type="button" onClick={onGoToFavorites} className="press text-right">
            <StatTile label="מועדפים" value={favorites.length} accent="text-amber-300" />
          </button>
          <StatTile label="נקודות" value={points} accent="text-emerald-300" />
        </div>
      </section>

      <div className="space-y-7 px-4 pt-6">
        {/* ── My supermarkets ──────────────────────────────── */}
        <section className="animate-rise">
          <SectionTitle
            action={
              favoriteBranches.length > 0 ? (
                <button type="button" onClick={onGoToFavorites} className="text-[0.74rem] font-bold text-brand-700">
                  לכל המועדפים
                </button>
              ) : null
            }
          >
            הסופרים שלי
          </SectionTitle>

          {favoriteBranches.length > 0 ? (
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
              {favoriteBranches.map((branch) => {
                const live = getLive(branch);
                const tone = TONE[live.congestion];
                const hoursKnown = !!branch.hoursVerified || branch.hoursSource === "osm";
                const status = openStatus(scheduleOf(branch), new Date(now), !hoursKnown);
                return (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => onOpenBranch(branch)}
                    className="press w-[11.5rem] shrink-0 snap-start rounded-[1.4rem] bg-white p-3.5 text-right shadow-card ring-1 ring-slate-200/60"
                  >
                    <div className="flex items-center justify-between">
                      <ChainLogo chain={branch.chain} size="sm" />
                      <CrowdMeter congestion={live.congestion} live={!live.estimated} size="sm" />
                    </div>
                    <p className="mt-2.5 truncate text-[0.86rem] font-extrabold text-ink-900">{branch.name}</p>
                    <p className="truncate text-[0.68rem] font-medium text-slate-500">{branch.city}</p>
                    <p className={`mt-2 text-[0.72rem] font-extrabold ${tone.text}`}>
                      {live.estimated ? `צפוי: ${tone.label}` : tone.label}
                    </p>
                    <p className={`truncate text-[0.64rem] font-semibold ${status.open ? "text-slate-500" : "text-rose-600"}`}>
                      {status.text}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              type="button"
              onClick={onGoToFavorites}
              className="press flex w-full items-center gap-3 rounded-[1.4rem] border-2 border-dashed border-slate-300/80 bg-white/60 p-4 text-right"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-500">
                <StarIcon filled className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[0.86rem] font-extrabold text-ink-900">שמרו את הסופרים שלכם</span>
                <span className="block text-[0.72rem] text-slate-500">
                  סמנו כוכב בכל סניף, והעומס בו יופיע כאן.
                </span>
              </span>
            </button>
          )}
        </section>

        {/* ── Activity ─────────────────────────────────────── */}
        <section className="animate-rise">
          <SectionTitle>הפעילות שלי</SectionTitle>
          <div className="rounded-[1.4rem] bg-white p-2 shadow-card ring-1 ring-slate-200/60">
            {recent.length > 0 ? (
              <ol className="relative">
                {recent.map((r, i) => {
                  const branch = byId.get(r.branchId);
                  return (
                    <li key={`${r.branchId}-${r.at}`}>
                      <button
                        type="button"
                        disabled={!branch}
                        onClick={() => branch && onOpenBranch(branch)}
                        className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-right transition hover:bg-slate-50"
                      >
                        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${TONE[r.congestion].color}1a` }}>
                          <CrowdMeter congestion={r.congestion} size="sm" />
                          {i < recent.length - 1 ? (
                            <span aria-hidden="true" className="absolute -bottom-3 left-1/2 h-3 w-px -translate-x-1/2 bg-slate-200" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.84rem] font-bold text-ink-900">{r.branchName}</span>
                          <span className="block text-[0.7rem] text-slate-500">
                            דיווחת: {TONE[r.congestion].label}
                          </span>
                        </span>
                        <span className="shrink-0 text-[0.66rem] font-semibold text-slate-400">{ago(r.at, now)}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="flex items-center gap-3 p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <SparkIcon className="h-5 w-5" />
                </span>
                <p className="text-[0.76rem] leading-relaxed text-slate-500">
                  עוד לא שלחתם דיווח. בפעם הבאה שאתם בסופר, לחצו על ״דווח מה קורה״. כל דיווח שווה 20 נקודות.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Achievements ─────────────────────────────────── */}
        <section className="animate-rise">
          <SectionTitle
            action={
              <span className="text-[0.72rem] font-bold text-slate-400">
                {earned}/{badges.length}
              </span>
            }
          >
            הישגים
          </SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {badges.map((b) => (
              <div
                key={b.key}
                className={`relative flex flex-col items-center rounded-[1.2rem] p-3 text-center ring-1 ${
                  b.done ? "bg-white shadow-card ring-slate-200/60" : "bg-slate-100/70 ring-transparent"
                }`}
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-2xl ${
                    b.done ? "bg-brand-gradient text-white shadow-glow" : "bg-slate-200/80 text-slate-400"
                  }`}
                >
                  {b.icon}
                </span>
                <span className={`mt-2 text-[0.74rem] font-extrabold ${b.done ? "text-ink-900" : "text-slate-500"}`}>
                  {b.label}
                </span>
                <span className="text-[0.62rem] font-medium text-slate-400">{b.done ? "הושג" : b.hint}</span>
                {b.done ? (
                  <span className="absolute left-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* ── VIP ──────────────────────────────────────────── */}
        <section className="animate-rise">
          <div className="relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-[#1a1206] via-[#2b1d07] to-[#120c03] p-5 text-white shadow-lift">
            <span aria-hidden="true" className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-amber-400/25 blur-3xl" />
            <div className="relative flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-200 to-amber-500 text-ink-950 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.8)]">
                <CrownIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.7rem] font-bold text-amber-300">
                  {isPro ? "מנוי VIP פעיל" : "Zerem Pro · ₪9.90 לחודש"}
                </p>
                <h2 className="mt-0.5 text-[1.05rem] font-black">
                  {isPro ? "אתם בפנים. תהנו מהשקט." : "יודעים ראשונים כשהסופר מתפנה"}
                </h2>
                <p className="mt-1 text-[0.74rem] leading-relaxed text-white/60">
                  {isPro
                    ? `נותרו ${proDaysLeft} ימים · בתוקף עד ${new Date(proExpiresAt ?? now).toLocaleDateString("he-IL")}`
                    : proExpired
                      ? "המנוי שלך הסתיים. חידוש מחזיר את ההתראות ואת הוספת הסניפים."
                      : "התראה כשסופר מועדף מתפנה, הוספת סופרים ומכולות למפה, ותג VIP בפרופיל."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProModalOpen(true)}
              className={`press sheen relative mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-[0.84rem] font-black ${
                isPro ? "bg-white/10 text-white ring-1 ring-white/15" : "bg-gradient-to-r from-amber-300 to-amber-500 text-ink-950"
              }`}
            >
              <CrownIcon className="h-4 w-4" />
              {isPro ? "פרטי המנוי" : proExpired ? "חידוש המנוי" : "שדרוג ל-Pro"}
            </button>
          </div>
        </section>

        {/* ── Login (guests) ───────────────────────────────── */}
        {!user ? (
          <section id="login" className="scroll-mt-6 rounded-[1.6rem] bg-white p-5 shadow-card ring-1 ring-slate-200/60">
            <LoginForm
              title="התחברו ל-Zerem"
              onSuccess={() => {
                showToast("ברוכים הבאים! התחברת ל-Zerem");
              }}
            />
          </section>
        ) : null}

        {/* ── Settings ─────────────────────────────────────── */}
        <section className="animate-rise">
          <SectionTitle>הגדרות</SectionTitle>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-[1.4rem] bg-white shadow-card ring-1 ring-slate-200/60">
            <div className="flex items-center gap-3 p-3.5">
              <RowIcon className="bg-amber-100 text-amber-600">
                <BellIcon className="h-[1.1rem] w-[1.1rem]" />
              </RowIcon>
              <div className="min-w-0 flex-1">
                <p className="text-[0.86rem] font-bold text-ink-900">התראות כשמתפנה</p>
                <p className="text-[0.7rem] text-slate-500">כשסופר מועדף מדווח כפנוי (VIP)</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={smartAlerts}
                aria-label="התראות כשמתפנה"
                onClick={toggleSmartAlerts}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${
                  smartAlerts ? "bg-brand-gradient" : "bg-slate-200"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ease-[var(--ease-spring)] ${
                    smartAlerts ? "right-6" : "right-1"
                  }`}
                />
              </button>
            </div>

            <RowButton
              onClick={() => setAddBranchOpen(true)}
              icon={
                <RowIcon className="bg-brand-50 text-brand-600">
                  <PlusIcon className="h-[1.1rem] w-[1.1rem]" />
                </RowIcon>
              }
              title="הוספת סופר למפה"
              subtitle={
                customBranches.length > 0
                  ? `הוספת ${customBranches.length} סניפים`
                  : "מכולת או סופר שכונתי שחסר"
              }
            />

            {user?.role === "admin" ? (
              <Link href="/admin" className="flex w-full items-center gap-3 p-3.5 text-right transition hover:bg-slate-50">
                <RowIcon className="bg-violet-100 text-violet-600">
                  <ShieldIcon className="h-[1.1rem] w-[1.1rem]" />
                </RowIcon>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.86rem] font-bold text-ink-900">פאנל ניהול</span>
                  <span className="block text-[0.7rem] text-slate-500">אנליטיקה, סניפים ומשתמשים</span>
                </span>
                <Chevron />
              </Link>
            ) : null}

            <Link href="/download" className="flex w-full items-center gap-3 p-3.5 text-right transition hover:bg-slate-50">
              <RowIcon className="bg-slate-100 text-ink-900">
                <AppleIcon className="h-5 w-5" />
              </RowIcon>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.86rem] font-bold text-ink-900">התקנה באייפון</span>
                <span className="block text-[0.7rem] text-slate-500">הוספה למסך הבית</span>
              </span>
              <Chevron />
            </Link>
            <a href="/zerem.apk" download="zerem.apk" className="flex w-full items-center gap-3 p-3.5 text-right transition hover:bg-slate-50">
              <RowIcon className="bg-emerald-100 text-emerald-600">
                <AndroidIcon className="h-5 w-5" />
              </RowIcon>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.86rem] font-bold text-ink-900">הורדה לאנדרואיד</span>
                <span className="block text-[0.7rem] text-slate-500">קובץ APK, התקנה ישירה</span>
              </span>
              <Chevron />
            </a>
          </div>
          <p className="mt-2 px-2 text-[0.66rem] leading-relaxed text-slate-400">
            המועדפים, הדיווחים וההישגים נשמרים כרגע במכשיר הזה.
          </p>
        </section>

        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="press flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[0.82rem] font-bold text-rose-600 shadow-card ring-1 ring-rose-100 disabled:opacity-50"
          >
            <LogoutIcon className="h-4 w-4" />
            {loggingOut ? "מתנתק…" : "התנתקות"}
          </button>
        ) : null}
      </div>

      {proModalOpen ? <ZeremProModal onClose={() => setProModalOpen(false)} /> : null}
      {addBranchOpen ? <AddBranchModal onClose={() => setAddBranchOpen(false)} /> : null}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="glass-dark rounded-2xl px-3 py-2.5">
      <p className={`text-xl font-black ${accent}`}>
        <CountUp value={value} />
      </p>
      <p className="text-[0.66rem] font-semibold text-white/55">{label}</p>
    </div>
  );
}

function RowIcon({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${className}`}>{children}</span>;
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function RowButton({
  onClick,
  icon,
  title,
  subtitle,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 p-3.5 text-right transition hover:bg-slate-50">
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-[0.86rem] font-bold text-ink-900">{title}</span>
        <span className="block text-[0.7rem] text-slate-500">{subtitle}</span>
      </span>
      <Chevron />
    </button>
  );
}
