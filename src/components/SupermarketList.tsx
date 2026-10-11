"use client";

import { useEffect, useRef, useState } from "react";
import type { Branch, LiveState } from "@/lib/types";
import { SupermarketCard } from "./SupermarketCard";
import { SearchIcon } from "./icons";

export interface ListItem {
  branch: Branch;
  live: LiveState;
  distance: number;
}

const PAGE_SIZE = 24;

export function SupermarketList({
  items,
  now,
  onReport,
}: {
  items: ListItem[];
  now: number;
  onReport: (branch: Branch) => void;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((current) =>
            current >= items.length ? current : current + PAGE_SIZE,
          );
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="mx-4 mt-6 rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          <SearchIcon className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-700">
          לא נמצאו סניפים מתאימים
        </p>
        <p className="mt-1 text-[0.78rem] text-slate-500">
          נסו לשנות את החיפוש, הרשת, העיר או הסינון.
        </p>
      </div>
    );
  }

  const shown = items.slice(0, visible);

  return (
    <>
      <ul className="mt-3 space-y-3 px-4">
        {shown.map((item) => (
          <li key={item.branch.id}>
            <SupermarketCard
              branch={item.branch}
              live={item.live}
              distance={item.distance}
              now={now}
              onReport={onReport}
            />
          </li>
        ))}
        {visible < items.length ? (
          <li ref={sentinelRef} aria-hidden="true" className="h-1" />
        ) : null}
      </ul>
      {visible < items.length ? (
        <p className="mt-3 text-center text-[0.72rem] font-semibold text-slate-400">
          טוען עוד סניפים…
        </p>
      ) : (
        <p className="mt-4 text-center text-[0.72rem] font-semibold text-slate-400">
          מציגים את כל {items.length} הסניפים
        </p>
      )}
    </>
  );
}
