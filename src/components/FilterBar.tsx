"use client";

import { CHAINS, type Chain } from "@/lib/types";
import { getChainMeta } from "@/lib/chains";
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
    <div className="border-b border-slate-200/80 bg-white px-4 py-3.5 shadow-xs">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-3.5 my-auto flex items-center text-slate-400">
          <SearchIcon className="h-5 w-5" />
        </div>
        <input
          type="search"
          inputMode="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="חיפוש סופרמרקט, רשת, עיר או רחוב…"
          aria-label="חיפוש סופרמרקט"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pe-11 ps-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearch("")}
            aria-label="ניקוי חיפוש"
            className="absolute inset-y-0 left-2.5 my-auto grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-slate-300"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Quick Toggles */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Toggle
          active={openNow}
          onClick={() => onOpenNow(!openNow)}
          label="כנראה פתוח עכשיו"
          icon={<ClockIcon className="h-3.5 w-3.5" />}
        />
        <Toggle
          active={lowCongestion}
          onClick={() => onLowCongestion(!lowCongestion)}
          label="ללא תור (פנוי)"
          icon={<UsersIcon className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Chains Strip with Brand Dots */}
      <div className="mt-3 flex items-center gap-1.5 text-[0.72rem] font-bold text-slate-500">
        <SlidersIcon className="h-3.5 w-3.5 text-sky-600" />
        רשתות קניות
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
          const meta = getChainMeta(c);
          return (
            <Chip
              key={c}
              label={meta.shortName}
              count={count}
              active={chain === c}
              dotColor={meta.accent}
              onClick={() => onChain(c)}
            />
          );
        })}
      </div>

      {/* Sort Buttons Segmented Control */}
      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
        <span className="text-[0.7rem] font-bold text-slate-400 shrink-0">מיון:</span>
        <div className="flex flex-1 gap-1 rounded-xl bg-slate-100 p-1">
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
            label="לפי יישוב"
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
  dotColor,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  dotColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition active:scale-95 ${
        active
          ? "bg-slate-900 text-white shadow-xs"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
      }`}
    >
      {dotColor && (
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 text-[0.66rem] font-bold tabular-nums ${
          active ? "bg-white/20 text-white" : "bg-white text-slate-500 shadow-2xs"
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
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition active:scale-95 ${
        active
          ? "bg-sky-500 text-white shadow-xs"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
      }`}
    >
      <span className="grid h-4 w-4 place-items-center">
        {active ? <CheckIcon className="h-3.5 w-3.5" /> : icon}
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
      className={`inline-flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[0.74rem] font-bold transition ${
        active
          ? "bg-white text-slate-900 shadow-xs font-black"
          : "text-slate-500 hover:text-slate-900"
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
