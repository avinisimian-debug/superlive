"use client";

import { CHAINS, type Chain } from "@/lib/types";
import {
  SearchIcon,
  SlidersIcon,
  CloseIcon,
  NavigationIcon,
  SparkIcon,
  BuildingIcon,
  CheckIcon,
  ClockIcon,
  UsersIcon,
} from "./icons";

export type ChainFilter = "all" | Chain;
export type SortMode = "nearest" | "emptiest" | "byCity";

export function FilterBar({
  search,
  onSearch,
  chain,
  onChain,
  chainCounts,
  sort,
  onSort,
  openNow,
  onOpenNow,
  lowCongestion,
  onLowCongestion,
}: {
  search: string;
  onSearch: (value: string) => void;
  chain: ChainFilter;
  onChain: (value: ChainFilter) => void;
  chainCounts: Record<string, number>;
  sort: SortMode;
  onSort: (value: SortMode) => void;
  openNow: boolean;
  onOpenNow: (value: boolean) => void;
  lowCongestion: boolean;
  onLowCongestion: (value: boolean) => void;
}) {
  return (
    <div className="border-b border-slate-800/80 bg-slate-950/90 px-4 py-3.5 backdrop-blur-md">
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-4 w-4 text-slate-400" />
        <input
          type="search"
          inputMode="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="חיפוש סופרמרקט, עיר, רשת או כתובת…"
          aria-label="חיפוש סופרמרקט"
          className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pe-10 ps-10 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/70 focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500/30"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearch("")}
            aria-label="ניקוי חיפוש"
            className="absolute inset-y-0 left-2.5 my-auto grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Quick Toggles */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Toggle
          active={openNow}
          onClick={() => onOpenNow(!openNow)}
          label="פתוח עכשיו"
          icon={<ClockIcon className="h-3.5 w-3.5" />}
        />
        <Toggle
          active={lowCongestion}
          onClick={() => onLowCongestion(!lowCongestion)}
          label="ללא תור / עומס נמוך"
          icon={<UsersIcon className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Chains Strip */}
      <div className="mt-3.5 flex items-center gap-1.5 text-[0.7rem] font-bold text-slate-400">
        <SlidersIcon className="h-3.5 w-3.5 text-cyan-400" />
        סינון לפי רשת
      </div>
      <div className="edge-fade -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar">
        <Chip
          label="כל הרשתות"
          count={chainCounts["all"] ?? 0}
          active={chain === "all"}
          onClick={() => onChain("all")}
        />
        {CHAINS.map((c) => {
          const count = chainCounts[c] ?? 0;
          if (count === 0) return null;
          return (
            <Chip
              key={c}
              label={c}
              count={count}
              active={chain === c}
              onClick={() => onChain(c)}
            />
          );
        })}
      </div>

      {/* Sort Buttons */}
      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800/60">
        <span className="text-[0.7rem] font-bold text-slate-400 shrink-0">מיון:</span>
        <div className="flex flex-1 gap-1.5">
          <SortButton
            active={sort === "nearest"}
            onClick={() => onSort("nearest")}
            icon={<NavigationIcon className="h-3.5 w-3.5" />}
            label="הכי קרוב"
          />
          <SortButton
            active={sort === "emptiest"}
            onClick={() => onSort("emptiest")}
            icon={<SparkIcon className="h-3.5 w-3.5" />}
            label="הכי פנוי"
          />
          <SortButton
            active={sort === "byCity"}
            onClick={() => onSort("byCity")}
            icon={<BuildingIcon className="h-3.5 w-3.5" />}
            label="לפי עיר"
          />
        </div>
      </div>
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.76rem] font-bold transition active:scale-[0.97] ${
        active
          ? "border border-cyan-500/60 bg-cyan-950/60 text-cyan-300 shadow-sm shadow-cyan-500/10"
          : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-[0.64rem] font-semibold tabular-nums ${
          active ? "bg-cyan-500/20 text-cyan-200" : "bg-slate-800 text-slate-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function Toggle({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[0.76rem] font-bold transition active:scale-[0.97] ${
        active
          ? "border border-cyan-500/60 bg-cyan-950/60 text-cyan-300 shadow-sm shadow-cyan-500/10"
          : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
      }`}
    >
      <span
        className={`grid h-3.5 w-3.5 place-items-center rounded-full ${
          active ? "text-cyan-400" : "text-slate-400"
        }`}
      >
        {active ? <CheckIcon className="h-3 w-3 text-cyan-300" /> : icon}
      </span>
      {label}
    </button>
  );
}

function SortButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-[0.74rem] font-bold transition active:scale-[0.97] ${
        active
          ? "border border-cyan-500/60 bg-cyan-950/60 text-cyan-300 shadow-sm shadow-cyan-500/10"
          : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
      }`}
    >
      <span className={active ? "text-cyan-400" : "text-slate-500"}>{icon}</span>
      {label}
    </button>
  );
}
