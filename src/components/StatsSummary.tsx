"use client";

import type { Congestion } from "@/lib/types";
import { CartIcon } from "./icons";

export interface StatsCounts {
  free: number;
  medium: number;
  heavy: number;
}

const ITEMS: { key: Congestion; label: string; dot: string; textColor: string }[] = [
  { key: "free", label: "פנויים כעת", dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]", textColor: "text-emerald-400" },
  { key: "medium", label: "עומס בינוני", dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]", textColor: "text-amber-400" },
  { key: "heavy", label: "עמוסים בקופות", dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]", textColor: "text-rose-400" },
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
      className="mx-4 mt-3 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-3 shadow-lg"
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="flex items-center gap-1.5 text-[0.72rem] font-bold text-slate-400">
          <CartIcon className="h-3.5 w-3.5 text-cyan-400" />
          טלמטריה ארצית בלייב
        </p>
        <span className="text-[0.68rem] font-bold text-cyan-300 tabular-nums">
          {total.toLocaleString("he-IL")} סניפים
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-850 px-2 py-2"
          >
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${item.dot}`} />
              <span className={`text-base font-black tabular-nums ${item.textColor}`}>
                {counts[item.key].toLocaleString("he-IL")}
              </span>
            </span>
            <span className="mt-0.5 text-center text-[0.66rem] font-bold leading-tight text-slate-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
