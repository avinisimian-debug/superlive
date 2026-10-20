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
  {
    value: "free",
    dot: "bg-emerald-500",
    tint: "border-emerald-200 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-300",
  },
  {
    value: "medium",
    dot: "bg-amber-500",
    tint: "border-amber-200 bg-amber-50/70 text-amber-900 ring-1 ring-amber-300",
  },
  {
    value: "heavy",
    dot: "bg-rose-500",
    tint: "border-rose-200 bg-rose-50/70 text-rose-900 ring-1 ring-rose-300",
  },
];

const PARKING_OPTIONS: {
  value: Parking;
  dot: string;
  tint: string;
}[] = [
  {
    value: "plenty",
    dot: "bg-emerald-500",
    tint: "border-emerald-200 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300",
  },
  {
    value: "partial",
    dot: "bg-amber-500",
    tint: "border-amber-200 bg-amber-50 text-amber-900 ring-1 ring-amber-300",
  },
  {
    value: "none",
    dot: "bg-rose-500",
    tint: "border-rose-200 bg-rose-50 text-rose-900 ring-1 ring-rose-300",
  },
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`דיווח עומס עבור ${branch.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-[32px] bg-white text-slate-900 pb-[calc(env(safe-area-inset-bottom,0px)+1.2rem)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="flex items-start justify-between gap-3 px-5 pt-3 border-b border-slate-100 pb-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-sky-600">
              <SparkIcon className="h-3.5 w-3.5" />
              דיווח קהילתי בלייב
            </p>
            <h2 className="mt-1 truncate text-lg font-black tracking-tight text-slate-900">
              {branch.name}
            </h2>
            <p className="truncate text-xs text-slate-500">
              {branch.address} · {branch.city}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-3 space-y-4 no-scrollbar">
          <fieldset>
            <legend className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <UsersIcon className="h-4 w-4 text-sky-600" />
              כמה עמוס בקופות כרגע?
            </legend>
            <div className="mt-2.5 grid gap-2">
              {CONGESTION_OPTIONS.map((option) => {
                const selected = congestion === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCongestion(option.value)}
                    className={`flex min-h-[3.8rem] items-center gap-3 rounded-2xl border px-4 text-start transition active:scale-98 ${
                      selected
                        ? option.tint
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${option.dot}`} />
                    <span className="flex flex-1 flex-col">
                      <span className="text-[0.95rem] font-black">
                        {CONGESTION_LABEL[option.value]}
                      </span>
                      <span className="text-xs opacity-75">
                        המתנה משוערת: {CONGESTION_HINT[option.value]}
                      </span>
                    </span>
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full transition ${
                        selected ? "bg-sky-500 text-white" : "bg-slate-100 text-transparent"
                      }`}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <CarIcon className="h-4 w-4 text-sky-600" />
              מה מצב החניה בסניף?
            </legend>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {PARKING_OPTIONS.map((option) => {
                const selected = parking === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setParking(option.value)}
                    className={`flex min-h-[4rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 text-center text-xs font-bold transition active:scale-97 ${
                      selected
                        ? option.tint
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${option.dot}`} />
                    {PARKING_SHORT[option.value]}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="px-5 pt-2">
          <button
            type="button"
            onClick={() => onSubmit(congestion, parking)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 text-sm font-black text-white shadow-xs transition hover:bg-sky-600 active:scale-98"
          >
            <CheckIcon className="h-5 w-5" />
            שליחת דיווח
          </button>
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-[0.68rem] text-slate-400">
            <SparkIcon className="h-3.5 w-3.5 text-sky-500" />
            הדיווח מתעדכן מיידית ב-Zerem לטובת כל הנהגים והקונים
          </p>
        </div>
      </div>
    </div>
  );
}
