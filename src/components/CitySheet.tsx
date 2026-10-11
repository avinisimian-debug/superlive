"use client";

import { useEffect, useMemo, useState } from "react";
import { CloseIcon, SearchIcon, BuildingIcon } from "./icons";

export interface CityOption {
  name: string;
  count: number;
}

const HEBREW = /[\u0590-\u05FF]/;

export function CitySheet({
  options,
  selected,
  onSelect,
  onClose,
}: {
  options: CityOption[];
  selected: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

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

  const total = useMemo(
    () => options.reduce((sum, o) => sum + o.count, 0),
    [options],
  );

  const popular = useMemo(
    () =>
      [...options]
        .filter((o) => HEBREW.test(o.name) && o.name.length > 1)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    [options],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="בחירת עיר"
      onClick={onClose}
    >
      <div
        className="animate-rise flex max-h-[88vh] w-full max-w-[27rem] flex-col rounded-t-[28px] bg-white pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] shadow-float"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="flex items-center justify-between gap-3 px-5 pt-3">
          <div>
            <p className="flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-[0.22em] text-brand-600">
              <BuildingIcon className="h-3.5 w-3.5" />
              בחירת מיקום
            </p>
            <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-slate-900">
              באיזו עיר תרצו לחפש?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-5 w-5 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="חיפוש עיר…"
              aria-label="חיפוש עיר"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pe-11 ps-11 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/12"
            />
          </div>
        </div>

        <ul className="mt-3 flex-1 overflow-y-auto px-3 pb-2">
          <li>
            <button
              type="button"
              onClick={() => onSelect("all")}
              aria-pressed={selected === "all"}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-start text-[0.9rem] font-extrabold transition ${
                selected === "all"
                  ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-500/20"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              כל הערים
              <CountBadge value={total} active={selected === "all"} />
            </button>
          </li>
        </ul>

        {!query && popular.length > 0 ? (
          <div className="px-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">
              ערים מבוקשות
            </p>
            <div className="edge-fade -mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
              {popular.map((option) => {
                const active = selected === option.name;
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => onSelect(option.name)}
                    className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[0.8rem] font-bold ring-1 ring-inset transition active:scale-[0.97] ${
                      active
                        ? "bg-slate-900 text-white ring-slate-900"
                        : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {option.name}
                    <span
                      className={`rounded-full px-1.5 text-[0.66rem] tabular-nums ${
                        active ? "bg-white/20" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <ul className="mt-2 flex-1 overflow-y-auto px-3 pb-2">
          {filtered.map((option) => {
            const active = selected === option.name;
            return (
              <li key={option.name}>
                <button
                  type="button"
                  onClick={() => onSelect(option.name)}
                  aria-pressed={active}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-start text-[0.9rem] font-bold transition ${
                    active
                      ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-500/20"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {option.name}
                  <CountBadge value={option.count} active={active} />
                </button>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="px-3 py-8 text-center text-[0.82rem] text-slate-400">
              לא נמצאו ערים מתאימות
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function CountBadge({ value, active }: { value: number; active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold tabular-nums ${
        active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
      }`}
    >
      {value}
    </span>
  );
}
