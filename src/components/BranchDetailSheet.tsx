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
import { CHAIN_COLORS } from "@/lib/chain-colors";
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
  heavy: "bg-red-500",
};

const TEXT: Record<Congestion, string> = {
  free: "text-emerald-700",
  medium: "text-amber-700",
  heavy: "text-red-700",
};

const BAR: Record<Congestion, string> = {
  free: "#10b981",
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
  partial:
    "בשעות העומס החניה מתמלאת — מומלץ להגיע לפני 11:00 או אחרי 20:00.",
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
  const wazeQuery = encodeURIComponent(
    branch.wazeQuery ??
      `${branch.name} ${branch.address ? branch.address + " " : ""}${branch.city}`,
  );
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
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  };

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`פרטים מלאים עבור ${branch.name}`}
      onClick={onClose}
      data-testid="branch-detail-sheet"
    >
      <div
        className="animate-rise flex max-h-[92vh] w-full max-w-[27rem] flex-col rounded-t-[28px] bg-white shadow-float"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-slate-200" />

        {/* Header */}
        <div className="shrink-0 px-5 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-bold text-slate-600">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CHAIN_COLORS[branch.chain].bg }}
                  aria-hidden="true"
                />
                {branch.chain}
              </span>
              <h2 className="mt-1.5 text-[1.32rem] font-extrabold leading-tight tracking-tight text-slate-900">
                {branch.name}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.76rem] text-slate-500">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>{branch.address}</span>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span>{branch.city}</span>
                {distance !== null ? (
                  <>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-semibold text-slate-600">
                      {formatDistance(distance)}
                    </span>
                  </>
                ) : null}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={share}
                aria-label="שיתוף הסניף"
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="סגירה"
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {copied ? (
            <p className="mt-2 text-[0.68rem] font-semibold text-emerald-600">
              הקישור הועתק ללוח
            </p>
          ) : null}

          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.8rem] font-bold ring-1 ring-inset ${
                status.open
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-500/20"
                  : "bg-slate-100 text-slate-500 ring-slate-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  status.open ? "bg-emerald-500" : "bg-slate-400"
                }`}
                aria-hidden="true"
              />
              {status.text}
            </span>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-5 pb-4 pt-4"
          data-testid="branch-detail-body"
        >
          {/* Live congestion & parking deep dive */}
          <section
            className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card"
            data-testid="detail-live"
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[0.82rem] font-bold text-slate-700">
                <UsersIcon className="h-4 w-4 text-brand-600" />
                עומס וחניה בזמן אמת
              </p>
              <span className="text-[0.62rem] font-semibold text-slate-400">
                {live.estimated ? "הערכה" : "דיווח קהילה"}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${DOT[live.congestion]}`}
              >
                <UsersIcon className="h-5 w-5 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[1.02rem] font-extrabold ${TEXT[live.congestion]}`}>
                  {CONGESTION_LABEL[live.congestion]}
                </p>
                <p className="text-[0.7rem] text-slate-500">
                  המתנה משוערת {CONGESTION_HINT[live.congestion]}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[0.68rem] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                <CarIcon className="h-3.5 w-3.5 text-slate-400" />
                {PARKING_LABEL[live.parking]}
              </span>
            </div>

            {/* Hourly crowd graph */}
            <p className="mt-4 flex items-center gap-1.5 text-[0.74rem] font-bold text-slate-600">
              <ChartIcon className="h-4 w-4 text-slate-400" />
              שעות עמוסות לאורך היום
            </p>
            <div
              className="mt-3 flex items-end justify-between gap-1.5"
              style={{ height: "6.5rem" }}
              data-testid="crowd-graph"
            >
              {bars.map((bar) => {
                const isNow = bar.hour === currentHour;
                return (
                  <div
                    key={bar.hour}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                    aria-label={`${minutesToLabel(bar.hour * 60)} — ${CONGESTION_LABEL[bar.congestion]}`}
                  >
                    <div
                      className="w-full rounded-md transition-all"
                      style={{
                        height: `${Math.round(18 + bar.load * 82)}%`,
                        background: BAR[bar.congestion],
                        opacity: isNow ? 1 : 0.85,
                        boxShadow: isNow ? "0 0 0 2px rgba(15,23,42,0.08)" : undefined,
                      }}
                    />
                    <span
                      className={`text-[0.58rem] tabular-nums ${
                        isNow ? "font-extrabold text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {String(bar.hour).padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-1.5 text-center text-[0.62rem] text-slate-400">
              העמודה המודגשת היא השעה הנוכחית ({minutesToLabel(currentHour * 60)})
            </p>

            <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-slate-50 p-3">
              <CarIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-[0.78rem] font-bold text-slate-700">
                  {PARKING_LABEL[live.parking]}
                </p>
                <p className="mt-0.5 text-[0.7rem] leading-relaxed text-slate-500">
                  {PARKING_ADVICE[live.parking]}
                </p>
              </div>
            </div>
          </section>

          {/* Full weekly hours */}
          <section
            className="mt-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card"
            data-testid="detail-hours"
          >
            <p className="flex items-center gap-1.5 text-[0.82rem] font-bold text-slate-700">
              <ClockIcon className="h-4 w-4 text-brand-600" />
              שעות פתיחה
            </p>
            <dl className="mt-2 divide-y divide-slate-100">
              {hours.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between py-2"
                >
                  <dt className="text-[0.82rem] font-semibold text-slate-600">
                    {row.label}
                  </dt>
                  <dd
                    className={`text-[0.82rem] font-bold tabular-nums ${
                      row.value === "סגור" ? "text-slate-400" : "text-slate-900"
                    }`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Community reports feed */}
          <section
            className="mt-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card"
            data-testid="detail-reports"
          >
            <p className="flex items-center gap-1.5 text-[0.82rem] font-bold text-slate-700">
              <SparkIcon className="h-4 w-4 text-amber-400" />
              דיווחים אחרונים מהקהילה
            </p>
            <ul className="mt-2 space-y-2">
              {reports.slice(0, 4).map((report, index) => (
                <li
                  key={`${report.at}-${index}`}
                  className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5"
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${DOT[report.congestion]}`}
                    aria-hidden="true"
                  />
                  <p className="text-[0.76rem] leading-snug text-slate-600">
                    <span className="font-bold text-slate-500">
                      {minutesAgoLabel(report.at, now)}:{" "}
                    </span>
                    {FEED_CONGESTION[report.congestion]} ·{" "}
                    {FEED_PARKING[report.parking]}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sticky bottom actions */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3">
          <a
            href={wazeHref}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="detail-waze"
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 text-base font-extrabold text-white shadow-lg shadow-cyan-500/30 transition active:scale-[0.98]"
          >
            <WazeIcon className="h-5 w-5" />
            נווט עכשיו ב-Waze
          </a>
          <button
            type="button"
            onClick={() => onReport(branch)}
            data-testid="detail-report"
            className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[0.9rem] font-bold text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <UsersIcon className="h-4 w-4 text-slate-400" />
            דווח עומס בסניף
          </button>
        </div>
      </div>
    </div>
  );
}
