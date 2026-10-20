"use client";

import { useEffect, useRef, useState } from "react";
import type { Branch, LiveState } from "@/lib/types";
import type { BranchRouteInfo } from "@/lib/routing";
import { SupermarketCard } from "./SupermarketCard";
import { SearchIcon } from "./icons";

export interface ListItem {
  branch: Branch;
  live: LiveState;
  distance: number;
  routeInfo?: BranchRouteInfo;
}

const PAGE_SIZE = 20;

export function SupermarketList({
  items,
  now,
  onReport,
  onOpen,
}: {
  items: ListItem[];
  now: number;
  onReport: (branch: Branch) => void;
  onOpen: (branch: Branch) => void;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLLIElement | null>(null);
  const armedRef = useRef(false);

  useEffect(() => {
    const arm = () => {
      armedRef.current = true;
    };
    window.addEventListener("scroll", arm, { passive: true });
    return () => window.removeEventListener("scroll", arm);
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!armedRef.current) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;
        armedRef.current = false;
        setVisible((current) =>
          current >= items.length
            ? current
            : Math.min(current + PAGE_SIZE, items.length),
        );
      },
      { rootMargin: "0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length, visible]);

  if (items.length === 0) {
    return (
      <div className="mx-4 mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-600">
          <SearchIcon className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-800">
          לא נמצאו סניפים מתאימים
        </p>
        <p className="mt-1 text-xs text-slate-500">
          נסו לשנות את מונח החיפוש, הרשת או לבחור עיר אחרת.
        </p>
      </div>
    );
  }

  const shown = items.slice(0, visible);
  const done = visible >= items.length;

  return (
    <>
      <ul className="mt-3 space-y-3 px-4">
        {shown.map((item) => (
          <li key={item.branch.id}>
            <SupermarketCard
              branch={item.branch}
              live={item.live}
              distance={item.distance}
              routeInfo={item.routeInfo}
              now={now}
              onReport={onReport}
              onOpen={onOpen}
            />
          </li>
        ))}
        {!done ? <li ref={sentinelRef} aria-hidden="true" className="h-px" /> : null}
      </ul>

      {!done ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-sky-600">
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500"
            aria-hidden="true"
          />
          טוען סניפים נוספים…
        </div>
      ) : (
        <div
          className="mt-6 flex items-center gap-3 px-6"
          data-testid="end-of-list"
        >
          <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          <span className="text-center text-[0.72rem] font-bold text-slate-400">
            הוצגו כל {items.length.toLocaleString("he-IL")}{" "}
            {items.length === 1 ? "הסניף" : "הסניפים"}
          </span>
          <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        </div>
      )}
    </>
  );
}
