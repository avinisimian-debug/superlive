"use client";

import { ChainLogo } from "./ChainLogo";
import { DataIssueReport } from "./DataIssueReport";

import { useMemo, useState } from "react";
import type { Branch, Congestion, LiveState, Parking } from "@/lib/types";
import { CONGESTION_HINT, CONGESTION_LABEL, PARKING_LABEL, loadScore } from "@/lib/live";
import { earliestOpening, isOpenAt, openStatus, scheduleOf, weeklyHours } from "@/lib/schedules";
import { formatDistance } from "@/lib/geo";
import { useLive } from "@/lib/store";
import { getWazeNavigationUrl } from "@/lib/navigation";
import { getChainMeta } from "@/lib/chains";
import { CrowdMeter, Sheet, TONE } from "./ui";
import {
  CheckIcon,
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

  const tone = TONE[live.congestion];
  const maxLoad = Math.max(...bars.map((b) => b.load), 0.01);

  return (
    <Sheet onClose={onClose} labelledBy="branch-title" className="max-h-[92dvh]">
      <div className="overflow-y-auto overscroll-contain">
        {/* Hero tinted by the crowd level */}
        <div className="hero px-5 pb-5 pt-7">
          <span
            aria-hidden="true"
            className="aurora"
            style={{ width: "16rem", height: "16rem", top: "-6rem", left: "-4rem", background: tone.color, opacity: 0.45 }}
          />
          <span className="aurora aurora-b" aria-hidden="true" />

          <div className="flex items-start gap-3">
            <ChainLogo chain={branch.chain} size="lg" className="ring-2 ring-white/20" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.7rem] font-bold text-white/55">
                {chainMeta.shortName} · {branch.city}
              </p>
              <h2 id="branch-title" className="mt-0.5 text-[1.3rem] font-black leading-tight tracking-tight">
                {branch.name}
              </h2>
              <p className="mt-0.5 truncate text-[0.74rem] text-white/55">{branch.address || branch.city}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <IconButton onClick={() => toggleFavorite(branch.id)} label={favorite ? "הסר ממועדפים" : "שמור במועדפים"}>
                <StarIcon filled={favorite} className={`h-5 w-5 ${favorite ? "text-amber-300" : ""}`} />
              </IconButton>
              <IconButton onClick={share} label={copied ? "הקישור הועתק" : "שיתוף"}>
                {copied ? <CheckIcon className="h-5 w-5 text-emerald-300" /> : <ShareIcon className="h-5 w-5" />}
              </IconButton>
              <IconButton onClick={onClose} label="סגירה">
                <CloseIcon className="h-5 w-5" />
              </IconButton>
            </div>
          </div>

          {branch.locationTrust === "unverified" && (
            <p className="mt-3 rounded-xl bg-amber-400/15 px-3 py-2 text-[0.7rem] font-semibold text-amber-200">
              מיקום הסניף עדיין לא אומת. אם הגעת למקום אחר, נשמח לדיווח.
            </p>
          )}

          {/* Live gauge */}
          <div className="glass-dark mt-4 flex items-center gap-4 rounded-3xl p-4">
            <CrowdMeter congestion={live.congestion} live={!live.estimated} size="lg" onDark />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-black" style={{ color: tone.color }}>
                {live.estimated ? `צפוי: ${CONGESTION_LABEL[live.congestion]}` : tone.label}
              </p>
              <p className="text-[0.72rem] font-medium leading-snug text-white/60">
                {live.estimated || live.lastReportAt === null
                  ? "אין דיווח עדכני. ההערכה מבוססת על השעה והיום בשבוע."
                  : `לפי ${live.reportCount === 1 ? "דיווח אחד" : `${live.reportCount} דיווחים`} מהקהילה, האחרון ${minutesAgoLabel(live.lastReportAt, now)}.`}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {/* Quick facts */}
          <div className="grid grid-cols-3 gap-2">
            <Fact
              icon={<ClockIcon className="h-4 w-4" />}
              label={hoursKnown ? "שעות" : "שעות משוערות"}
              value={status.open ? (hoursKnown ? "פתוח" : "כנראה פתוח") : hoursKnown ? "סגור" : "כנראה סגור"}
              hint={status.text.split(" · ")[1] ?? status.text}
              tone={status.open ? "text-emerald-700" : "text-rose-600"}
            />
            <Fact
              icon={<CarIcon className="h-4 w-4" />}
              label="חניה"
              value={PARKING_LABEL[live.parking].replace("חניה ", "")}
              hint={live.estimated ? "הערכה" : "לפי דיווח"}
            />
            <Fact
              icon={<MapPinIcon className="h-4 w-4" />}
              label="מרחק"
              value={distance !== null ? formatDistance(distance) : "—"}
              hint="קו אווירי"
            />
          </div>

          {/* Hourly forecast */}
          <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
            <div className="flex items-center justify-between">
              <p className="text-[0.82rem] font-extrabold text-ink-900">עומס צפוי היום</p>
              <p className="text-[0.64rem] font-semibold text-slate-400">הערכה לפי שעות</p>
            </div>
            {quietestHour && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[0.74rem] font-bold text-emerald-700">
                <ZapIcon className="h-3.5 w-3.5" />
                הכי שקט סביב {quietestHour.hour}:00
              </p>
            )}
            <div className="mt-5 flex h-28 items-end justify-between gap-1.5">
              {bars.map(({ hour, load, congestion }, i) => {
                const heightPct = Math.max(14, Math.round((load / maxLoad) * 100));
                const isCurrent = Math.abs(currentHour - hour) <= 1;
                return (
                  <div key={hour} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <div
                      className={`relative w-full origin-bottom rounded-[0.55rem] ${isCurrent ? "shadow-glow" : ""}`}
                      style={{
                        height: `${heightPct}%`,
                        background: isCurrent ? "linear-gradient(180deg,#00c2ff,#0057d9)" : BAR_COLOR[congestion],
                        opacity: isCurrent ? 1 : 0.85,
                        animation: `bar-grow 0.7s var(--ease-spring) ${0.05 * i}s both`,
                      }}
                    >
                      {isCurrent ? (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink-900 px-1.5 py-0.5 text-[0.56rem] font-bold text-white">
                          עכשיו
                        </span>
                      ) : null}
                    </div>
                    <span className={`tabular text-[0.62rem] font-bold ${isCurrent ? "text-brand-700" : "text-slate-400"}`}>
                      {hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly hours */}
          <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200/70">
            <p className="flex items-center gap-1.5 text-[0.82rem] font-extrabold text-ink-900">
              <ClockIcon className="h-4 w-4 text-brand-600" />
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
              <p className="mt-2 rounded-xl bg-amber-50 px-2.5 py-1.5 text-[0.68rem] font-semibold leading-snug text-amber-900">
                לפי השעות הנפוצות ברשת, לא אומתו מול הסניף. כדאי לוודא לפני שיוצאים, במיוחד בערב חג.
              </p>
            )}
            <div className="mt-2.5 divide-y divide-slate-100">
              {hours.map((h) => (
                <div key={h.key} className="flex items-center justify-between py-1.5 text-[0.76rem]">
                  <span className="font-bold text-slate-500">{h.label}</span>
                  <span className="tabular font-semibold text-ink-900">{h.value}</span>
                </div>
              ))}
            </div>
          </div>

          <DataIssueReport branch={branch} />
        </div>
      </div>

      {/* Sticky actions */}
      <div className="flex gap-2 border-t border-slate-100 bg-white p-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
        <button
          type="button"
          onClick={() => onReport(branch)}
          className="press inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 text-[0.82rem] font-bold text-ink-800"
        >
          <UsersIcon className="h-4 w-4 text-slate-500" />
          דיווח
        </button>
        <a
          href={wazeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="press sheen bg-brand-gradient inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl text-[0.9rem] font-black text-white shadow-glow"
        >
          <WazeIcon className="h-5 w-5" />
          סע עכשיו ב-Waze
        </a>
      </div>
    </Sheet>
  );
}

function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="press grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20"
    >
      {children}
    </button>
  );
}

function Fact({
  icon,
  label,
  value,
  hint,
  tone = "text-ink-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200/70">
      <p className="flex items-center gap-1 text-[0.64rem] font-bold text-slate-400">
        {icon}
        {label}
      </p>
      <p className={`mt-1 truncate text-[0.92rem] font-black ${tone}`}>{value}</p>
      <p className="truncate text-[0.62rem] font-semibold text-slate-400">{hint}</p>
    </div>
  );
}
