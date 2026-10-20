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
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
        {/* Brand row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9 rounded-xl border border-cyan-500/20 shadow-md shadow-cyan-500/10" />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">
                  זרם
                </span>
                <span className="live-dot" aria-hidden="true" />
              </div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-cyan-400">
                Zerem Fintech Live
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/download"
              aria-label="הורדת האפליקציה"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1 text-[0.72rem] font-bold text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-300 active:scale-[0.98]"
            >
              <DownloadIcon className="h-3.5 w-3.5 text-cyan-400" />
              הורדה
            </Link>
            <AuthButton />
          </div>
        </div>

        {/* Telemetry row */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 text-[0.76rem]">
          <div className="flex items-center gap-1 text-slate-400">
            <span>סניפים בארץ:</span>
            <span className="font-extrabold tabular-nums text-white">
              {totalBranches.toLocaleString("he-IL")}
            </span>
          </div>
          <span className="text-slate-700" aria-hidden="true">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-emerald-400 font-bold tabular-nums">
              {freeNow.toLocaleString("he-IL")} פנויים כעת
            </span>
          </div>
          <span className="text-slate-700" aria-hidden="true">|</span>
          <div className="text-slate-400">
            <span className="font-bold text-slate-200">{cityCount}</span> ערים
          </div>
        </div>

        {/* Action pills */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[0.82rem] font-bold transition active:scale-[0.98] disabled:opacity-60 ${
              usingGps
                ? "border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 shadow-sm shadow-cyan-500/20 gps-active"
                : "border border-slate-700/80 bg-slate-900 text-slate-100 hover:border-slate-600 hover:bg-slate-850"
            }`}
          >
            <NavigationIcon
              className={`h-4 w-4 ${locating ? "animate-spin text-cyan-400" : usingGps ? "text-cyan-400" : "text-slate-400"}`}
            />
            {locating ? "מאתר מיקום…" : usingGps ? "מעודכן למיקומך בלייב" : "סופרים קרובים אליי"}
          </button>

          <button
            type="button"
            onClick={onOpenCity}
            className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-[0.82rem] font-bold transition active:scale-[0.98] ${
              city !== "all"
                ? "border-cyan-500/40 bg-cyan-950/50 text-cyan-300"
                : "border-slate-700/80 bg-slate-900 text-slate-200 hover:border-slate-600"
            }`}
          >
            {city === "all" ? (
              <BuildingIcon className="h-4 w-4 text-slate-400" />
            ) : (
              <MapPinIcon className="h-4 w-4 text-cyan-400" />
            )}
            <span className="max-w-24 truncate">
              {city === "all" ? "כל הארץ" : city}
            </span>
            <ChevronDownIcon className="h-3.5 w-3.5 opacity-70" />
          </button>
        </div>
      </div>
    </header>
  );
}
