"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { communityReports, effectiveState } from "./live";
import { DEFAULT_LOCATION } from "./geo";
import type {
  Branch,
  Congestion,
  LiveState,
  Parking,
  Report,
  UserLocation,
} from "./types";

const REPORTS_KEY = "zerem.reports.v1";
const LOCATION_KEY = "zerem.location.v1";
const FAVORITES_KEY = "zerem.favorites.v1";
const MY_REPORTS_KEY = "zerem.my_reports.v1";
const IS_PRO_KEY = "zerem.is_pro.v1";
const PRO_EXPIRES_KEY = "zerem.pro_expires.v1";
const CUSTOM_BRANCHES_KEY = "zerem.custom_branches.v1";
const SMART_ALERTS_KEY = "zerem.smart_alerts.v1";

type ReportsMap = Record<string, Report[]>;

export interface MyReportItem {
  branchId: string;
  branchName: string;
  congestion: Congestion;
  parking: Parking;
  at: number;
}

export interface NewBranchInput {
  name: string;
  chain: Branch["chain"];
  city: string;
  address: string;
  size?: Branch["size"];
  lat?: number;
  lng?: number;
}

interface LiveContextValue {
  ready: boolean;
  now: number;
  location: UserLocation;
  locating: boolean;
  usingGps: boolean;
  locate: () => void;
  getLive: (branch: Branch) => LiveState;
  submitReport: (
    branch: Branch,
    congestion: Congestion,
    parking: Parking,
  ) => void;
  reportCountFor: (branchId: string) => number;
  totalSubmissions: number;
  toast: string | null;
  showToast: (message: string) => void;
  favorites: string[];
  toggleFavorite: (branchId: string) => void;
  isFavorite: (branchId: string) => boolean;
  myReports: MyReportItem[];
  isPro: boolean;
  proExpiresAt: number | null;
  proDaysLeft: number;
  proExpired: boolean;
  activatePro: (days?: number) => void;
  togglePro: (val?: boolean) => void;
  customBranches: Branch[];
  addCustomBranch: (input: NewBranchInput) => Branch;
  smartAlerts: boolean;
  toggleSmartAlerts: () => void;
}

const LiveContext = createContext<LiveContextValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const emptySubscribe = () => () => {};

function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const [now, setNow] = useState(() => Date.now());
  const [reports, setReports] = useState<ReportsMap>(() =>
    loadJson<ReportsMap>(REPORTS_KEY, {}),
  );
  const [myReports, setMyReports] = useState<MyReportItem[]>(() =>
    loadJson<MyReportItem[]>(MY_REPORTS_KEY, []),
  );
  const [favorites, setFavorites] = useState<string[]>(() =>
    loadJson<string[]>(FAVORITES_KEY, []),
  );
  const [location, setLocation] = useState<UserLocation>(() =>
    loadJson<UserLocation>(LOCATION_KEY, DEFAULT_LOCATION),
  );
  const [locating, setLocating] = useState(false);
  const [usingGps, setUsingGps] = useState(() => {
    const stored = loadJson<UserLocation | null>(LOCATION_KEY, null);
    return stored ? !stored.label.includes("ברירת מחדל") : false;
  });
  const [toast, setToast] = useState<string | null>(null);

  const [proExpiresAt, setProExpiresAt] = useState<number | null>(() =>
    loadJson<number | null>(PRO_EXPIRES_KEY, null),
  );
  const isPro = Boolean(proExpiresAt && proExpiresAt > now);
  const proDaysLeft = proExpiresAt && proExpiresAt > now
    ? Math.ceil((proExpiresAt - now) / (24 * 60 * 60 * 1000))
    : 0;
  const proExpired = Boolean(proExpiresAt && proExpiresAt <= now);
  const [customBranches, setCustomBranches] = useState<Branch[]>(() =>
    loadJson<Branch[]>(CUSTOM_BRANCHES_KEY, []),
  );
  const [smartAlerts, setSmartAlerts] = useState<boolean>(() =>
    loadJson<boolean>(SMART_ALERTS_KEY, true),
  );

  const ready = hydrated;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    } catch {
      /* ignore */
    }
  }, [reports, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      /* ignore */
    }
  }, [favorites, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(MY_REPORTS_KEY, JSON.stringify(myReports));
    } catch {
      /* ignore */
    }
  }, [myReports, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(PRO_EXPIRES_KEY, JSON.stringify(proExpiresAt));
      window.localStorage.setItem(IS_PRO_KEY, JSON.stringify(isPro));
    } catch {
      /* ignore */
    }
  }, [proExpiresAt, isPro, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(CUSTOM_BRANCHES_KEY, JSON.stringify(customBranches));
    } catch {
      /* ignore */
    }
  }, [customBranches, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(SMART_ALERTS_KEY, JSON.stringify(smartAlerts));
    } catch {
      /* ignore */
    }
  }, [smartAlerts, ready]);

  const persistLocation = useCallback((loc: UserLocation) => {
    setLocation(loc);
    try {
      window.localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    } catch {
      /* ignore */
    }
  }, []);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setToast("הדפדפן לא תומך באיתור מיקום — משתמשים במיקום ברירת מחדל");
      persistLocation(DEFAULT_LOCATION);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        persistLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "המיקום שלי",
        });
        setUsingGps(true);
        setLocating(false);
        setToast("איתרנו אותך — המיקום עודכן בהצלחה");
      },
      () => {
        persistLocation(DEFAULT_LOCATION);
        setUsingGps(false);
        setLocating(false);
        setToast("לא הצלחנו לאתר מיקום — עברנו למיקום ברירת מחדל");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  }, [persistLocation]);

  const toggleFavorite = useCallback((branchId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(branchId);
      const next = exists ? prev.filter((id) => id !== branchId) : [...prev, branchId];
      setToast(exists ? "הסניף הוסר מהמועדפים" : "הסניף נשמר במועדפים ⭐");
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (branchId: string) => favorites.includes(branchId),
    [favorites],
  );

  const activatePro = useCallback((days: number = 30) => {
    const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
    setProExpiresAt(expiresAt);
    setToast(`מנוי Zerem Pro הופעל ל-${days} ימים! 👑`);
  }, []);

  const togglePro = useCallback((val?: boolean) => {
    if (val === false) {
      setProExpiresAt(null);
      setToast("מנוי Pro הופסק");
    } else {
      activatePro(30);
    }
  }, [activatePro]);

  const toggleSmartAlerts = useCallback(() => {
    setSmartAlerts((prev) => {
      const next = !prev;
      setToast(next ? "התראות עומס חכמות הופעלו 🔔" : "התראות עומס חכמות כובו");
      return next;
    });
  }, []);

  const addCustomBranch = useCallback(
    (input: NewBranchInput): Branch => {
      const id = `custom-${Date.now()}`;
      const newBranch: Branch = {
        id,
        name: input.name.trim(),
        chain: input.chain,
        city: input.city.trim(),
        address: input.address.trim(),
        lat: input.lat ?? location.lat,
        lng: input.lng ?? location.lng,
        scheduleIdx: 0,
        hours: "08:00–21:00",
        size: input.size ?? "standard",
        isCustom: true,
      };

      setCustomBranches((prev) => [newBranch, ...prev]);
      setFavorites((prev) => [...prev, id]);
      setToast("הסניף החדש נוסף בהצלחה למפה ולמועדפים שלך! 🎉");
      return newBranch;
    },
    [location],
  );

  const submitReport = useCallback(
    (branch: Branch, congestion: Congestion, parking: Parking) => {
      const report: Report = {
        congestion,
        parking,
        at: Date.now(),
        source: "user",
      };
      setReports((prev) => {
        const existing = prev[branch.id] ?? [];
        const next = [report, ...existing].slice(0, 40);
        return { ...prev, [branch.id]: next };
      });
      setMyReports((prev) => [
        {
          branchId: branch.id,
          branchName: branch.name,
          congestion,
          parking,
          at: Date.now(),
        },
        ...prev.slice(0, 20),
      ]);
      setNow(Date.now());
      setToast(isPro ? "תודה VIP! הדיווח עודכן בעדיפות כפולה 👑" : "תודה! הדיווח עודכן בלייב 🙌");

      void fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: branch.id,
          branchName: branch.name,
          congestion,
          parking,
        }),
      }).catch(() => {
        /* ignore */
      });
    },
    [isPro],
  );

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const value = useMemo<LiveContextValue>(() => {
    const getLive = (branch: Branch): LiveState => {
      const user = reports[branch.id] ?? [];
      const merged = [...user, ...communityReports(branch, now)];
      return effectiveState(branch, merged, now);
    };

    const reportCountFor = (branchId: string) =>
      (reports[branchId] ?? []).length;

    const totalSubmissions = Object.values(reports).reduce(
      (sum, list) => sum + list.length,
      0,
    );

    return {
      ready,
      now,
      location,
      locating,
      usingGps,
      locate,
      getLive,
      submitReport,
      reportCountFor,
      totalSubmissions,
      toast,
      showToast: setToast,
      favorites,
      toggleFavorite,
      isFavorite,
      myReports,
      isPro,
      proExpiresAt,
      proDaysLeft,
      proExpired,
      activatePro,
      togglePro,
      customBranches,
      addCustomBranch,
      smartAlerts,
      toggleSmartAlerts,
    };
  }, [
    ready,
    now,
    reports,
    location,
    locating,
    usingGps,
    locate,
    submitReport,
    toast,
    favorites,
    toggleFavorite,
    isFavorite,
    myReports,
    isPro,
    togglePro,
    customBranches,
    addCustomBranch,
    smartAlerts,
    toggleSmartAlerts,
  ]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveContextValue {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be used within a LiveProvider");
  return ctx;
}
