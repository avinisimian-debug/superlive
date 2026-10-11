"use client";

import { useEffect, useState } from "react";
import type { Branch, Congestion, LiveState, Parking } from "@/lib/types";
import { CONGESTION_HINT, CONGESTION_LABEL, PARKING_SHORT } from "@/lib/live";
import { CloseIcon, SparkIcon, UsersIcon, CarIcon, CheckIcon } from "./icons";

const CONGESTION_OPTIONS: {
  value: Congestion;
  dot: string;
  tint: string;
}[] = [
  { value: "free", dot: "bg-emerald-500", tint: "from-emerald-50 ring-emerald-500/25 text-emerald-700" },
  { value: "medium", dot: "bg-amber-500", tint: "from-amber-50 ring-amber-500/25 text-amber-700" },
  { value: "heavy", dot: "bg-red-500", tint: "from-red-50 ring-red-500/25 text-red-700" },
];

const PARKING_OPTIONS: {
  value: Parking;
  dot: string;
  tint: string;
}[] = [
  { value: "plenty", dot: "bg-emerald-500", tint: "from-emerald-50 ring-emerald-500/25 text-emerald-700" },
  { value: "partial", dot: "bg-amber-500", tint: "from-amber-50 ring-amber-500/25 text-amber-700" },
  { value: "none", dot: "bg-red-500", tint: "from-red-50 ring-red-500/25 text-red-700" },
];

export function ReportModal({
  branch,
  initial,
  onClose,
  onSubmit,
}: {
  branch: Branch;
  initial: LiveState;
  onClose: () => void;
  onSubmit: (congestion: Congestion, parking: Parking) => void;
}) {
  const [congestion, setCongestion] = useState<Congestion>(initial.congestion);
  const [parking, setParking] = useState<Parking>(initial.parking);

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
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`דיווח עומס עבור ${branch.name}`}
      onClick={onClose}
    >
      <div
        className="animate-rise w-full max-w-[27rem] rounded-t-[28px] bg-white pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-float"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="flex items-start justify-between gap-3 px-5 pt-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-brand-600">
              <SparkIcon className="h-3.5 w-3.5" />
              דיווח מהיר
            </p>
            <h2 className="mt-1 truncate text-lg font-extrabold tracking-tight text-slate-900">
              {branch.name}
            </h2>
            <p className="truncate text-[0.75rem] text-slate-500">
              {branch.address} · {branch.city}
            </p>
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

        <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
          <fieldset>
            <legend className="flex items-center gap-1.5 text-[0.82rem] font-bold text-slate-700">
              <UsersIcon className="h-4 w-4 text-brand-600" />
              כמה עמוס בקופות?
            </legend>
            <div className="mt-2 grid gap-2">
              {CONGESTION_OPTIONS.map((option) => {
                const selected = congestion === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCongestion(option.value)}
                    className={`flex min-h-[3.9rem] items-center gap-3 rounded-2xl bg-gradient-to-b px-4 text-start ring-1 ring-inset transition active:scale-[0.98] ${
                      selected
                        ? option.tint
                        : "from-white to-white text-slate-700 ring-slate-200"
                    }`}
                  >
                    <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${option.dot}`} />
                    <span className="flex flex-1 flex-col">
                      <span className="text-[0.95rem] font-extrabold">
                        {CONGESTION_LABEL[option.value]}
                      </span>
                      <span className="text-[0.68rem] font-medium opacity-70">
                        המתנה משוערת {CONGESTION_HINT[option.value]}
                      </span>
                    </span>
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full transition ${
                        selected ? "bg-current" : "bg-slate-100"
                      }`}
                    >
                      {selected ? (
                        <CheckIcon className="h-4 w-4 text-white" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="flex items-center gap-1.5 text-[0.82rem] font-bold text-slate-700">
              <CarIcon className="h-4 w-4 text-brand-600" />
              מה מצב החניה?
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PARKING_OPTIONS.map((option) => {
                const selected = parking === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setParking(option.value)}
                    className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-b px-1 text-center text-[0.82rem] font-bold ring-1 ring-inset transition active:scale-[0.97] ${
                      selected
                        ? option.tint
                        : "from-white to-white text-slate-600 ring-slate-200"
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full ${option.dot}`} />
                    {PARKING_SHORT[option.value]}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="px-5 pt-1">
          <button
            type="button"
            onClick={() => onSubmit(congestion, parking)}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 text-base font-extrabold text-white shadow-lg shadow-brand-600/30 transition active:scale-[0.98]"
          >
            <CheckIcon className="h-5 w-5" />
            שלח דיווח ועזור לקהילה
          </button>
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-[0.68rem] text-slate-400">
            <SparkIcon className="h-3.5 w-3.5 text-amber-400" />
            הדיווח מתעדכן אצל כולם בשניות הקרובות
          </p>
        </div>
      </div>
    </div>
  );
}
