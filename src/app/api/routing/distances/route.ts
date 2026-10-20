import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// Server-side distance cache: key = `${originKey}:${destKey}`, value = { km, min, cachedAt }
const cache = new Map<string, { km: number; min: number; cachedAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface RouteRequestItem {
  id: string;
  lat: number;
  lng: number;
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const origin = body.origin as { lat: number; lng: number } | undefined;
  const destinations = (body.destinations as RouteRequestItem[]) || [];

  if (
    !origin ||
    typeof origin.lat !== "number" ||
    typeof origin.lng !== "number" ||
    !Number.isFinite(origin.lat) ||
    !Number.isFinite(origin.lng)
  ) {
    return NextResponse.json({ success: false, error: "Missing or invalid origin coordinates" }, { status: 400 });
  }

  if (!Array.isArray(destinations) || destinations.length === 0) {
    return NextResponse.json({ success: true, routes: {} });
  }

  // Bounded candidate batch: maximum 35 candidates
  const candidates = destinations.slice(0, 35);

  const now = Date.now();
  const originKey = `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}`;
  const routes: Record<
    string,
    {
      drivingDistanceKm: number;
      drivingMinutes: number;
      formattedDistance: string;
      formattedDuration: string;
      isRealRoad: boolean;
    }
  > = {};

  const uncached: RouteRequestItem[] = [];

  for (const item of candidates) {
    const destKey = `${item.lat.toFixed(3)},${item.lng.toFixed(3)}`;
    const cacheKey = `${originKey}:${destKey}`;
    const cached = cache.get(cacheKey);

    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
      routes[item.id] = {
        drivingDistanceKm: cached.km,
        drivingMinutes: cached.min,
        formattedDistance: `${cached.km.toFixed(1)} ק״מ בנסיעה`,
        formattedDuration: `כ-${cached.min} דק׳ נסיעה`,
        isRealRoad: true,
      };
    } else {
      uncached.push(item);
    }
  }

  if (uncached.length > 0) {
    try {
      // Build OSRM Table coordinates: index 0 is origin, indices 1..N are destinations
      const coords = [`${origin.lng},${origin.lat}`, ...uncached.map((d) => `${d.lng},${d.lat}`)].join(";");
      const url = `http://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance,duration&sources=0`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.code === "Ok" && Array.isArray(data.distances?.[0]) && Array.isArray(data.durations?.[0])) {
          const distancesRow = data.distances[0]; // distances in meters
          const durationsRow = data.durations[0]; // durations in seconds

          for (let i = 0; i < uncached.length; i++) {
            const item = uncached[i];
            const distMeters = distancesRow[i + 1];
            const durSeconds = durationsRow[i + 1];

            if (typeof distMeters === "number" && distMeters > 0) {
              const km = Math.round((distMeters / 1000) * 10) / 10;
              const min = Math.max(1, Math.round(durSeconds / 60));

              const destKey = `${item.lat.toFixed(3)},${item.lng.toFixed(3)}`;
              cache.set(`${originKey}:${destKey}`, { km, min, cachedAt: now });

              routes[item.id] = {
                drivingDistanceKm: km,
                drivingMinutes: min,
                formattedDistance: `${km.toFixed(1)} ק״מ בנסיעה`,
                formattedDuration: `כ-${min} דק׳ נסיעה`,
                isRealRoad: true,
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn("[routing] OSRM table request failed or timed out:", err);
    }
  }

  // Periodic cache pruning
  if (cache.size > 5000) {
    const cutoff = now - CACHE_TTL_MS;
    for (const [k, v] of cache.entries()) {
      if (v.cachedAt < cutoff) cache.delete(k);
    }
  }

  return NextResponse.json({
    success: true,
    count: Object.keys(routes).length,
    routes,
  });
}
