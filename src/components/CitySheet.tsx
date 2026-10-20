"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchIcon, CloseIcon, BuildingIcon, CheckIcon, MapPinIcon } from "./icons";

export interface CityOption {
  name: string;
  count: number;
}

export function CitySheet({
  cities,
  options,
  selected,
  onSelect,
  onClose,
}: {
  cities?: CityOption[];
  options?: CityOption[];
  selected: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const list = cities || options || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="בחירת עיר"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-t border-slate-800 bg-slate-950 text-white pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-800" />

        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 pb-3 pt-2">
          <div>
            <h2 className="text-base font-black text-white">בחירת עיר</h2>
            <p className="text-xs text-slate-400">סינון סופרמרקטים לפי מיקום בארץ</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש עיר או יישוב…"
              className="h-10 w-full rounded-xl border border-slate-700/80 bg-slate-900 pe-10 ps-10 text-xs font-semibold text-white outline-none focus:border-cyan-500/70"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 left-2 my-auto grid h-6 w-6 place-items-center text-slate-400 hover:text-white"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5 no-scrollbar">
          {/* Option: All Israel */}
          <button
            type="button"
            onClick={() => {
              onSelect("all");
              onClose();
            }}
            className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${
              selected === "all"
                ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300"
                : "border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <BuildingIcon className="h-4 w-4 text-cyan-400" />
              <span>כל הארץ (פריסה ארצית)</span>
            </div>
            {selected === "all" ? <CheckIcon className="h-4 w-4 text-cyan-400" /> : null}
          </button>

          {filtered.map((city) => {
            const isSelected = selected === city.name;
            return (
              <button
                key={city.name}
                type="button"
                onClick={() => {
                  onSelect(city.name);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${
                  isSelected
                    ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300"
                    : "border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-slate-500" />
                  <span>{city.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.66rem] font-bold tabular-nums text-slate-400">
                    {city.count} סניפים
                  </span>
                  {isSelected ? <CheckIcon className="h-4 w-4 text-cyan-400" /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
