"use client";

import type { Branch, Congestion, LiveState } from "@/lib/types";
import { CONGESTION_HINT, CONGESTION_LABEL, PARKING_SHORT } from "@/lib/live";
import { formatDistance } from "@/lib/geo";
import { isOpenAt } from "@/lib/schedules";
import { useLive } from "@/lib/store";
import { CarIcon, MapPinIcon, UsersIcon, WazeIcon, StarIcon } from "./icons";

const CONGESTION_STYLES: Record<
  Congestion,
  { bg: string; dot: string; text: string; badge: string }
> = {
  free: {
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
  },
  medium: {
    bg: "bg-amber-50",
    dot: "bg-amber-500",
    text: "text-amber-800",
    badge: "bg-amber-100 text-amber-800",
  },
  heavy: {
    bg: "bg-rose-50",
    dot: "bg-rose-500",
    text: "text-rose-700",
    badge: "bg-rose-100 text-rose-800",
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

  // Waze deep link with both exact GPS coordinates and query name so Waze resolves the exact venue name
  const queryName = encodeURIComponent(`${branch.chain} ${branch.name}`);
  const wazeHref = `https://www.waze.com/ul?ll=${branch.lat}%2C${branch.lng}&q=${queryName}&navigate=yes`;

  return (
    <article className="animate-waze-card relative rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card transition-all duration-200 hover:shadow-lift">
      {/* Tap target to open full branch details */}
      <button
        type="button"
        onClick={() => onOpen(branch)}
        aria-label={`הצג פרטים מלאים עבור ${branch.name}`}
        data-testid="card-open"
        className="absolute inset-0 z-10 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500/40"
      />

      {/* Row 1: Chain Badge, Branch Name, Open Status, Favorite */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded-lg bg-sky-50 px-2 py-0.5 text-[0.7rem] font-bold text-sky-700">
              {branch.chain}
            </span>
            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.66rem] font-bold text-slate-500">
              {branch.city}
            </span>
          </div>
          <h3 className="mt-1.5 truncate text-[1.08rem] font-black tracking-tight text-slate-900">
            {branch.name}
          </h3>
        </div>

        <div className="relative z-20 flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(branch.id);
            }}
            aria-label={favorite ? "הסר מהמועדפים" : "הוסף למועדפים"}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition hover:bg-slate-100 active:scale-90"
          >
            <StarIcon
              filled={favorite}
              className={`h-4.5 w-4.5 ${favorite ? "text-amber-400" : "text-slate-300"}`}
            />
          </button>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
              open
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                open ? "bg-emerald-500" : "bg-slate-400"
              }`}
              aria-hidden="true"
            />
            {open ? "פתוח" : "סגור"}
          </span>
        </div>
      </div>

      {/* Row 2: Live Congestion & Parking Telemetry */}
      <div className="mt-3">
        <div
          className={`inline-flex max-w-full items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-bold ${congestion.bg} ${congestion.text}`}
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${congestion.dot}`} aria-hidden="true" />
          <span>{CONGESTION_LABEL[live.congestion]}</span>
          <span className="opacity-75">({CONGESTION_HINT[live.congestion]})</span>
          <span className="opacity-30" aria-hidden="true">
            ·
          </span>
          <CarIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate opacity-90">
            חניה {PARKING_SHORT[live.parking]}
          </span>
        </div>
      </div>

      {/* Row 3: Address & Distance */}
      <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate">{branch.address}</span>
        {distance !== null ? (
          <>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="shrink-0 font-extrabold tabular-nums text-sky-600">
              {formatDistance(distance)}
            </span>
          </>
        ) : null}
      </p>

      {/* Row 4: Waze-style Action Bar */}
      <div className="relative z-20 mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        <a
          href={wazeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-500 text-xs font-black text-white shadow-xs transition hover:bg-sky-600 active:scale-98"
        >
          <WazeIcon className="h-4.5 w-4.5" />
          ניווט ב-Waze
        </a>
        <button
          type="button"
          onClick={() => onReport(branch)}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 text-xs font-bold text-slate-700 transition hover:bg-slate-200 active:scale-98"
        >
          <UsersIcon className="h-4 w-4 text-slate-500" />
          דווח עומס
        </button>
      </div>
    </article>
  );
}
