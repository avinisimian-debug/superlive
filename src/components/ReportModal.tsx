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
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    tint: "border-emerald-500/50 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/30",
  },
  {
    value: "medium",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    tint: "border-amber-500/50 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/30",
  },
  {
    value: "heavy",
    dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
    tint: "border-rose-500/50 bg-rose-950/40 text-rose-300 ring-1 ring-rose-500/30",
  },
];

const PARKING_OPTIONS: {
  value: Parking;
  dot: string;
  tint: string;
}[] = [
  {
    value: "plenty",
    dot: "bg-emerald-400",
    tint: "border-emerald-500/50 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/30",
  },
  {
    value: "partial",
    dot: "bg-amber-400",
    tint: "border-amber-500/50 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/30",
  },
  {
    value: "none",
    dot: "bg-rose-400",
    tint: "border-rose-500/50 bg-rose-950/40 text-rose-300 ring-1 ring-rose-500/30",
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`דיווח עומס עבור ${branch.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl border-t border-slate-800 bg-slate-950 text-white pb-[calc(env(safe-area-inset-bottom,0px)+1.2rem)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-800" />

        <div className="flex items-start justify-between gap-3 px-5 pt-3 border-b border-slate-800/80 pb-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-cyan-400">
              <SparkIcon className="h-3.5 w-3.5" />
              דיווח עומס בזמן אמת
            </p>
            <h2 className="mt-1 truncate text-lg font-black tracking-tight text-white">
              {branch.name}
            </h2>
            <p className="truncate text-xs text-slate-400">
              {branch.address} · {branch.city}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-3 space-y-4 no-scrollbar">
          <fieldset>
            <legend className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <UsersIcon className="h-4 w-4 text-cyan-400" />
              מצב התורים בקופות כרגע:
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
                    className={`flex min-h-[3.8rem] items-center gap-3 rounded-xl border px-4 text-start transition active:scale-[0.98] ${
                      selected
                        ? option.tint
                        : "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
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
                        selected ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-transparent"
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
            <legend className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <CarIcon className="h-4 w-4 text-cyan-400" />
              זמינות מקומות חניה:
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
                    className={`flex min-h-[4rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 text-center text-xs font-bold transition active:scale-[0.97] ${
                      selected
                        ? option.tint
                        : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
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
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 active:scale-[0.98]"
          >
            <CheckIcon className="h-5 w-5" />
            שלח דיווח לקהילה
          </button>
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-[0.68rem] text-slate-400">
            <SparkIcon className="h-3.5 w-3.5 text-cyan-400" />
            הדיווח מתעדכן מיידית בפיד לכל משתמשי זרם
          </p>
        </div>
      </div>
    </div>
  );
}
