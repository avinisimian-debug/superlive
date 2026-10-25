"use client";

import { useState } from "react";
import type { Branch, Congestion, LiveState, Parking } from "@/lib/types";
import { CONGESTION_HINT, CONGESTION_LABEL, PARKING_SHORT } from "@/lib/live";
import { CloseIcon, SparkIcon, UsersIcon, CarIcon, CheckIcon } from "./icons";
import { CrowdMeter, Sheet, TONE } from "./ui";

const CONGESTIONS: Congestion[] = ["free", "medium", "heavy"];

const PARKING_OPTIONS: { value: Parking; tone: Congestion }[] = [
  { value: "plenty", tone: "free" },
  { value: "partial", tone: "medium" },
  { value: "none", tone: "heavy" },
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
  onSubmit: (congestion: Congestion, parking: Parking, origin: { x: number; y: number }) => void;
}) {
  const [congestion, setCongestion] = useState<Congestion>(initial.congestion);
  const [parking, setParking] = useState<Parking>(initial.parking);

  return (
    <Sheet onClose={onClose} label={`דיווח עומס עבור ${branch.name}`}>
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[0.7rem] font-bold text-brand-700">
            <SparkIcon className="h-3.5 w-3.5" />
            דיווח מהשטח · 20 נקודות
          </p>
          <h2 className="mt-1 truncate text-xl font-black tracking-tight text-ink-900">{branch.name}</h2>
          <p className="truncate text-[0.74rem] text-slate-500">
            {branch.address ? `${branch.address} · ` : ""}
            {branch.city}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          className="press grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[60dvh] space-y-5 overflow-y-auto px-5 pb-2 no-scrollbar">
        <fieldset>
          <legend className="flex items-center gap-1.5 text-[0.8rem] font-extrabold text-ink-900">
            <UsersIcon className="h-4 w-4 text-brand-600" />
            כמה עמוס בקופות?
          </legend>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {CONGESTIONS.map((value) => {
              const selected = congestion === value;
              const tone = TONE[value];
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCongestion(value)}
                  className={`press relative flex flex-col items-center gap-2 rounded-2xl px-2 pb-3 pt-4 text-center ring-2 ${
                    selected ? `${tone.soft} shadow-card` : "bg-white ring-slate-200/80 hover:bg-slate-50"
                  }`}
                  style={selected ? { ["--tw-ring-color" as string]: tone.color } : undefined}
                >
                  <CrowdMeter key={`${value}-${selected}`} congestion={value} live={selected} size="lg" />
                  <span className={`text-[0.92rem] font-black ${selected ? tone.text : "text-ink-800"}`}>
                    {CONGESTION_LABEL[value]}
                  </span>
                  <span className="text-[0.64rem] font-semibold text-slate-500">{CONGESTION_HINT[value]}</span>
                  {selected ? (
                    <span
                      className="absolute left-2 top-2 grid h-5 w-5 animate-pop place-items-center rounded-full text-white"
                      style={{ background: tone.color }}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="flex items-center gap-1.5 text-[0.8rem] font-extrabold text-ink-900">
            <CarIcon className="h-4 w-4 text-brand-600" />
            ומה עם חניה?
          </legend>
          <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
            {PARKING_OPTIONS.map((option) => {
              const selected = parking === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setParking(option.value)}
                  className={`press flex h-11 items-center justify-center gap-1.5 rounded-xl text-[0.8rem] font-bold ${
                    selected ? "bg-white text-ink-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: TONE[option.tone].color }} />
                  {PARKING_SHORT[option.value]}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4">
        <button
          type="button"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            onSubmit(congestion, parking, { x: rect.left + rect.width / 2, y: rect.top });
          }}
          className="press sheen bg-brand-gradient flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-[0.95rem] font-black text-white shadow-glow"
        >
          <CheckIcon className="h-5 w-5" />
          שליחת הדיווח
        </button>
        <p className="mt-2 text-center text-[0.68rem] text-slate-400">
          הדיווח מופיע מיד לכל מי שבודק את הסניף
        </p>
      </div>
    </Sheet>
  );
}
