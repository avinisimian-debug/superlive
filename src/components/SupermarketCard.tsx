"use client";

import type { Branch, Congestion, LiveState } from "@/lib/types";
import { CONGESTION_HINT, CONGESTION_LABEL, PARKING_SHORT } from "@/lib/live";
import { formatDistance } from "@/lib/geo";
import { isOpenAt } from "@/lib/schedules";
import { useLive } from "@/lib/store";
import { CarIcon, MapPinIcon, UsersIcon, WazeIcon, StarIcon } from "./icons";

const CONGESTION_STYLES: Record<
  Congestion,
  { pillBg: string; dot: string; text: string; glow: string }
> = {
  free: {
    pillBg: "bg-emerald-950/50 border-emerald-500/40 text-emerald-300",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    text: "text-emerald-300",
    glow: "shadow-emerald-500/10",
  },
  medium: {
    pillBg: "bg-amber-950/50 border-amber-500/40 text-amber-300",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    text: "text-amber-300",
    glow: "shadow-amber-500/10",
  },
  heavy: {
    pillBg: "bg-rose-950/50 border-rose-500/40 text-rose-300",
    dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
    text: "text-rose-300",
    glow: "shadow-rose-500/10",
  },
};

export function SupermarketCard({
  branch,
  live,
  distance,
  now,
  onReport,
  onOpen,
}: {
  branch: Branch;
  live: LiveState;
  distance: number | null;
  now: number;
  onReport: (branch: Branch) => void;
  onOpen: (branch: Branch) => void;
}) {
  const { isFavorite, toggleFavorite } = useLive();
  const open = isOpenAt(branch.scheduleIdx, new Date(now));
  const favorite = isFavorite(branch.id);
  const congestion = CONGESTION_STYLES[live.congestion];

  // Direct GPS coordinates route in Waze for 100% pinpoint accuracy
  const wazeHref = `https://www.waze.com/ul?ll=${branch.lat}%2C${branch.lng}&navigate=yes`;

  return (
    <article className="animate-card relative rounded-2xl border border-slate-800/90 bg-slate-900/95 p-4 shadow-md transition-all duration-200 hover:border-slate-700 hover:bg-slate-900">
      {/* Tap target to open full branch details */}
      <button
        type="button"
        onClick={() => onOpen(branch)}
        aria-label={`הצג פרטים מלאים עבור ${branch.name}`}
        data-testid="card-open"
        className="absolute inset-0 z-10 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500/40"
      />

      {/* Row 1: Chain, Branch Name, Status, Favorite */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[0.72rem] font-bold tracking-wider uppercase text-cyan-400">
              {branch.chain}
            </span>
            <span className="rounded-md border border-slate-800 bg-slate-800/60 px-2 py-0.5 text-[0.66rem] font-medium text-slate-300">
              {branch.city}
            </span>
          </div>
          <h3 className="mt-1 truncate text-[1.08rem] font-black tracking-tight text-white">
            {branch.name}
          </h3>
        </div>

        <div className="relative z-20 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(branch.id);
            }}
            aria-label={favorite ? "הסר מהמועדפים" : "הוסף למועדפים"}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/40 text-slate-400 transition hover:border-slate-700 hover:text-amber-400 active:scale-90"
          >
            <StarIcon
              filled={favorite}
              className={`h-4 w-4 ${favorite ? "text-amber-400" : "text-slate-500"}`}
            />
          </button>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.68rem] font-bold ${
              open
                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                : "border-slate-800 bg-slate-900 text-slate-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                open ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-slate-600"
              }`}
              aria-hidden="true"
            />
            {open ? "פתוח" : "סגור"}
          </span>
        </div>
      </div>

      {/* Row 2: Live Congestion & Parking Telemetry Pill */}
      <div className="mt-3">
        <div
          className={`inline-flex max-w-full items-center gap-2 rounded-xl border px-3 py-1.5 text-[0.78rem] font-semibold ${congestion.pillBg}`}
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${congestion.dot}`} aria-hidden="true" />
          <span className="font-extrabold">{CONGESTION_LABEL[live.congestion]}</span>
          <span className="opacity-80">({CONGESTION_HINT[live.congestion]})</span>
          <span className="opacity-40" aria-hidden="true">
            ·
          </span>
          <CarIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate opacity-90">
            חניה {PARKING_SHORT[live.parking]}
          </span>
        </div>
      </div>

      {/* Row 3: Address & Distance */}
      <p className="mt-2.5 flex items-center gap-1.5 text-[0.78rem] text-slate-400">
        <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span className="truncate">{branch.address}</span>
        {distance !== null ? (
          <>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <span className="shrink-0 font-extrabold tabular-nums text-cyan-300">
              {formatDistance(distance)}
            </span>
          </>
        ) : null}
      </p>

      {/* Row 4: Action Bar */}
      <div className="relative z-20 mt-3 flex items-center gap-2 border-t border-slate-800/80 pt-3">
        <a
          href={wazeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 text-[0.8rem] font-extrabold text-cyan-300 shadow-sm transition hover:border-cyan-400 hover:bg-cyan-950/60 active:scale-[0.98]"
        >
          <WazeIcon className="h-4 w-4 text-cyan-400" />
          ניווט Waze ישיר
        </a>
        <button
          type="button"
          onClick={() => onReport(branch)}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-850 text-[0.8rem] font-bold text-slate-300 transition hover:border-slate-700 hover:text-white active:scale-[0.98]"
        >
          <UsersIcon className="h-4 w-4 text-slate-400" />
          דווח עומס
        </button>
      </div>
    </article>
  );
}
