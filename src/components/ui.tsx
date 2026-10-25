"use client";

import { useEffect, useRef, useState } from "react";
import type { Congestion } from "@/lib/types";

/** One palette for crowd levels, shared by every screen. */
export const TONE: Record<
  Congestion,
  { color: string; soft: string; text: string; ring: string; label: string; wait: string }
> = {
  free: {
    color: "#12b76a",
    soft: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    label: "פנוי",
    wait: "בלי תור בקופות",
  },
  medium: {
    color: "#f79009",
    soft: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    label: "עומס סביר",
    wait: "תור קצר, 3–5 דק׳",
  },
  heavy: {
    color: "#f04438",
    soft: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
    label: "עמוס",
    wait: "תורים ארוכים, 15+ דק׳",
  },
};

const LEVEL: Record<Congestion, number> = { free: 1, medium: 2, heavy: 3 };

/**
 * The logo's three bars as a gauge: one bar lit for quiet, three for packed.
 * A live (reported) level breathes; an estimate stays still.
 */
export function CrowdMeter({
  congestion,
  live = false,
  size = "md",
  onDark = false,
}: {
  congestion: Congestion;
  live?: boolean;
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
}) {
  const lit = LEVEL[congestion];
  const color = TONE[congestion].color;
  const h = size === "lg" ? "h-7" : size === "sm" ? "h-3.5" : "h-5";
  const w = size === "lg" ? 7 : size === "sm" ? 4 : 5;
  return (
    <span className={`meter ${h}`} data-live={live} aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <i
          key={n}
          className={n <= lit ? "on" : ""}
          style={{
            width: w,
            background: n <= lit ? color : onDark ? "rgba(255,255,255,0.16)" : undefined,
          }}
        />
      ))}
    </span>
  );
}

/** Counts up to `value` once on mount, and eases to any later value. */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      const next = Math.round(origin + (value - origin) * eased);
      setShown(next);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="tabular">{shown.toLocaleString("he-IL")}</span>;
}

/** Locks page scroll and closes on Escape while a sheet is open. */
export function useSheet(onClose: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);
}

/** Bottom sheet frame: dimmed backdrop, spring slide-up, grab handle. */
export function Sheet({
  onClose,
  label,
  labelledBy,
  children,
  className = "",
}: {
  onClose: () => void;
  label?: string;
  labelledBy?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useSheet(onClose);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-labelledby={labelledBy}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="סגירה"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-fade bg-ink-950/55 backdrop-blur-[3px]"
      />
      <div
        className={`relative flex w-full max-w-[30rem] flex-col overflow-hidden rounded-t-[2rem] bg-white text-ink-900 shadow-float animate-sheet sm:rounded-[2rem] sm:animate-pop ${className}`}
      >
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2.5 sm:hidden">
          <span className="h-1.5 w-11 rounded-full bg-slate-300/80" />
        </div>
        {children}
      </div>
    </div>
  );
}

/** Section title used across the feed and the personal area. */
export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-1">
      <h2 className="text-[0.95rem] font-extrabold tracking-tight text-ink-900">{children}</h2>
      {action}
    </div>
  );
}
