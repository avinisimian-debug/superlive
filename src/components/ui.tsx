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

const CONFETTI_COLORS = ["#00c2ff", "#0057d9", "#12b76a", "#f79009", "#7c5cff", "#ffffff"];

/** Confetti burst plus a floating "+N" from a screen point. Pure DOM, cleans itself up. */
export function celebrate(x: number, y: number, points?: number) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const nodes: HTMLElement[] = [];
  for (let i = 0; i < 36; i++) {
    const el = document.createElement("i");
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 140;
    el.className = "confetti";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${5 + Math.random() * 5}px`;
    el.style.height = `${8 + Math.random() * 8}px`;
    el.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    el.style.setProperty("--x", `${Math.cos(angle) * dist}px`);
    el.style.setProperty("--y", `${Math.sin(angle) * dist - 60 + Math.random() * 120}px`);
    el.style.setProperty("--r", `${(Math.random() - 0.5) * 900}deg`);
    el.style.setProperty("--d", `${0.9 + Math.random() * 0.6}s`);
    document.body.appendChild(el);
    nodes.push(el);
  }
  if (points) {
    const tag = document.createElement("div");
    tag.className = "points-float";
    tag.dir = "ltr";
    tag.textContent = `+${points}`;
    tag.style.left = `${x}px`;
    tag.style.top = `${y - 30}px`;
    document.body.appendChild(tag);
    nodes.push(tag);
  }
  window.setTimeout(() => nodes.forEach((n) => n.remove()), 1700);
}

/** Small particle ring shown when a star is switched on. */
export function StarBurst() {
  return (
    <span className="burst" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <i
          key={i}
          style={{
            ["--a" as string]: `${i * 45}deg`,
            background: i % 2 ? "#fbbf24" : "#f79009",
          }}
        />
      ))}
    </span>
  );
}

/**
 * App-wide effects: an ink ripple on every `.press` surface and a `--sy`
 * scroll variable for parallax. Mount once.
 */
export function Effects() {
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const onDown = (event: PointerEvent) => {
      if (reduce) return;
      const host = (event.target as HTMLElement | null)?.closest<HTMLElement>(".press");
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      const ink = document.createElement("span");
      ink.className = "ripple-ink";
      ink.style.width = ink.style.height = `${size}px`;
      ink.style.left = `${event.clientX - rect.left}px`;
      ink.style.top = `${event.clientY - rect.top}px`;
      host.classList.add("ripple-host");
      host.appendChild(ink);
      window.setTimeout(() => ink.remove(), 700);
    };
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        document.documentElement.style.setProperty("--sy", String(Math.min(window.scrollY, 600))),
      );
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}

/** Pointer-driven 3D tilt and spotlight for a card. Tilt only for mouse/pen. */
export function useTilt<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const handlers = {
    onPointerMove: (event: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      el.style.setProperty("--spot", "1");
      if (event.pointerType !== "touch") {
        el.style.setProperty("--rx", `${(0.5 - py) * 5}deg`);
        el.style.setProperty("--ry", `${(px - 0.5) * 6}deg`);
      }
    },
    onPointerDown: (event: React.PointerEvent<T>) => handlers.onPointerMove(event),
    onPointerLeave: () => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--spot", "0");
    },
  };
  return { ref, handlers };
}

/** Adds `.in` to each `.reveal` child of the returned ref as it scrolls into view. */
export function useReveal<T extends HTMLElement>(deps: unknown[]) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    root.querySelectorAll(".reveal:not(.in)").forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}
