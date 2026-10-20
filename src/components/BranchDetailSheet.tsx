"use client";

import { useEffect, useMemo, useState } from "react";
import type { Branch, Congestion, LiveState, Parking } from "@/lib/types";
import {
  CONGESTION_HINT,
  CONGESTION_LABEL,
  PARKING_LABEL,
  communityReports,
  loadScore,
} from "@/lib/live";
import { minutesToLabel, openStatus, weeklyHours } from "@/lib/schedules";
import { formatDistance } from "@/lib/geo";
import { useLive } from "@/lib/store";
import {
  CarIcon,
  ChartIcon,
  ClockIcon,
  CloseIcon,
  MapPinIcon,
  ShareIcon,
  SparkIcon,
  UsersIcon,
  WazeIcon,
  StarIcon,
} from "./icons";

const HOUR_TICKS = [8, 10, 12, 14, 16, 18, 20, 22];

const DOT: Record<Congestion, string> = {
  free: "bg-emerald-500",
  medium: "bg-amber-500",
  heavy: "bg-rose-500",
};

const BAR_COLOR: Record<Congestion, string> = {
  free: "#22c55e",
  medium: "#f59e0b",
  heavy: "#ef4444",
};

const FEED_CONGESTION: Record<Congestion, string> = {
  free: "קופות פנויות",
  medium: "עומס בינוני",
  heavy: "עומס כבד",
};

const FEED_PARKING: Record<Parking, string> = {
  plenty: "חניה זמינה",
  partial: "חניה חלקית",
  none: "אין חניה",
};

const PARKING_ADVICE: Record<Parking, string> = {
  plenty: "יש מקומות פנויים לאורך רוב שעות היום — כניסה מהירה לחניה.",
  partial: "בשעות העומס החניה מתמלאת — מומלץ להגיע מוקדם או לקראת סגירה.",
  none: "החניה באזור מוגבלת — חפשו חניה ברחובות הסמוכים או הגיעו ברגל.",
};

function congestionFromLoad(load: number): Congestion {
  if (load < 0.42) return "free";
  if (load < 0.68) return "medium";
  return "heavy";
}

function minutesAgoLabel(at: number, now: number): string {
  const m = Math.max(0, Math.round((now - at) / 60000));
  if (m < 1) return "כרגע";
  if (m === 1) return "לפני דקה";
  return `לפני ${m} דקות`;
}

export function BranchDetailSheet({
  branch,
  live,
  distance,
  now,
  onClose,
  onReport,
}: {
  branch: Branch;
  live: LiveState;
  distance: number | null;
  now: number;
  onClose: () => void;
  onReport: (branch: Branch) => void;
}) {
  const [copied, setCopied] = useState(false);
  const date = useMemo(() => new Date(now), [now]);
  const status = useMemo(
    () => openStatus(branch.scheduleIdx, date),
    [branch.scheduleIdx, date],
  );
  const hours = useMemo(() => weeklyHours(branch.scheduleIdx), [branch.scheduleIdx]);
  const reports = useMemo(() => communityReports(branch, now), [branch, now]);
  const bars = useMemo(
    () =>
      HOUR_TICKS.map((hour) => {
        const at = new Date(now);
        at.setHours(hour, 0, 0, 0);
        const load = loadScore(branch, at);
        return { hour, load, congestion: congestionFromLoad(load) };
      }),
    [branch, now],
  );
  const currentHour = date.getHours();
  const { isFavorite, toggleFavorite } = useLive();
  const favorite = isFavorite(branch.id);
  
  // Waze deep link with venue name for 100% exact resolution in Waze app
  const queryName = encodeURIComponent(`${branch.chain} ${branch.name}`);
  const wazeHref = `https://www.waze.com/ul?ll=${branch.lat}%2C${branch.lng}&q=${queryName}&navigate=yes`;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${branch.name} (${branch.chain}) · עומס ${CONGESTION_LABEL[live.congestion]} · Zerem`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "זרם", text, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-detail-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] bg-white text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 pb-3.5 pt-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded-lg bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700">
                {branch.chain}
              </span>
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {branch.city}
              </span>
            </div>
            <h2
              id="branch-detail-title"
              className="mt-1 text-xl font-black tracking-tight text-slate-900"
            >
              {branch.name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>{branch.address}</span>
              {distance !== null ? (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="font-extrabold text-sky-600">
                    {formatDistance(distance)}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggleFavorite(branch.id)}
              aria-label={favorite ? "הסר ממועדפים" : "הוסף למועדפים"}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <StarIcon
                filled={favorite}
                className={`h-4.5 w-4.5 ${favorite ? "text-amber-400" : "text-slate-400"}`}
              />
            </button>
            <button
              type="button"
              onClick={share}
              aria-label="שתף"
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="סגור"
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {/* Live Status Card */}
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">מצב עומס נוכחי בלייב</span>
              <span className="text-xs font-bold text-slate-600">
                {status.open ? "פתוח עכשיו" : "סגור כעת"}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <span className={`h-4 w-4 rounded-full shrink-0 ${DOT[live.congestion]}`} />
              <div>
                <p className="text-lg font-black text-slate-900">
                  {CONGESTION_LABEL[live.congestion]}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {CONGESTION_HINT[live.congestion]}
                </p>
              </div>
            </div>
          </div>

          {/* Hourly Congestion Chart */}
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ChartIcon className="h-4 w-4 text-sky-600" />
                צפי עומס לפי שעות היום
              </p>
              <span className="text-[0.68rem] text-slate-400 font-bold">מודל חכם</span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-1.5 pt-2 h-24">
              {bars.map(({ hour, load, congestion }) => {
                const heightPct = Math.max(16, Math.round(load * 100));
                const isCurrent = Math.abs(currentHour - hour) <= 1;
                return (
                  <div key={hour} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        isCurrent
                          ? "ring-2 ring-sky-500 shadow-sm"
                          : "opacity-80"
                      }`}
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: BAR_COLOR[congestion],
                      }}
                      title={`${hour}:00 - עומס ${CONGESTION_LABEL[congestion]}`}
                    />
                    <span
                      className={`text-[0.66rem] tabular-nums font-bold ${
                        isCurrent ? "text-sky-600" : "text-slate-400"
                      }`}
                    >
                      {hour}:00
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Parking Card */}
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600">
                <CarIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {PARKING_LABEL[live.parking]}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 font-medium">
                  {PARKING_ADVICE[live.parking]}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Hours */}
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ClockIcon className="h-4 w-4 text-sky-600" />
              שעות פתיחה
            </p>
            <div className="mt-2.5 divide-y divide-slate-100">
              {hours.map((row) => (
                <div key={row.key} className="flex items-center justify-between py-2 text-xs">
                  <span className="font-semibold text-slate-600">{row.label}</span>
                  <span
                    className={`font-bold tabular-nums ${
                      row.value === "סגור" ? "text-slate-400" : "text-slate-900"
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Community Reports */}
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <SparkIcon className="h-4 w-4 text-amber-500" />
              דיווחים אחרונים מהקהילה
            </p>
            <div className="mt-2.5 space-y-2">
              {reports.slice(0, 4).map((report, idx) => (
                <div
                  key={`${report.at}-${idx}`}
                  className="flex items-center gap-2.5 rounded-2xl bg-slate-50 px-3 py-2 text-xs"
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${DOT[report.congestion]}`} />
                  <p className="text-slate-700">
                    <span className="font-bold text-slate-500">
                      {minutesAgoLabel(report.at, now)}:{" "}
                    </span>
                    {FEED_CONGESTION[report.congestion]} · {FEED_PARKING[report.parking]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="border-t border-slate-100 bg-white px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3">
          <a
            href={wazeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 text-sm font-black text-white shadow-xs transition hover:bg-sky-600 active:scale-98"
          >
            <WazeIcon className="h-5 w-5" />
            ניווט Waze לסניף
          </a>
          <button
            type="button"
            onClick={() => onReport(branch)}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 text-xs font-bold text-slate-700 transition hover:bg-slate-200 active:scale-98"
          >
            <UsersIcon className="h-4 w-4 text-slate-500" />
            דווח עומס בסניף זה
          </button>
        </div>
      </div>
    </div>
  );
}
