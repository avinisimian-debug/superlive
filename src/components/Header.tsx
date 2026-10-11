"use client";

import Link from "next/link";
import { useLive } from "@/lib/store";
import {
  LogoMark,
  NavigationIcon,
  MapPinIcon,
  BuildingIcon,
  ChevronDownIcon,
  DownloadIcon,
} from "./icons";

export function Header({
  totalBranches,
  cityCount,
  freeNow,
  city,
  onOpenCity,
}: {
  totalBranches: number;
  cityCount: number;
  freeNow: number;
  city: string;
  onOpenCity: () => void;
}) {
  const { locate, locating, usingGps } = useLive();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.85rem)]">
        {/* Wordmark */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <div className="leading-none">
              <p className="text-[1.28rem] font-extrabold tracking-tight text-slate-900">
                סופר<span className="text-emerald-600">-לייב</span>
              </p>
              <p className="mt-1 text-[0.54rem] font-bold uppercase tracking-[0.4em] text-slate-400">
                SuperLive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/download"
              aria-label="הורדת האפליקציה"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[0.64rem] font-bold text-white transition active:scale-[0.98]"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              הורדה
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.64rem] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-500/15">
              <span className="live-dot" aria-hidden="true" />
              LIVE
            </span>
          </div>
        </div>

        {/* Summary */}
        <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.78rem] text-slate-500">
          <span className="tabular-nums font-bold text-slate-900">
            {totalBranches.toLocaleString("he-IL")}
          </span>
          סניפים
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <span className="tabular-nums font-bold text-slate-900">
            {freeNow.toLocaleString("he-IL")}
          </span>
          פנויים כעת
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          {cityCount} ערים
        </p>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-[0.8rem] font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          >
            <NavigationIcon className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} />
            {locating ? "מאתר…" : usingGps ? "מעודכן למיקומך" : "המיקום שלי"}
          </button>

          <button
            type="button"
            onClick={onOpenCity}
            className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[0.8rem] font-semibold transition active:scale-[0.98] ${
              city !== "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            {city === "all" ? (
              <BuildingIcon className="h-4 w-4" />
            ) : (
              <MapPinIcon className="h-4 w-4" />
            )}
            <span className="max-w-24 truncate">
              {city === "all" ? "עיר" : city}
            </span>
            <ChevronDownIcon className="h-3.5 w-3.5 opacity-60" />
          </button>
        </div>
      </div>
    </header>
  );
}
