"use client";

import { useEffect, useRef } from "react";
import { BRANCHES } from "@/lib/branches";
import { distanceKm } from "@/lib/geo";
import { useLive } from "@/lib/store";

/** Only count presence when the device is essentially at the store. */
const NEAR_KM = 0.15;
/** How often we evaluate the device position. */
const CHECK_MS = 60_000;
/** Minimum gap between two pings for the same branch (2.5 minutes). */
const PING_EVERY_MS = 150_000;

/**
 * Passive crowding tracker, Waze-style: while the user has geolocation enabled
 * we watch their position and, when they are within ~150 m of a branch, quietly
 * ping `/api/crowd/ping` at most once every couple of minutes.
 */
export function PassiveTracker() {
  const { usingGps, location } = useLive();
  const posRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastPingRef = useRef<Record<string, number>>({});

  useEffect(() => {
    posRef.current = { lat: location.lat, lng: location.lng };
  }, [location.lat, location.lng]);

  useEffect(() => {
    if (!usingGps) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        posRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
      },
      () => {
        /* permission denied / unavailable — keep the last known position */
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [usingGps]);

  useEffect(() => {
    if (!usingGps) return;

    const check = () => {
      const pos = posRef.current;
      if (!pos) return;

      let nearestId: string | null = null;
      let nearestName = "";
      let best = Infinity;
      for (const branch of BRANCHES) {
        const d = distanceKm(pos.lat, pos.lng, branch.lat, branch.lng);
        if (d < best) {
          best = d;
          nearestId = branch.id;
          nearestName = branch.name;
        }
      }
      if (!nearestId || best > NEAR_KM) return;

      const now = Date.now();
      if (now - (lastPingRef.current[nearestId] ?? 0) < PING_EVERY_MS) return;
      lastPingRef.current[nearestId] = now;

      console.log("זיהוי נוכחות פסיבי: עודכן עומס בסניף", nearestName);

      void fetch("/api/crowd/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: nearestId,
          lat: pos.lat,
          lng: pos.lng,
        }),
      }).catch(() => {
        /* offline / server error — presence ping is best-effort */
      });
    };

    check();
    const id = window.setInterval(check, CHECK_MS);
    return () => window.clearInterval(id);
  }, [usingGps]);

  return null;
}