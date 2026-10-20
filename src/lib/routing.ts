import type { Branch } from "./types";
import { distanceKm } from "./geo";

export interface BranchRouteInfo {
  drivingDistanceKm: number;
  drivingMinutes: number;
  formattedDistance: string;
  formattedDuration: string;
  isRealRoad: boolean;
}

// Client-side cache: key = branchId, value = BranchRouteInfo
const clientRouteCache = new Map<string, BranchRouteInfo>();
let lastFetchedOrigin = "";

/**
 * Fetches real driving distances and durations for the nearest candidate branches.
 */
export async function fetchRoadDistances(
  origin: { lat: number; lng: number },
  candidates: Branch[]
): Promise<Record<string, BranchRouteInfo>> {
  if (!candidates || candidates.length === 0) return {};

  const originKey = `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}`;
  if (originKey !== lastFetchedOrigin) {
    clientRouteCache.clear();
    lastFetchedOrigin = originKey;
  }

  // Pre-filter up to 30 candidates to keep the request lightweight and fast
  const targetCandidates = candidates.slice(0, 30);
  const toFetch = targetCandidates.filter((b) => !clientRouteCache.has(b.id));

  if (toFetch.length > 0) {
    try {
      const res = await fetch("/api/routing/distances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destinations: toFetch.map((b) => ({ id: b.id, lat: b.lat, lng: b.lng })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.routes) {
          for (const [id, info] of Object.entries(data.routes as Record<string, BranchRouteInfo>)) {
            clientRouteCache.set(id, info);
          }
        }
      }
    } catch {
      /* ignore network errors */
    }
  }

  const result: Record<string, BranchRouteInfo> = {};
  for (const b of targetCandidates) {
    const cached = clientRouteCache.get(b.id);
    if (cached) {
      result[b.id] = cached;
    }
  }

  return result;
}
