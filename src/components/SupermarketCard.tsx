"use client";

import type { Branch, Congestion, LiveState } from "@/lib/types";
import { CONGESTION_HINT, CONGESTION_LABEL, PARKING_SHORT } from "@/lib/live";
import { formatDistance } from "@/lib/geo";
import { isOpenAt } from "@/lib/schedules";
import { CarIcon, MapPinIcon, UsersIcon, WazeIcon } from "./icons";

const CONGESTION_DOT: Record<Congestion, string> = {
  free: "bg-emerald-500",
  medium: "bg-amber-500",
  heavy: "bg-red-500",
};

const CONGESTION_TEXT: Record<Congestion, string> = {
  free: "text-emerald-700",
  medium: "text-amber-700",
  heavy: "text-red-700",
};

export function SupermarketCard({
  branch,
  live,
  distance,
  now,
  onReport,
}: {
  branch: Branch;
  live: LiveState;
  distance: number | null;
  now: number;
  onReport: (branch: Branch) => void;
}) {
  const open = isOpenAt(branch.scheduleIdx, new Date(now));
  const wazeHref = `https://waze.com/ul?ll=${branch.lat},${branch.lng}&navigate=yes`;

  return (
    <article className="animate-card rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition-shadow duration-300 hover:shadow-lift">
      {/* Line 1 — chain, branch name, city + open status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold tracking-wide text-slate-400">
            {branch.chain}
          </p>
          <h3 className="mt-0.5 truncate text-[1.02rem] font-bold tracking-tight text-slate-900">
            {branch.name}
          </h3>
          <span className="mt-1.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-medium text-slate-500">
            {branch.city}
          </span>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 text-[0.7rem] font-semibold ${
            open ? "text-slate-600" : "text-slate-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              open ? "bg-emerald-500" : "bg-slate-300"
            }`}
            aria-hidden="true"
          />
          {open ? "פתוח" : "סגור"}
        </span>
      </div>

      {/* Line 2 — single unified status pill */}
      <div className="mt-3">
        <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[0.8rem] ring-1 ring-inset ring-slate-200/70">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${CONGESTION_DOT[live.congestion]}`}
            aria-hidden="true"
          />
          <span className={`font-semibold ${CONGESTION_TEXT[live.congestion]}`}>
            {CONGESTION_LABEL[live.congestion]}
          </span>
          <span className="text-slate-400">
            {CONGESTION_HINT[live.congestion]}
          </span>
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <CarIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate font-medium text-slate-600">
            חניה {PARKING_SHORT[live.parking]}
          </span>
        </span>
      </div>

      {/* Line 3 — address + distance */}
      <p className="mt-2 flex items-center gap-1.5 text-[0.8rem] text-slate-500">
        <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate">{branch.address}</span>
        {distance !== null ? (
          <>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-600">
              {formatDistance(distance)}
            </span>
          </>
        ) : null}
      </p>

      {/* Line 4 — compact action bar */}
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        <a
          href={wazeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-50 text-[0.8rem] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200/70 transition active:scale-[0.98]"
        >
          <WazeIcon className="h-4 w-4 text-sky-500" />
          Waze
        </a>
        <button
          type="button"
          onClick={() => onReport(branch)}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-[0.8rem] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/70 transition active:scale-[0.98] hover:bg-slate-50"
        >
          <UsersIcon className="h-4 w-4 text-slate-400" />
          דווח עומס
        </button>
      </div>
    </article>
  );
}
