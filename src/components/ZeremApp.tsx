"use client";

import { useDeferredValue, useMemo, useState, useEffect } from "react";
import { fetchRoadDistances, type BranchRouteInfo } from "@/lib/routing";
import {
  BRANCHES,
  CITIES,
  CITY_TOTALS,
  NATIONWIDE_COUNT,
  SEARCH_INDEX,
} from "@/lib/branches";
import { distanceKm } from "@/lib/geo";
import { isOpenAt, scheduleOf } from "@/lib/schedules";
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

export function ZeremApp() {
  const { ready, now, location, getLive, submitReport, totalSubmissions, favorites, customBranches, isPro, smartAlerts } =
    useLive();

  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    if (ready) {
      setSplashFading(true);
      const timer = setTimeout(() => setSplashVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [ready]);

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
  const [routesMap, setRoutesMap] = useState<Record<string, BranchRouteInfo>>({});

  const deferredSearch = useDeferredValue(search);
  const date = useMemo(() => new Date(now), [now]);

  const allBranches = useMemo(() => {
    return customBranches && customBranches.length > 0
      ? [...customBranches, ...BRANCHES]
      : BRANCHES;
  }, [customBranches]);

  // Live state for every branch
  const liveById = useMemo(() => {
    const map = new Map<string, LiveState>();
    for (const branch of allBranches) map.set(branch.id, getLive(branch));
    return map;
  }, [getLive, allBranches]);

  // VIP smart browser notifications when a favorite branch becomes free
  useEffect(() => {
    if (!ready || !isPro || !smartAlerts) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (favorites.length === 0) return;

    const notifiedKey = "zerem.last_notified_free.v1";
    let notifiedMap: Record<string, number> = {};
    try {
      notifiedMap = JSON.parse(window.sessionStorage.getItem(notifiedKey) || "{}");
    } catch {
      notifiedMap = {};
    }

    const branchMap = new Map(allBranches.map((b) => [b.id, b]));
    let updated = false;

    for (const favId of favorites) {
      const branch = branchMap.get(favId);
      if (!branch) continue;
      const live = liveById.get(favId);
      // Only alert on a real recent report, never on the time-of-day estimate.
      if (live && !live.estimated && live.congestion === "free") {
        const last = notifiedMap[favId] || 0;
        if (now - last > 30 * 60 * 1000) {
          notifiedMap[favId] = now;
          updated = true;
          try {
            new Notification(`הסופר התפנה! 🛒`, {
              body: `לפי דיווח עדכני, ${branch.name} ב${branch.city} פנוי עכשיו.`,
              icon: "/icons/icon-192.png",
            });
          } catch {
            /* ignore */
          }
        }
      }
    }

    if (updated) {
      try {
        window.sessionStorage.setItem(notifiedKey, JSON.stringify(notifiedMap));
      } catch {
        /* ignore */
      }
    }
  }, [ready, isPro, smartAlerts, favorites, liveById, now, allBranches]);

  // Determine branch pool: all branches for "feed", only favorited branches for "favorites"
  const pool = useMemo(() => {
    if (currentTab === "favorites") {
      const favSet = new Set(favorites);
      return allBranches.filter((b) => favSet.has(b.id));
    }
    return allBranches;
  }, [currentTab, favorites, allBranches]);

  // Filter pool
  const base = useMemo(() => {
    if (!ready) return [];
    const tokens = deferredSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return pool.filter((branch) => {
      if (city !== "all" && branch.city !== city) return false;
      if (openNow && !isOpenAt(scheduleOf(branch), date)) return false;
      if (lowCongestion && (liveById.get(branch.id)?.congestion ?? "heavy") !== "free") {
        return false;
      }
      if (tokens.length) {
        // Fast index check
        const hay =
          SEARCH_INDEX.get(branch.id) ??
          `${branch.name} ${branch.chain} ${branch.city} ${branch.address}`.toLowerCase();
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

  useEffect(() => {
    if (!ready || base.length === 0) return;
    const topCandidates = [...base]
      .sort((a, b) => distanceKm(location.lat, location.lng, a.lat, a.lng) - distanceKm(location.lat, location.lng, b.lat, b.lng))
      .slice(0, 25);

    let active = true;
    void fetchRoadDistances(location, topCandidates).then((routes) => {
      if (active && routes && Object.keys(routes).length > 0) {
        setRoutesMap((prev) => ({ ...prev, ...routes }));
      }
    });

    return () => {
      active = false;
    };
  }, [ready, location.lat, location.lng, base]);


  const items = useMemo<ListItem[]>(() => {
    const filtered =
      chain === "all" ? base : base.filter((branch) => branch.chain === chain);

    const mapped: ListItem[] = filtered.map((branch) => {
      const routeInfo = routesMap[branch.id];
      const distance = routeInfo?.isRealRoad
        ? routeInfo.drivingDistanceKm
        : distanceKm(location.lat, location.lng, branch.lat, branch.lng);
      return {
        branch,
        live: liveById.get(branch.id) as LiveState,
        distance,
        routeInfo,
      };
    });

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
  }, [base, chain, liveById, location, sort, routesMap]);

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
      {splashVisible && <SplashScreen fading={splashFading} />}
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
          <div className="mx-4 mt-6 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-card">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shadow-xs">
              <StarIcon filled className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-black text-slate-900">
              עדיין אין סניפים במועדפים
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              לחצו על סימון הכוכב ליד כל סופרמרקט כדי לשמור אותו כאן לגישה מהירה בלחיצה אחת.
            </p>
            <button
              type="button"
              onClick={() => setCurrentTab("feed")}
              className="mt-5 inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-sky-600 active:scale-95"
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
              <RadarIcon className="h-3.5 w-3.5 text-sky-600" />
              זרם · רשת דיווחים קהילתית
            </p>
            <p className="mt-1">
              {totalSubmissions > 0
                ? `פרסמתם ${totalSubmissions} דיווחים. תודה שאתם עוזרים לכולם!`
                : "כל דיווח עוזר לעוד ישראלים לתכנן את הקנייה."}
            </p>
            <p className="mt-1 text-slate-300">
              {NATIONWIDE_COUNT} סניפים ב-{CITIES.length} ערים, לפי נתוני OpenStreetMap.
              העומס מבוסס על דיווחי קהילה, ובלי דיווח עדכני מוצגת הערכה לפי שעה ויום.
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

function SplashScreen({ fading }: { fading: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090d16] text-white select-none transition-opacity duration-400 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="מסך פתיחה של זרם"
    >
      <div className="flex flex-col items-center px-6 text-center">
        {/* Glowing Ambient Aura & Authentic Logo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-36 w-36 rounded-full bg-cyan-400/20 blur-2xl animate-pulse" />
          <img
            src="/logo.png"
            alt="זרם"
            className="relative h-24 w-24 rounded-3xl object-cover shadow-2xl ring-1 ring-cyan-400/30"
          />
        </div>

        <div className="mt-6 flex items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight text-white">זרם</h1>
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
        </div>

        <p className="mt-1 text-xs font-bold text-cyan-400/90 tracking-wider">
          עומסים וחניה בסופר בלייב
        </p>

        {/* Smooth modern progress bar */}
        <div className="mt-8 flex flex-col items-center gap-2.5">
          <div className="h-1.5 w-44 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 animate-pulse" />
          </div>
          <span className="text-[0.72rem] text-slate-400 font-medium">
            טוען {NATIONWIDE_COUNT.toLocaleString("en-US")} סניפים ועומסי קהילה...
          </span>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return <div className="min-h-[50vh]" aria-hidden="true" />;
}
