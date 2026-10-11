"use client";

import type { Congestion } from "@/lib/types";
import { CartIcon } from "./icons";

export interface StatsCounts {
  free: number;
  medium: number;
  heavy: number;
}

const ITEMS: { key: Congestion; label: string; dot: string }[] = [
  { key: "free", label: "פנויים", dot: "bg-emerald-500" },
  { key: "medium", label: "עומס בינוני", dot: "bg-amber-500" },
  { key: "heavy", label: "עמוסים", dot: "bg-red-500" },
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
      aria-label="סיכום מצב בזמן אמת"
      className="mx-4 mt-4 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-card"
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-slate-500">
          <CartIcon className="h-3.5 w-3.5 text-slate-400" />
          מצב בזמן אמת
        </p>
        <span className="text-[0.68rem] font-medium text-slate-400 tabular-nums">
          {total} סניפים
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center rounded-xl bg-slate-50 px-2 py-2.5"
          >
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${item.dot}`} />
              <span className="text-lg font-bold tabular-nums text-slate-900">
                {counts[item.key]}
              </span>
            </span>
            <span className="mt-0.5 text-center text-[0.64rem] font-medium leading-tight text-slate-500">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
