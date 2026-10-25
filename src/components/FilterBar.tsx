"use client";

import { useEffect, useState } from "react";
import { CHAINS, type Chain } from "@/lib/types";
import { getChainMeta } from "@/lib/chains";
import {
  SearchIcon,
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

const SORTS: { value: SortMode; label: string; icon: React.ReactNode }[] = [
  { value: "nearest", label: "קרוב", icon: <NavigationIcon className="h-3.5 w-3.5" /> },
  { value: "emptiest", label: "פנוי", icon: <SparkIcon className="h-3.5 w-3.5" /> },
  { value: "byCity", label: "יישוב", icon: <BuildingIcon className="h-3.5 w-3.5" /> },
];

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
  // The bar gains a hairline and shadow once it is stuck to the top.
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 260);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sortIndex = SORTS.findIndex((s) => s.value === sort);

  return (
    <div
      className={`sticky top-0 z-30 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] transition-shadow duration-300 ${
        stuck ? "glass-light shadow-[0_8px_24px_-16px_rgba(10,21,48,0.35)]" : "bg-canvas"
      }`}
    >
      {/* Search */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute inset-y-0 right-4 my-auto h-5 w-5 text-slate-400" />
        <input
          type="search"
          inputMode="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="סופר, רשת, עיר או רחוב"
          aria-label="חיפוש סופרמרקט"
          className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white pe-11 ps-12 text-[0.9rem] font-semibold text-ink-900 shadow-card outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearch("")}
            aria-label="ניקוי חיפוש"
            className="absolute inset-y-0 left-2.5 my-auto grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Quick filters + sort */}
      <div className="mt-2.5 flex items-center gap-2">
        <Toggle
          active={openNow}
          onClick={() => onOpenNow(!openNow)}
          label="פתוח עכשיו"
          icon={<ClockIcon className="h-3.5 w-3.5" />}
        />
        <Toggle
          active={lowCongestion}
          onClick={() => onLowCongestion(!lowCongestion)}
          label="בלי תור"
          icon={<UsersIcon className="h-3.5 w-3.5" />}
        />

        <div
          role="radiogroup"
          aria-label="מיון"
          className="relative ms-auto grid grid-cols-3 rounded-full bg-slate-200/70 p-0.5"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0.5 w-1/3 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[var(--ease-spring)]"
            style={{ right: 2, transform: `translateX(${-sortIndex * 100}%)`, width: "calc((100% - 4px) / 3)" }}
          />
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={sort === s.value}
              aria-pressed={sort === s.value}
              onClick={() => onSort(s.value)}
              className={`relative z-10 inline-flex h-8 items-center justify-center gap-1 px-2.5 text-[0.72rem] font-bold transition-colors ${
                sort === s.value ? "text-ink-900" : "text-slate-500"
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chains */}
      <div className="-mx-4 mt-2.5 flex gap-1.5 overflow-x-auto px-4 no-scrollbar">
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
      className={`press inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.74rem] font-bold ${
        active
          ? "bg-ink-900 text-white shadow-sm"
          : "bg-white text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-50"
      }`}
    >
      {dotColor && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />}
      <span>{label}</span>
      <span className={`tabular text-[0.66rem] font-bold ${active ? "text-white/60" : "text-slate-400"}`}>
        {count.toLocaleString("he-IL")}
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
      className={`press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.74rem] font-bold ${
        active
          ? "bg-brand-gradient text-white shadow-glow"
          : "bg-white text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-50"
      }`}
    >
      {active ? <CheckIcon className="h-3.5 w-3.5" /> : icon}
      {label}
    </button>
  );
}
