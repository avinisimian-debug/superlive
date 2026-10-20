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
import { BranchDetailSheet } from "./BranchDetailSheet";
import { CitySheet, type CityOption } from "./CitySheet";
import { PassiveTracker } from "./PassiveTracker";
import { Toast } from "./Toast";
import { BottomNav, type AppTab } from "./BottomNav";
import { PersonalArea } from "./PersonalArea";
import { RadarIcon, StarIcon } from "./icons";

const CONGESTION_RANK: Record<Congestion, number> = { free: 0, medium: 1, heavy: 2 };
const PARKING_RANK: Record<Parking, number> = { plenty: 0, partial: 1, none: 2 };
const SORT_LABEL: Record<SortMode, string> = {
  nearest: "ממוין לפי מרחק",
  emptiest: "ממוין לפי פניות",
  byCity: "ממוין לפי עיר ורשת",
};

export function SuperLiveApp() {
  const { ready, now, location, getLive, submitReport, totalSubmissions, favorites } =
    useLive();

  const [currentTab, setCurrentTab] = useState<AppTab>("feed");
  const [city, setCity] = useState("all");
  const [chain, setChain] = useState<ChainFilter>("all");
  const [sort, setSort] = useState<SortMode>("nearest");
  const [search, setSearch] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [lowCongestion, setLowCongestion] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [reporting, setReporting] = useState<Branch | null>(null);
  const [detail, setDetail] = useState<Branch | null>(null);

  const deferredSearch = useDeferredValue(search);
  const date = useMemo(() => new Date(now), [now]);

  // Live state for every branch
  const liveById = useMemo(() => {
    const map = new Map<string, LiveState>();
    for (const branch of BRANCHES) map.set(branch.id, getLive(branch));
    return map;
  }, [getLive]);

  // Determine branch pool: all branches for "feed", only favorited branches for "favorites"
  const pool = useMemo(() => {
    if (currentTab === "favorites") {
      const favSet = new Set(favorites);
      return BRANCHES.filter((b) => favSet.has(b.id));
    }
    return BRANCHES;
  }, [currentTab, favorites]);

  // Filter pool
  const base = useMemo(() => {
    if (!ready) return [];
    const tokens = deferredSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return pool.filter((branch) => {
      if (city !== "all" && branch.city !== city) return false;
      if (openNow && !isOpenAt(branch.scheduleIdx, date)) return false;
      if (lowCongestion && (liveById.get(branch.id)?.congestion ?? "heavy") !== "free") {
        return false;
      }
      if (tokens.length) {
        // Fast index check
        const idx = BRANCHES.indexOf(branch);
        const hay = idx >= 0 ? SEARCH_INDEX[idx] : `${branch.name} ${branch.chain} ${branch.city} ${branch.address}`.toLowerCase();
        for (const token of tokens) {
          if (!hay.includes(token)) return false;
        }
      }
      return true;
    });
  }, [ready, pool, deferredSearch, city, openNow, lowCongestion, liveById, date]);

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
      const cDiff =
        CONGESTION_RANK[a.live.congestion] - CONGESTION_RANK[b.live.congestion];
      if (cDiff !== 0) return cDiff;
      const pDiff = PARKING_RANK[a.live.parking] - PARKING_RANK[b.live.parking];
      if (pDiff !== 0) return pDiff;
      return a.distance - b.distance;
    });

    return mapped;
  }, [base, chain, liveById, location, sort]);

  const counts = useMemo(() => {
    let free = 0;
    let medium = 0;
    let heavy = 0;
    for (const item of items) {
      if (item.live.congestion === "free") free += 1;
      else if (item.live.congestion === "medium") medium += 1;
      else heavy += 1;
    }
    return { free, medium, heavy };
  }, [items]);

  const freeNow = useMemo(() => {
    let free = 0;
    for (const live of liveById.values()) {
      if (live.congestion === "free") free += 1;
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

  const resetKey = `${currentTab}|${city}|${chain}|${sort}|${deferredSearch}|${openNow}|${lowCongestion}`;

  return (
    <>
      <Header
        totalBranches={NATIONWIDE_COUNT}
        cityCount={CITIES.length}
        freeNow={freeNow}
        city={city}
        onOpenCity={() => setCityOpen(true)}
      />

      {currentTab !== "profile" ? (
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
      ) : null}

      <main className="pb-28">
        {!ready ? (
          <LoadingState />
        ) : currentTab === "profile" ? (
          <PersonalArea onGoToFavorites={() => setCurrentTab("favorites")} />
        ) : currentTab === "favorites" && pool.length === 0 ? (
          <div className="mx-auto max-w-sm px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-500 shadow-sm">
              <StarIcon filled className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">
              עדיין אין סניפים במועדפים
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              לחצו על סימון הכוכב ליד כל סופרמרקט כדי לשמור אותו כאן לגישה מהירה בלחיצה אחת.
            </p>
            <button
              type="button"
              onClick={() => setCurrentTab("feed")}
              className="mt-5 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              גלה סופרמרקטים קרובים
            </button>
          </div>
        ) : (
          <>
            <StatsSummary counts={counts} total={items.length} />

            <div className="mt-3 flex items-center justify-between px-4">
              <p className="text-[0.72rem] font-semibold text-slate-500">
                {currentTab === "favorites" ? "המועדפים שלך: " : "מציגים "}
                {items.length} סניפים
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
              onOpen={setDetail}
            />
          </>
        )}

        {currentTab !== "profile" ? (
          <footer className="mt-8 px-6 text-center text-[0.68rem] leading-relaxed text-slate-400">
            <p className="flex items-center justify-center gap-1.5 font-semibold text-slate-500">
              <RadarIcon className="h-3.5 w-3.5 text-brand-600" />
              זרם · רשת דיווחים קהילתית
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
        ) : null}
      </main>

      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

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

      {detail ? (
        <BranchDetailSheet
          branch={detail}
          live={getLive(detail)}
          distance={distanceKm(location.lat, location.lng, detail.lat, detail.lng)}
          now={now}
          onClose={() => setDetail(null)}
          onReport={(branch) => {
            setDetail(null);
            setReporting(branch);
          }}
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

      <PassiveTracker />
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
