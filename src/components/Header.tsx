"use client";

import { useLive } from "@/lib/store";
import {
  LogoMark,
  NavigationIcon,
  MapPinIcon,
  BuildingIcon,
  ChevronDownIcon,
} from "./icons";
import { AuthButton } from "./AuthButton";

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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
        {/* Brand bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9 rounded-2xl shadow-xs" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[1.25rem] font-black tracking-tight text-slate-900">
                  זרם
                </span>
                <span className="waze-dot" aria-hidden="true" />
              </div>
              <p className="text-[0.62rem] font-bold text-sky-600 tracking-wider">
                עומסים וחניה בסופר בלייב
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AuthButton />
          </div>
        </div>

        {/* Waze-style Quick Action Buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {/* Quick Button 1: Location / GPS */}
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className={`flex items-center gap-2.5 rounded-2xl p-2 text-right transition active:scale-98 ${
              usingGps
                ? "bg-sky-50 border border-sky-300 text-sky-900 shadow-xs"
                : "bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              usingGps ? "bg-sky-500 text-white shadow-xs" : "bg-sky-100 text-sky-600"
            }`}>
              <NavigationIcon className={`h-5 w-5 ${locating ? "animate-spin" : ""}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.66rem] font-bold text-slate-500">מיקום נוכחי</p>
              <p className="truncate text-xs font-black">
                {locating ? "מאתר…" : usingGps ? "מעודכן למיקומך" : "סופרים קרובים"}
              </p>
            </div>
          </button>

          {/* Quick Button 2: City Selector */}
          <button
            type="button"
            onClick={onOpenCity}
            className={`flex items-center gap-2.5 rounded-2xl p-2 text-right transition active:scale-98 ${
              city !== "all"
                ? "bg-sky-50 border border-sky-300 text-sky-900 shadow-xs"
                : "bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              city !== "all" ? "bg-sky-500 text-white shadow-xs" : "bg-teal-100 text-teal-600"
            }`}>
              {city === "all" ? (
                <BuildingIcon className="h-5 w-5" />
              ) : (
                <MapPinIcon className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.66rem] font-bold text-slate-500">אזור פעילות</p>
              <p className="truncate text-xs font-black">
                {city === "all" ? "כל הארץ" : city}
              </p>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Live Telemetry Pill */}
        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-100/80 px-3 py-1.5 text-[0.74rem] text-slate-600 font-medium">
          <span className="tabular-nums font-bold text-slate-900">
            {totalBranches.toLocaleString("he-IL")} סניפים
          </span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1 font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {freeNow.toLocaleString("he-IL")} פנויים כעת
          </span>
          <span className="text-slate-300">·</span>
          <span>{cityCount} יישובים</span>
        </div>
      </div>
    </header>
  );
}
