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
import { SupermarketList, type ListItem } from "./SupermarketList";
import { ReportModal } from "./ReportModal";
import { BranchDetailSheet } from "./BranchDetailSheet";
import { CitySheet, type CityOption } from "./CitySheet";
import { PassiveTracker } from "./PassiveTracker";
import { Toast } from "./Toast";
import { BottomNav, type AppTab } from "./BottomNav";
import { PersonalArea } from "./PersonalArea";
import { RadarIcon, StarIcon } from "./icons";
import { useAuth } from "@/lib/auth";
import { Effects, celebrate } from "./ui";

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

  const { user } = useAuth();
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    if (ready) {
      setSplashFading(true);
      const timer = setTimeout(() => setSplashVisible(false), 500);
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

  // City-wide crowd pulse for the hero (every branch, before search/chain filters).
  const pulse = useMemo(() => {
    const acc: Record<Congestion, number> = { free: 0, medium: 0, heavy: 0 };
    for (const branch of allBranches) {
      if (city !== "all" && branch.city !== city) continue;
      const live = liveById.get(branch.id);
      if (live) acc[live.congestion] += 1;
    }
    return acc;
  }, [allBranches, liveById, city]);

  // Nearest branch that is quiet and open right now.
  const suggestion = useMemo<ListItem | null>(() => {
    let best: ListItem | null = null;
    for (const item of items) {
      if (item.live.congestion !== "free") continue;
      if (!isOpenAt(scheduleOf(item.branch), date)) continue;
      if (!best || item.distance < best.distance) best = item;
    }
    return best;
  }, [items, date]);

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

      {currentTab === "feed" ? (
        <Header
          totalBranches={NATIONWIDE_COUNT}
          cityCount={CITIES.length}
          pulse={pulse}
          city={city}
          now={now}
          firstName={user?.name ? user.name.split(" ")[0] : null}
          suggestion={ready ? suggestion : null}
          onOpenCity={() => setCityOpen(true)}
          onOpenBranch={(item) => setDetail(item.branch)}
        />
      ) : currentTab === "favorites" ? (
        <div className="hero px-5 pb-6 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)]">
          <span className="aurora aurora-a" aria-hidden="true" />
          <span className="aurora aurora-b" aria-hidden="true" />
          <p className="text-sm font-semibold text-white/60">הסופרים שלך</p>
          <h1 className="mt-1 flex items-center gap-2 text-[1.7rem] font-black tracking-tight">
            מועדפים
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-bold text-amber-300">
              {favorites.length}
            </span>
          </h1>
          <p className="mt-1 text-[0.78rem] text-white/55">מצב העומס בסניפים ששמרת, במבט אחד.</p>
        </div>
      ) : null}

      {currentTab !== "profile" && !(currentTab === "favorites" && pool.length === 0) ? (
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

      <main className="pb-32">
        {!ready ? (
          <LoadingState />
        ) : currentTab === "profile" ? (
          <PersonalArea
            onGoToFavorites={() => setCurrentTab("favorites")}
            onOpenBranch={setDetail}
            allBranches={allBranches}
          />
        ) : currentTab === "favorites" && pool.length === 0 ? (
          <div className="mx-4 mt-5 animate-rise rounded-[1.6rem] bg-white p-8 text-center shadow-card ring-1 ring-slate-200/60">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.2rem] bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-[0_10px_30px_-10px_rgba(245,158,11,0.7)]">
              <StarIcon filled className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-lg font-black text-ink-900">עוד אין לך סופרים שמורים</h3>
            <p className="mx-auto mt-1.5 max-w-[16rem] text-[0.8rem] leading-relaxed text-slate-500">
              סמנו כוכב על הסופרים שאתם הולכים אליהם, ותראו כאן את העומס בכולם במבט אחד.
            </p>
            <button
              type="button"
              onClick={() => setCurrentTab("feed")}
              className="press bg-brand-gradient mt-6 inline-flex h-11 items-center justify-center rounded-2xl px-6 text-sm font-extrabold text-white shadow-glow"
            >
              למציאת סופרים קרובים
            </button>
          </div>
        ) : (
          <>
            <div className="mt-1 flex items-center justify-between px-5">
              <p className="text-[0.74rem] font-bold text-slate-500">
                <span className="tabular text-ink-900">{items.length.toLocaleString("he-IL")}</span> סניפים
                {city !== "all" ? ` ב${city}` : ""}
              </p>
              <p className="text-[0.7rem] font-semibold text-slate-400">{SORT_LABEL[sort]}</p>
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
          <footer className="mt-10 px-6 text-center text-[0.68rem] leading-relaxed text-slate-400">
            <p className="flex items-center justify-center gap-1.5 font-bold text-slate-500">
              <RadarIcon className="h-3.5 w-3.5 text-brand-600" />
              זרם · רשת דיווחים קהילתית
            </p>
            <p className="mt-1">
              {totalSubmissions > 0
                ? `שלחתם ${totalSubmissions} דיווחים. תודה שאתם עוזרים לכולם!`
                : "כל דיווח עוזר לעוד אנשים לתכנן את הקנייה."}
            </p>
            <p className="mt-1 text-slate-400/80">
              {NATIONWIDE_COUNT.toLocaleString("he-IL")} סניפים ב-{CITIES.length} יישובים, לפי נתוני OpenStreetMap.
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
          onSubmit={(congestion, parking, origin) => {
            submitReport(reporting, congestion, parking);
            setReporting(null);
            // The sheet is closing, so burst from mid-screen above where its button was.
            celebrate(origin.x, Math.min(origin.y, window.innerHeight * 0.55), 20);
          }}
        />
      ) : null}

      <Effects />
      <PassiveTracker />
      <Toast />
    </>
  );
}

function SplashScreen({ fading }: { fading: boolean }) {
  return (
    <div
      className={`hero fixed inset-0 z-[70] flex flex-col items-center justify-center select-none transition-opacity duration-500 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-label="מסך פתיחה של זרם"
    >
      <span className="aurora aurora-a" aria-hidden="true" />
      <span className="aurora aurora-b" aria-hidden="true" />
      <div className="flex flex-col items-center px-6 text-center">
        <div className="relative" style={{ animation: "splash-logo 0.9s var(--ease-out-expo) both" }}>
          <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-cyan-400/30 blur-3xl" />
          <img src="/logo.svg" alt="זרם" className="h-24 w-24 rounded-[1.6rem] shadow-glow" />
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight">זרם</h1>
        <p className="mt-1.5 text-sm font-semibold text-cyan-200/80">עומסים וחניה בסופר, בזמן אמת</p>
        <div className="mt-10 h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div
            className="bg-brand-gradient h-full w-full origin-right"
            style={{ animation: "splash-bar 1.2s var(--ease-out-expo) both" }}
          />
        </div>
        <span className="mt-3 text-[0.72rem] font-medium text-white/45">
          טוען {NATIONWIDE_COUNT.toLocaleString("he-IL")} סניפים
        </span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 px-4 pt-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-[1.6rem] bg-white p-4 shadow-card">
          <div className="flex gap-3">
            <div className="skeleton h-12 w-12 rounded-2xl" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="skeleton h-3.5 w-2/3 rounded-full" />
              <div className="skeleton h-3 w-1/2 rounded-full" />
            </div>
          </div>
          <div className="skeleton mt-4 h-12 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
