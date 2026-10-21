"use client";

import { ChainLogo } from "./ChainLogo";
import { DataIssueReport } from "./DataIssueReport";

import { useEffect, useMemo, useState } from "react";
import type { Branch, Congestion, LiveState, Parking } from "@/lib/types";
import { CONGESTION_HINT, CONGESTION_LABEL, PARKING_LABEL, loadScore } from "@/lib/live";
import { earliestOpening, isOpenAt, openStatus, scheduleOf, weeklyHours } from "@/lib/schedules";
import { formatDistance } from "@/lib/geo";
import { useLive } from "@/lib/store";
import { getWazeNavigationUrl } from "@/lib/navigation";
import { getChainMeta } from "@/lib/chains";
import {
  CarIcon,
  ClockIcon,
  CloseIcon,
  MapPinIcon,
  ShareIcon,
  SparkIcon,
  UsersIcon,
  WazeIcon,
  StarIcon,
  ZapIcon,
} from "./icons";

const HOUR_TICKS = [8, 10, 12, 14, 16, 18, 20, 22];

const CONGESTION_STATUS_MAP: Record<Congestion, { label: string; dot: string; text: string; bg: string }> = {
  free: { label: "פנוי עכשיו — אין תור בקופות", dot: "bg-emerald-500", text: "text-emerald-800", bg: "bg-emerald-50" },
  medium: { label: "עומס סביר (תור קצר של כ-5 דק׳)", dot: "bg-amber-500", text: "text-amber-800", bg: "bg-amber-50" },
  heavy: { label: "עמוס בקופות (תורים ארוכים 15+ דק׳)", dot: "bg-rose-500", text: "text-rose-800", bg: "bg-rose-50" },
};

const BAR_COLOR: Record<Congestion, string> = {
  free: "#10b981",
  medium: "#f59e0b",
  heavy: "#f43f5e",
};

function congestionFromLoad(load: number): Congestion {
  if (load < 0.42) return "free";
  if (load < 0.68) return "medium";
  return "heavy";
}

function minutesAgoLabel(at: number, now: number): string {
  const m = Math.max(0, Math.round((now - at) / 60000));
  if (m < 1) return "ממש עכשיו";
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
  const schedule = scheduleOf(branch);
  const hoursKnown = !!branch.hoursVerified || branch.hoursSource === "osm";
  const status = useMemo(() => openStatus(schedule, date, !hoursKnown), [schedule, hoursKnown, date]);
  const hours = useMemo(() => weeklyHours(schedule), [schedule]);
  const chainMeta = getChainMeta(branch.chain);
  const { isFavorite, toggleFavorite } = useLive();
  const favorite = isFavorite(branch.id);

  const hourTicks = useMemo(() => {
    const earliest = Math.min(earliestOpening(schedule) ?? 480, 480);
    if (earliest <= 390) return [6, 8, 10, 12, 14, 16, 18, 20, 22];
    if (earliest <= 420) return [7, 9, 11, 13, 15, 17, 19, 21];
    return [8, 10, 12, 14, 16, 18, 20, 22];
  }, [schedule]);

  const bars = useMemo(
    () =>
      hourTicks.map((hour) => {
        const at = new Date(now);
        at.setHours(hour, 0, 0, 0);
        const load = loadScore(branch, at);
        return { hour, load, congestion: congestionFromLoad(load) };
      }),
    [branch, now, hourTicks],
  );

  const currentHour = date.getHours();
  // Only recommend hours when the branch is expected to be open.
  const quietestHour = useMemo(() => {
    const openBars = bars.filter(({ hour }) => {
      const at = new Date(now);
      at.setHours(hour, 0, 0, 0);
      return isOpenAt(schedule, at);
    });
    if (!openBars.length) return null;
    return [...openBars].sort((a, b) => a.load - b.load)[0];
  }, [bars, now, schedule]);

  const wazeHref = getWazeNavigationUrl(branch);

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
    const text = `${branch.name} (${branch.chain}) · ${CONGESTION_STATUS_MAP[live.congestion].label} · Zerem`;
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
      // dismissed
    }
  };

  const cong = CONGESTION_STATUS_MAP[live.congestion];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[2.2rem] sm:rounded-3xl bg-white shadow-2xl text-right animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-3 border-b border-slate-100">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <ChainLogo chain={branch.chain} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${chainMeta.badgeBg} ${chainMeta.badgeText}`}>
                  {chainMeta.shortName}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {branch.city}
                </span>
              </div>
              <h2 id="branch-title" className="mt-1 text-lg font-black text-slate-900 truncate">
                {branch.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {branch.address || branch.city}
              </p>
              {branch.locationTrust === "unverified" && (
                <p className="mt-1 text-[0.68rem] font-semibold text-amber-800">
                  מיקום הסניף עדיין לא אומת. אם הגעת למקום אחר, נשמח לדיווח.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleFavorite(branch.id)}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 transition"
              aria-label="מועדף"
            >
              <StarIcon filled={favorite} className={`h-5 w-5 ${favorite ? "text-amber-400" : ""}`} />
            </button>
            <button
              type="button"
              onClick={share}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 transition"
              aria-label="שתף"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              aria-label="סגור"
            >
              <CloseIcon className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Live Status Pill */}
          <div className={`rounded-3xl border border-slate-200/80 p-4 ${cong.bg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${cong.dot} ${live.estimated ? "opacity-60" : "animate-pulse"}`} />
                <span className={`text-sm font-black ${cong.text}`}>
                  {live.estimated ? `צפוי: ${CONGESTION_LABEL[live.congestion]}` : cong.label}
                </span>
              </div>
              <span className={`text-xs font-bold ${status.open ? "text-emerald-700" : "text-rose-700"}`}>
                {status.text}
              </span>
            </div>

            <p className="mt-1.5 text-[0.7rem] font-semibold text-slate-600">
              {live.estimated || live.lastReportAt === null
                ? "אין דיווח עדכני. ההערכה מבוססת על השעה והיום בשבוע."
                : `לפי ${live.reportCount === 1 ? "דיווח אחד" : `${live.reportCount} דיווחים`} מהקהילה, האחרון ${minutesAgoLabel(live.lastReportAt, now)}.`}
            </p>

            {/* Smart Quiet Hours Recommendation */}
            {quietestHour && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/90 p-2.5 text-xs text-slate-800 font-bold border border-slate-100">
                <ZapIcon className="h-4 w-4 text-amber-500 shrink-0" />
                <span>השעה הצפויה להיות הכי שקטה היום: סביב {quietestHour.hour}:00</span>
              </div>
            )}

            {/* Hourly congestion graph */}
            <div className="mt-4 pt-3 border-t border-slate-200/60">
              <p className="text-[0.72rem] font-bold text-slate-600 mb-2">
                עומס צפוי לפי שעות היום (הערכה):
              </p>
              <div className="flex items-end justify-between gap-1.5 h-20 pt-1">
                {bars.map(({ hour, load, congestion }) => {
                  const heightPct = Math.max(18, Math.round(load * 100));
                  const isCurrent = Math.abs(currentHour - hour) <= 1;
                  return (
                    <div key={hour} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          isCurrent ? "ring-2 ring-sky-500 shadow-sm" : "opacity-85"
                        }`}
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: BAR_COLOR[congestion],
                        }}
                      />
                      <span className={`text-[0.66rem] font-bold tabular-nums ${isCurrent ? "text-sky-600" : "text-slate-400"}`}>
                        {hour}:00
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Parking & Weekly Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <CarIcon className="h-4 w-4 text-sky-600" />
                מצב חניה
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {PARKING_LABEL[live.parking]}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {distance !== null ? `מרחק: ${formatDistance(distance)} ממך` : "חניה מוסדרת בסניף"}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <ClockIcon className="h-4 w-4 text-sky-600" />
                {hoursKnown ? "שעות פעילות" : "שעות פעילות משוערות"}
              </p>
              {branch.hoursSourceUrl && (
                <p className="mt-1 text-[0.68rem] font-semibold leading-snug text-slate-500">
                  {branch.hoursSource === "chain" ? "לפי אתר הרשת" : "לפי OpenStreetMap"}
                  {" · "}
                  <a
                    href={branch.hoursSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-slate-700"
                  >
                    למקור
                  </a>
                  {". "}
                  בחגים השעות עשויות להשתנות.
                </p>
              )}
              {!hoursKnown && (
                <p className="mt-1 rounded-xl bg-amber-50 px-2 py-1 text-[0.68rem] font-semibold leading-snug text-amber-900">
                  לפי השעות הנפוצות ברשת, לא אומתו מול הסניף. כדאי לוודא לפני שיוצאים, במיוחד בערב חג.
                </p>
              )}
              <div className="mt-2 space-y-1.5">
                {hours.map((h) => (
                  <div key={h.key} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">{h.label}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{h.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-4">
          <DataIssueReport branch={branch} />
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 pt-2 border-t border-slate-100 bg-white sticky bottom-0 space-y-2">
          <a
            href={wazeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 text-sm font-black text-white shadow-md transition hover:bg-sky-600 active:scale-98"
          >
            <WazeIcon className="h-5 w-5" />
            <span>סע עכשיו ב-Waze לחניה</span>
          </a>

          <button
            type="button"
            onClick={() => onReport(branch)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-98"
          >
            <UsersIcon className="h-4 w-4 text-slate-500" />
            <span>דווח על מצב התור עכשיו</span>
          </button>
        </div>
      </div>
    </div>
  );
}
