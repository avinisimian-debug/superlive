"use client";

import { ChainLogo } from "./ChainLogo";

import type { Branch, LiveState } from "@/lib/types";
import { PARKING_SHORT } from "@/lib/live";
import { formatDistance } from "@/lib/geo";
import { openStatus, scheduleOf } from "@/lib/schedules";
import { useLive } from "@/lib/store";
import { CarIcon, MapPinIcon, WazeIcon, StarIcon, ClockIcon, UsersIcon } from "./icons";
import { getWazeNavigationUrl } from "@/lib/navigation";
import { useState } from "react";
import { CrowdMeter, StarBurst, TONE, useTilt } from "./ui";

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
  const hoursKnown = !!branch.hoursVerified || branch.hoursSource === "osm";
  const status = openStatus(scheduleOf(branch), date, !hoursKnown);
  const favorite = isFavorite(branch.id);
  const tone = TONE[live.congestion];
  // Without a fresh community report the level is a time-of-day estimate.
  const congestionLabel = live.estimated ? `צפוי: ${tone.label}` : tone.label;
  const wazeHref = getWazeNavigationUrl(branch);
  const { ref, handlers } = useTilt<HTMLElement>();
  // Bumped on each "save" so the star replays its pop and burst.
  const [burst, setBurst] = useState(0);

  return (
    <article
      ref={ref}
      {...handlers}
      className="tilt spotlight group relative overflow-hidden rounded-[1.6rem] bg-white p-4 shadow-card ring-1 ring-slate-200/60 hover:shadow-lift"
    >
      {/* Soft wash of the crowd colour behind the gauge */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full opacity-[0.13] blur-2xl"
        style={{ background: tone.color }}
      />

      {/* Tap target to open branch details */}
      <button
        type="button"
        onClick={() => onOpen(branch)}
        aria-label={`פרטים מלאים עבור ${branch.name}`}
        className="absolute inset-0 z-10 rounded-[1.6rem] outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      />

      <div className="relative flex items-start gap-3">
        <ChainLogo chain={branch.chain} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[0.98rem] font-extrabold tracking-tight text-ink-900">
              {branch.name}
            </h3>
            {branch.isCustom && (
              <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[0.6rem] font-black text-amber-800">
                חדש
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[0.74rem] font-medium text-slate-500">
            {branch.address ? `${branch.address} · ` : ""}
            {branch.city}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!favorite) setBurst((n) => n + 1);
            toggleFavorite(branch.id);
          }}
          aria-label={favorite ? "הסר ממועדפים" : "שמור במועדפים"}
          aria-pressed={favorite}
          className="relative z-20 -m-1 grid h-9 w-9 place-items-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-amber-400 active:scale-90"
        >
          <StarIcon
            key={burst}
            filled={favorite}
            className={`h-5 w-5 transition-transform duration-300 ${favorite ? "scale-110 text-amber-400" : ""} ${burst && favorite ? "star-pop" : ""}`}
          />
          {burst > 0 && favorite ? <StarBurst key={`b${burst}`} /> : null}
        </button>
      </div>

      {/* Live status */}
      <div className={`relative mt-3.5 flex items-center gap-3 rounded-2xl px-3 py-2.5 ${tone.soft}`}>
        <CrowdMeter congestion={live.congestion} live={!live.estimated} />
        <div className="min-w-0 flex-1">
          <p className={`text-[0.82rem] font-extrabold ${tone.text}`}>{congestionLabel}</p>
          <p className="text-[0.68rem] font-semibold text-slate-500">
            {live.estimated ? "הערכה לפי שעה ויום" : tone.wait}
          </p>
        </div>
        {!live.estimated ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[0.62rem] font-bold text-ink-900">
            <span className="live-dot !h-1.5 !w-1.5 text-emerald-500" />
            דיווח חי
          </span>
        ) : null}
      </div>

      {/* Facts */}
      <div className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] font-semibold text-slate-600">
        <span className={`inline-flex items-center gap-1 ${status.open ? "text-emerald-700" : "text-rose-600"}`}>
          <ClockIcon className="h-3.5 w-3.5" />
          {status.text}
        </span>
        <span className="inline-flex items-center gap-1">
          <CarIcon className="h-3.5 w-3.5 text-slate-400" />
          חניה {PARKING_SHORT[live.parking]}
        </span>
        {distance !== null ? (
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
            {routeInfo?.isRealRoad ? `${routeInfo.formattedDistance} · ${routeInfo.formattedDuration}` : formatDistance(distance)}
          </span>
        ) : null}
      </div>

      {/* Actions */}
      <div className="relative z-20 mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReport(branch);
          }}
          className="press inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-[0.78rem] font-bold text-ink-800 hover:bg-slate-200"
        >
          <UsersIcon className="h-4 w-4 text-slate-500" />
          דווח מה קורה
        </button>
        <a
          href={wazeHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="press bg-brand-gradient inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-[0.8rem] font-extrabold text-white shadow-[0_8px_18px_-10px_rgba(0,87,217,0.7)]"
        >
          <WazeIcon className="h-4 w-4" />
          נווט ב-Waze
        </a>
      </div>
    </article>
  );
}
