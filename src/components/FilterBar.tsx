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
    <div className="border-b border-slate-200/70 bg-white/80 px-4 py-4 backdrop-blur-md">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-5 w-5 text-slate-400" />
        <input
          type="search"
          inputMode="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="חיפוש סופר, עיר או כתובת…"
          aria-label="חיפוש סופרמרקט"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pe-11 ps-12 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearch("")}
            aria-label="ניקוי חיפוש"
            className="absolute inset-y-0 left-2.5 my-auto grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Quick toggles */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Toggle
          active={openNow}
          onClick={() => onOpenNow(!openNow)}
          label="פתוח עכשיו"
          icon={<ClockIcon className="h-3.5 w-3.5" />}
        />
        <Toggle
          active={lowCongestion}
          onClick={() => onLowCongestion(!lowCongestion)}
          label="עומס נמוך בלבד"
          icon={<UsersIcon className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Chains */}
      <div className="mt-4 flex items-center gap-2 text-[0.7rem] font-bold text-slate-500">
        <SlidersIcon className="h-3.5 w-3.5" />
        רשתות
      </div>
      <div className="edge-fade -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        <Chip
          label="הכל"
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

      {/* Sort */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[0.7rem] font-bold text-slate-500">מיון</span>
        <div className="flex flex-1 gap-1.5">
          <SortButton
            active={sort === "nearest"}
            onClick={() => onSort("nearest")}
            icon={<NavigationIcon className="h-4 w-4" />}
            label="הכי קרוב אליי"
          />
          <SortButton
            active={sort === "emptiest"}
            onClick={() => onSort("emptiest")}
            icon={<SparkIcon className="h-4 w-4" />}
            label="הכי פנוי"
          />
          <SortButton
            active={sort === "byCity"}
            onClick={() => onSort("byCity")}
            icon={<BuildingIcon className="h-4 w-4" />}
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
      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[0.8rem] font-semibold ring-1 ring-inset transition active:scale-[0.97] ${
        active
          ? "bg-slate-900 text-white ring-slate-900"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-[0.66rem] font-semibold tabular-nums ${
          active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
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
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[0.8rem] font-semibold ring-1 ring-inset transition active:scale-[0.97] ${
        active
          ? "bg-slate-900 text-white ring-slate-900"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      <span
        className={`grid h-4 w-4 place-items-center rounded-full ${
          active ? "bg-white/20" : "bg-slate-100"
        }`}
      >
        {active ? <CheckIcon className="h-3 w-3" /> : icon}
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
      className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-[0.74rem] font-semibold ring-1 ring-inset transition active:scale-[0.97] ${
        active
          ? "bg-slate-900 text-white ring-slate-900"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
