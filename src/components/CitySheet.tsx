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
  const list = cities || options || [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [list, query]);

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="בחירת עיר"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] bg-white text-slate-900 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="flex items-center justify-between border-b border-slate-100 px-5 pb-3 pt-2">
          <div>
            <h2 className="text-base font-black text-slate-900">בחירת יישוב</h2>
            <p className="text-xs text-slate-500">סינון סופרמרקטים ומכולות לפי עיר</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
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
              placeholder="חיפוש יישוב או עיר…"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-100 pe-10 ps-10 text-xs font-bold text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 left-2.5 my-auto grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
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
            className={`flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-xs font-bold transition ${
              selected === "all"
                ? "border-sky-300 bg-sky-50 text-sky-900"
                : "border-slate-100 bg-slate-50/70 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <BuildingIcon className="h-4 w-4" />
              </div>
              <span className="font-extrabold">כל הארץ (פריסה ארצית מלאה)</span>
            </div>
            {selected === "all" ? <CheckIcon className="h-4 w-4 text-sky-600" /> : null}
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
                className={`flex w-full items-center justify-between rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition ${
                  isSelected
                    ? "border-sky-300 bg-sky-50 text-sky-900"
                    : "border-slate-100 bg-slate-50/70 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-slate-400" />
                  <span>{city.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[0.66rem] font-bold tabular-nums text-slate-500 shadow-2xs">
                    {city.count} סניפים
                  </span>
                  {isSelected ? <CheckIcon className="h-4 w-4 text-sky-600" /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
