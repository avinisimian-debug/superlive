"use client";

import { ChainLogo } from "./ChainLogo";

import type { Branch, Congestion, LiveState } from "@/lib/types";
import { CONGESTION_HINT, CONGESTION_LABEL, PARKING_SHORT } from "@/lib/live";
import { formatDistance } from "@/lib/geo";
import { isOpenAt, openStatus } from "@/lib/schedules";
import { useLive } from "@/lib/store";
import { getChainMeta } from "@/lib/chains";
import { CarIcon, MapPinIcon, UsersIcon, WazeIcon, StarIcon, ClockIcon } from "./icons";
import { getWazeNavigationUrl } from "@/lib/navigation";

const CONGESTION_CONFIG: Record<
  Congestion,
  {
    bg: string;
    border: string;
    dot: string;
    text: string;
    label: string;
    wait: string;
    barColor: string;
  }
> = {
  free: {
    bg: "bg-emerald-50/80",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    text: "text-emerald-800",
    label: "פנוי עכשיו",
    wait: "ללא תור בקופות",
    barColor: "bg-emerald-500",
  },
  medium: {
    bg: "bg-amber-50/80",
    border: "border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-900",
    label: "עומס סביר",
    wait: "תור של 3–5 דק׳",
    barColor: "bg-amber-500",
  },
  heavy: {
    bg: "bg-rose-50/80",
    border: "border-rose-200",
    dot: "bg-rose-500",
    text: "text-rose-900",
    label: "עמוס בקופות",
    wait: "תורים ארוכים (15+ דק׳)",
    barColor: "bg-rose-500",
  },
};

export function SupermarketCard({
  branch,
  live,
  distance,
  routeInfo,
  now,
  onReport,
  onOpen,
}: {
  branch: Branch;
  live: LiveState;
  distance: number | null;
  routeInfo?: {
    drivingDistanceKm: number;
    drivingMinutes: number;
    formattedDistance: string;
    formattedDuration: string;
    isRealRoad: boolean;
  };
  now: number;
  onReport: (branch: Branch) => void;
  onOpen: (branch: Branch) => void;
}) {
  const { isFavorite, toggleFavorite } = useLive();
  const date = new Date(now);
  const status = openStatus(branch.scheduleIdx, date, !branch.hoursVerified);
  const favorite = isFavorite(branch.id);
  const congestion = CONGESTION_CONFIG[live.congestion];
  // Without a fresh community report the level is a time-of-day estimate.
  const congestionLabel = live.estimated ? `צפוי: ${CONGESTION_LABEL[live.congestion]}` : congestion.label;
  const chainMeta = getChainMeta(branch.chain);

  // Exact physical Waze navigation URL
  const wazeHref = getWazeNavigationUrl(branch);

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300">
      {/* Side status color bar indicating congestion at a glance */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-1.5 ${congestion.barColor}`}
        aria-hidden="true"
      />

      {/* Tap target to open branch details */}
      <button
        type="button"
        onClick={() => onOpen(branch)}
        aria-label={`פרטים מלאים עבור ${branch.name}`}
        className="absolute inset-0 z-10 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      />

      {/* Header: Chain Logo Badge + Branch Name + Favorite Button */}
      <div className="flex items-start justify-between gap-3 pr-2">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Authentic Chain Logo */}
          <ChainLogo chain={branch.chain} size="md" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-md border px-2 py-0.5 text-[0.66rem] font-bold ${chainMeta.badgeBg} ${chainMeta.badgeText}`}>
                {chainMeta.shortName}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.66rem] font-bold text-slate-600">
                {branch.city}
              </span>
              {branch.isCustom && (
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[0.62rem] font-black text-amber-800">
                  חדש במפה
                </span>
              )}
            </div>

            <h3 className="mt-1 text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
              {branch.name}
            </h3>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {branch.address}
            </p>
          </div>
        </div>

        {/* Favorite Star Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(branch.id);
          }}
          aria-label={favorite ? "הסר ממועדפים" : "שמור במועדפים"}
          className="relative z-20 grid h-8 w-8 place-items-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-amber-400 active:scale-90"
        >
          <StarIcon
            filled={favorite}
            className={`h-5 w-5 ${favorite ? "text-amber-400" : ""}`}
          />
        </button>
      </div>

      {/* Live Congestion & Parking Metric Strip */}
      <div className="mt-3.5 pr-2 grid grid-cols-2 gap-2">
        {/* Congestion Box */}
        <div className={`rounded-2xl border p-2.5 ${congestion.bg} ${congestion.border}`}>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${congestion.dot} shrink-0 ${live.estimated ? "opacity-60" : "animate-pulse"}`}
            />
            <span className={`text-xs font-black ${congestion.text}`}>
              {congestionLabel}
            </span>
          </div>
          <p className="text-[0.68rem] font-semibold text-slate-600 mt-0.5">
            {congestion.wait}
          </p>
        </div>

        {/* Parking & Hours Box */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-2.5">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
            <CarIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>חניה: {PARKING_SHORT[live.parking]}</span>
          </div>
          <p className={`text-[0.68rem] font-bold mt-0.5 ${status.open ? "text-emerald-700" : "text-rose-700"}`}>
            {status.text}
          </p>
        </div>
      </div>

      {/* Footer Strip: Distance + Waze Button */}
      <div className="mt-3 pr-2 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          {distance !== null ? (
            <span className="flex items-center gap-1 font-bold text-slate-700">
              <MapPinIcon className="h-3.5 w-3.5 text-sky-600" />
              {formatDistance(distance)}
            </span>
          ) : (
            <span>{branch.hoursVerified ? branch.hours : "שעות משוערות"}</span>
          )}
        </div>

        <div className="relative z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReport(branch);
            }}
            className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-[0.7rem] font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95"
          >
            <UsersIcon className="h-3.5 w-3.5 inline ml-1 text-slate-500" />
            דווח
          </button>

          <a
            href={wazeHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-black text-white shadow-xs transition hover:bg-sky-600 active:scale-95"
          >
            <WazeIcon className="h-4 w-4" />
            <span>Waze</span>
          </a>
        </div>
      </div>
    </article>
  );
}
