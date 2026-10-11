"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  BRANCHES,
  CITIES,
  CITY_TOTALS,
  NATIONWIDE_COUNT,
  SEARCH_INDEX,
} from "@/lib/branches";
import { distanceKm } from "@/lib/geo";
import { isOpenAt } from "@/lib/schedules";
import { useLive } from "@/lib/store";
import type { Branch, Congestion, LiveState, Parking } from "@/lib/types";
import { Header } from "./Header";
import { FilterBar, type ChainFilter, type SortMode } from "./FilterBar";
import { StatsSummary } from "./StatsSummary";
import { SupermarketList, type ListItem } from "./SupermarketList";
import { ReportModal } from "./ReportModal";
import { CitySheet, type CityOption } from "./CitySheet";
import { Toast } from "./Toast";
import { RadarIcon } from "./icons";

const CONGESTION_RANK: Record<Congestion, number> = { free: 0, medium: 1, heavy: 2 };
const PARKING_RANK: Record<Parking, number> = { plenty: 0, partial: 1, none: 2 };
const SORT_LABEL: Record<SortMode, string> = {
  nearest: "ממוין לפי מרחק",
  emptiest: "ממוין לפי פניות",
  byCity: "ממוין לפי עיר ורשת",
};

export function SuperLiveApp() {
  const { ready, now, location, getLive, submitReport, totalSubmissions } = useLive();

  const [city, setCity] = useState("all");
  const [chain, setChain] = useState<ChainFilter>("all");
  const [sort, setSort] = useState<SortMode>("nearest");
  const [search, setSearch] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [lowCongestion, setLowCongestion] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [reporting, setReporting] = useState<Branch | null>(null);

  const deferredSearch = useDeferredValue(search);
  const date = useMemo(() => new Date(now), [now]);

  // Live state for every branch, recomputed only when the live clock or
  // submitted reports change — never on search/filter keystrokes.
  const liveById = useMemo(() => {
    const map = new Map<string, LiveState>();
    for (const branch of BRANCHES) map.set(branch.id, getLive(branch));
    return map;
  }, [getLive]);

  // Filters that don't depend on the selected chain (used for chip counts).
  const base = useMemo(() => {
    if (!ready) return [];
    const tokens = deferredSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return BRANCHES.filter((branch, index) => {
      if (city !== "all" && branch.city !== city) return false;
      if (openNow && !isOpenAt(branch.scheduleIdx, date)) return false;
      if (lowCongestion && (liveById.get(branch.id)?.congestion ?? "heavy") !== "free") {
        return false;
      }
      if (tokens.length) {
        const hay = SEARCH_INDEX[index];
        for (const token of tokens) {
          if (!hay.includes(token)) return false;
        }
      }
      return true;
    });
  }, [ready, deferredSearch, city, openNow, lowCongestion, liveById, date]);

  const chainCounts = useMemo(() => {
    const acc: Record<string, number> = { all: base.length };
    for (const branch of base) acc[branch.chain] = (acc[branch.chain] ?? 0) + 1;
    return acc;
  }, [base]);

  const items = useMemo<ListItem[]>(() => {
    const filtered =
      chain === "all" ? base : base.filter((branch) => branch.chain === chain);

    const mapped: ListItem[] = filtered.map((branch) => ({
      branch,
      live: liveById.get(branch.id) as LiveState,
      distance: distanceKm(location.lat, location.lng, branch.lat, branch.lng),
    }));

    mapped.sort((a, b) => {
      if (sort === "nearest") return a.distance - b.distance;
      if (sort === "byCity") {
        return (
          a.branch.city.localeCompare(b.branch.city, "he") ||
          a.branch.chain.localeCompare(b.branch.chain, "he") ||
          a.branch.name.localeCompare(b.branch.name, "he") ||
          a.distance - b.distance
        );
      }
      return (
        CONGESTION_RANK[a.live.congestion] - CONGESTION_RANK[b.live.congestion] ||
        PARKING_RANK[a.live.parking] - PARKING_RANK[b.live.parking] ||
        a.distance - b.distance
      );
    });

    return mapped;
  }, [base, chain, sort, location, liveById]);

  const counts = useMemo(() => {
    const acc = { free: 0, medium: 0, heavy: 0 };
    for (const item of items) acc[item.live.congestion] += 1;
    return acc;
  }, [items]);

  const freeNow = useMemo(() => {
    let free = 0;
    for (const branch of BRANCHES) {
      if (liveById.get(branch.id)?.congestion === "free") free += 1;
    }
    return free;
  }, [liveById]);

  const cityOptions = useMemo<CityOption[]>(
    () =>
      CITIES.map((name) => ({ name, count: CITY_TOTALS[name] ?? 0 })).sort((a, b) =>
        a.name.localeCompare(b.name, "he"),
      ),
    [],
  );

  const resetKey = `${city}|${chain}|${sort}|${deferredSearch}|${openNow}|${lowCongestion}`;

  return (
    <>
      <Header
        totalBranches={NATIONWIDE_COUNT}
        cityCount={CITIES.length}
        freeNow={freeNow}
        city={city}
        onOpenCity={() => setCityOpen(true)}
      />

      <FilterBar
        search={search}
        onSearch={setSearch}
        chain={chain}
        onChain={setChain}
        chainCounts={chainCounts}
        sort={sort}
        onSort={setSort}
        openNow={openNow}
        onOpenNow={setOpenNow}
        lowCongestion={lowCongestion}
        onLowCongestion={setLowCongestion}
      />

      <main className="pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]">
        {!ready ? (
          <LoadingState />
        ) : (
          <>
            <StatsSummary counts={counts} total={items.length} />

            <div className="mt-3 flex items-center justify-between px-4">
              <p className="text-[0.72rem] font-semibold text-slate-500">
                מציגים {items.length} סניפים
                {city !== "all" ? ` ב${city}` : ""}
              </p>
              <p className="text-[0.68rem] font-semibold text-slate-400">
                {SORT_LABEL[sort]}
              </p>
            </div>

            <SupermarketList
              key={resetKey}
              items={items}
              now={now}
              onReport={setReporting}
            />
          </>
        )}

        <footer className="mt-8 px-6 text-center text-[0.68rem] leading-relaxed text-slate-400">
          <p className="flex items-center justify-center gap-1.5 font-semibold text-slate-500">
            <RadarIcon className="h-3.5 w-3.5 text-brand-600" />
            סופר-לייב · רשת דיווחים קהילתית
          </p>
          <p className="mt-1">
            {totalSubmissions > 0
              ? `פרסמתם ${totalSubmissions} דיווחים. תודה שאתם עוזרים לכולם!`
              : "כל דיווח עוזר לעוד ישראלים לתכנן את הקנייה."}
          </p>
          <p className="mt-1 text-slate-300">
            {NATIONWIDE_COUNT} סניפים ב-{CITIES.length} ערים, לפי נתוני OpenStreetMap
            ודיווחי קהילה בזמן אמת.
          </p>
        </footer>
      </main>

      {cityOpen ? (
        <CitySheet
          options={cityOptions}
          selected={city}
          onSelect={(value) => {
            setCity(value);
            setCityOpen(false);
          }}
          onClose={() => setCityOpen(false)}
        />
      ) : null}

      {reporting ? (
        <ReportModal
          branch={reporting}
          initial={getLive(reporting)}
          onClose={() => setReporting(null)}
          onSubmit={(congestion, parking) => {
            submitReport(reporting, congestion, parking);
            setReporting(null);
          }}
        />
      ) : null}

      <Toast />
    </>
  );
}

function LoadingState() {
  return (
    <div className="px-4 pt-4" aria-busy="true">
      <div className="shimmer h-[6.5rem] rounded-3xl" />
      <div className="mt-3 space-y-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="shimmer h-[11.5rem] rounded-2xl" />
        ))}
      </div>
      <p className="mt-6 text-center text-[0.78rem] font-semibold text-slate-400">
        טוען נתוני לייב…
      </p>
    </div>
  );
}
