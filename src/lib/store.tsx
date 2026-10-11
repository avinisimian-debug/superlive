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

const REPORTS_KEY = "superlive.reports.v1";
const LOCATION_KEY = "superlive.location.v1";

type ReportsMap = Record<string, Report[]>;

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

/**
 * True only after the client has hydrated. Uses the server snapshot during SSR
 * and the first hydration render, then flips — so localStorage-backed state can
 * be read without ever producing an SSR/client mismatch.
 */
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
  const [location, setLocation] = useState<UserLocation>(() =>
    loadJson<UserLocation>(LOCATION_KEY, DEFAULT_LOCATION),
  );
  const [locating, setLocating] = useState(false);
  const [usingGps, setUsingGps] = useState(() => {
    const stored = loadJson<UserLocation | null>(LOCATION_KEY, null);
    return stored ? !stored.label.includes("ברירת מחדל") : false;
  });
  const [toast, setToast] = useState<string | null>(null);
  const ready = hydrated;

  // Keep the "live" clock ticking so decay and "time ago" stay honest.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    } catch {
      /* storage may be unavailable (private mode) — ignore */
    }
  }, [reports, ready]);

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
        // Keep the log bounded to the recent window.
        const next = [report, ...existing].slice(0, 40);
        return { ...prev, [branch.id]: next };
      });
      setNow(Date.now());
      setToast("תודה! הדיווח עודכן בלייב 🙌");

      // Persist the report server-side (best-effort, non-blocking).
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
        /* offline / server error — local report still applies */
      });
    },
    [],
  );

  // Auto-dismiss toast.
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
  ]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveContextValue {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be used within a LiveProvider");
  return ctx;
}
