"use client";

import type { Congestion } from "@/lib/types";
import { CartIcon } from "./icons";

export interface StatsCounts {
  free: number;
  medium: number;
  heavy: number;
}

const ITEMS: { key: Congestion; label: string; dot: string; textColor: string; bg: string }[] = [
  { key: "free", label: "פנויים", dot: "bg-emerald-500", textColor: "text-emerald-700", bg: "bg-emerald-50" },
  { key: "medium", label: "עומס בינוני", dot: "bg-amber-500", textColor: "text-amber-800", bg: "bg-amber-50" },
  { key: "heavy", label: "עמוסים", dot: "bg-rose-500", textColor: "text-rose-700", bg: "bg-rose-50" },
];

export function StatsSummary({
  counts,
  total,
}: {
  counts: StatsCounts;
  total: number;
}) {
  return (
    <section
      aria-label="סיכום עומסים"
      className="mx-4 mt-3 rounded-3xl border border-slate-200/80 bg-white p-3.5 shadow-card"
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <CartIcon className="h-4 w-4 text-sky-600" />
          עומס בקופות: דיווחים והערכות
        </p>
        <span className="text-xs font-bold text-slate-500 tabular-nums">
          {total.toLocaleString("he-IL")} סניפים
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className={`flex flex-col items-center rounded-2xl p-2.5 ${item.bg}`}
          >
            <span className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
              <span className={`text-base font-black tabular-nums ${item.textColor}`}>
                {counts[item.key].toLocaleString("he-IL")}
              </span>
            </span>
            <span className="mt-0.5 text-center text-[0.66rem] font-bold text-slate-600">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
