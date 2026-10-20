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
  free: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
  medium: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
  heavy: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
};

const BAR_COLOR: Record<Congestion, string> = {
  free: "#10b981",
  medium: "#f59e0b",
  heavy: "#f43f5e",
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
  const wazeHref = `https://www.waze.com/ul?ll=${branch.lat}%2C${branch.lng}&navigate=yes`;

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-t border-slate-800 bg-slate-950 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-slate-800" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 px-5 pb-4 pt-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[0.72rem] font-bold tracking-wider uppercase text-cyan-400">
                {branch.chain}
              </span>
              <span className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[0.66rem] font-medium text-slate-300">
                {branch.city}
              </span>
            </div>
            <h2
              id="branch-detail-title"
              className="mt-1 text-xl font-black tracking-tight text-white"
            >
              {branch.name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <MapPinIcon className="h-3.5 w-3.5 text-slate-500" />
              <span>{branch.address}</span>
              {distance !== null ? (
                <>
                  <span className="text-slate-700">·</span>
                  <span className="font-extrabold text-cyan-300">
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-amber-400"
            >
              <StarIcon
                filled={favorite}
                className={`h-4 w-4 ${favorite ? "text-amber-400" : "text-slate-500"}`}
              />
            </button>
            <button
              type="button"
              onClick={share}
              aria-label="שתף"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="סגור"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {/* Live Status Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">מצב עומס נוכחי בלייב</span>
              <span className="text-xs font-bold text-slate-400">
                {status.open ? "פתוח עכשיו" : "סגור כעת"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className={`h-3.5 w-3.5 rounded-full shrink-0 ${DOT[live.congestion]}`} />
              <div>
                <p className="text-lg font-black text-white">
                  {CONGESTION_LABEL[live.congestion]}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {CONGESTION_HINT[live.congestion]}
                </p>
              </div>
            </div>
          </div>

          {/* Hourly Congestion Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <ChartIcon className="h-4 w-4 text-cyan-400" />
                צפי עומס לפי שעות היום
              </p>
              <span className="text-[0.68rem] text-slate-500 font-medium">מודל חכם</span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-1.5 pt-2 h-28">
              {bars.map(({ hour, load, congestion }) => {
                const heightPct = Math.max(14, Math.round(load * 100));
                const isCurrent = Math.abs(currentHour - hour) <= 1;
                return (
                  <div key={hour} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isCurrent
                          ? "ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                          : "opacity-75"
                      }`}
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: BAR_COLOR[congestion],
                      }}
                      title={`${hour}:00 - עומס ${CONGESTION_LABEL[congestion]}`}
                    />
                    <span
                      className={`text-[0.66rem] tabular-nums font-bold ${
                        isCurrent ? "text-cyan-400" : "text-slate-500"
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
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/60">
                <CarIcon className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {PARKING_LABEL[live.parking]}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {PARKING_ADVICE[live.parking]}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Hours */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <ClockIcon className="h-4 w-4 text-cyan-400" />
              שעות פעילות
            </p>
            <div className="mt-3 divide-y divide-slate-800/80">
              {hours.map((row) => (
                <div key={row.key} className="flex items-center justify-between py-2 text-xs">
                  <span className="font-semibold text-slate-400">{row.label}</span>
                  <span
                    className={`font-bold tabular-nums ${
                      row.value === "סגור" ? "text-slate-600" : "text-slate-200"
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Community Reports */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <SparkIcon className="h-4 w-4 text-amber-400" />
              דיווחים אחרונים מהקהילה
            </p>
            <div className="mt-3 space-y-2">
              {reports.slice(0, 4).map((report, idx) => (
                <div
                  key={`${report.at}-${idx}`}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800/60 bg-slate-850 px-3 py-2 text-xs"
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${DOT[report.congestion]}`} />
                  <p className="text-slate-300">
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
        <div className="border-t border-slate-800 bg-slate-950 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3">
          <a
            href={wazeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 active:scale-[0.98]"
          >
            <WazeIcon className="h-5 w-5" />
            ניווט Waze ישיר לסניף
          </a>
          <button
            type="button"
            onClick={() => onReport(branch)}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-200 transition hover:border-slate-700 hover:text-white active:scale-[0.98]"
          >
            <UsersIcon className="h-4 w-4 text-slate-400" />
            דווח עומס בסניף זה
          </button>
        </div>
      </div>
    </div>
  );
}
