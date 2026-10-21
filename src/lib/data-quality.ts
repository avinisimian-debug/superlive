import { distanceKm } from "./geo";
import { isValidCoordinates } from "./navigation";

/**
 * Location trust for a branch, derived from the dataset itself:
 * - "consistent": the pin sits near the centre of the city the branch belongs to.
 * - "unverified": there is not enough data to check the pin (small or unknown city).
 * - "suspect":    the pin is far from the city the branch belongs to, so Waze
 *                 would drive the user somewhere else. Suspect branches are
 *                 quarantined (never shown, never navigated to).
 */
export type LocationTrust = "consistent" | "unverified" | "suspect";

export interface QualityInput {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  /**
   * Whether this branch may help locate its city centre. Branded chain stores
   * come with real addresses; the generic neighbourhood-grocery rows were
   * imported with unreliable city labels, so they are checked but never trusted
   * as a reference.
   */
  anchor: boolean;
}

export interface BranchQuality {
  trust: LocationTrust;
  /** The city the branch belongs to (the branch name wins over a wrong city field). */
  city: string;
  /** Distance in km from the expected city centre, when it could be measured. */
  offsetKm: number | null;
  reason?: string;
}

/** A pin further than this from its city centre is treated as wrong. */
export const MAX_CITY_OFFSET_KM = 8;
/** Cities need at least this many pins before their centre is trusted. */
const MIN_CITY_SAMPLES = 2;
/** A city label whose pins spread wider than this (median) is a junk label. */
const MAX_CITY_SPREAD_KM = 6;

const UNKNOWN_CITY_LABELS = new Set(["אזור אחר", ""]);

/** Alternate spellings seen in branch titles, mapped to the dataset's city label. */
const CITY_ALIASES: Record<string, string> = {
  "יוקנעם": "יקנעם",
  "יוקנעם עילית": "יקנעם עילית",
  "ראשלצ": "ראשון לציון",
  "ראשל\"צ": "ראשון לציון",
  "פ\"ת": "פתח תקווה",
  "ת\"א": "תל אביב",
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * The city named in a branch title such as "ויקטורי - אשקלון (ברנע)", when it
 * is one of the known cities. Longest match wins so "באר שבע" beats "באר".
 */
export function cityFromName(name: string, knownCities: Set<string>): string | null {
  const dash = name.indexOf(" - ");
  if (dash < 0) return null;
  const tail = name.slice(dash + 3).split("(")[0].trim();
  if (!tail) return null;
  const alias = CITY_ALIASES[tail];
  if (alias && knownCities.has(alias)) return alias;
  if (knownCities.has(tail)) return tail;
  let best: string | null = null;
  for (const city of knownCities) {
    if (city.length < 3) continue;
    if ((tail === city || tail.startsWith(`${city} `)) && (!best || city.length > best.length)) {
      best = city;
    }
  }
  return best;
}

interface Centre {
  lat: number;
  lng: number;
}

function robustCentre(points: Centre[]): Centre | null {
  if (points.length < MIN_CITY_SAMPLES) return null;
  let centre = { lat: median(points.map((p) => p.lat)), lng: median(points.map((p) => p.lng)) };
  // Second pass without far outliers so a few wrong pins cannot drag the centre.
  const near = points.filter((p) => distanceKm(p.lat, p.lng, centre.lat, centre.lng) <= 15);
  if (near.length < MIN_CITY_SAMPLES) return null;
  centre = { lat: median(near.map((p) => p.lat)), lng: median(near.map((p) => p.lng)) };
  const spread = median(near.map((p) => distanceKm(p.lat, p.lng, centre.lat, centre.lng)));
  if (spread > MAX_CITY_SPREAD_KM) return null;
  return centre;
}

/**
 * Scores every branch's pin against the branded (anchor) pins of the same city. Pure and
 * deterministic, so it can run at module load and in tests/CI.
 */
export function assessBranches(branches: QualityInput[]): Map<string, BranchQuality> {
  const knownCities = new Set(branches.map((b) => b.city).filter((c) => !UNKNOWN_CITY_LABELS.has(c)));

  const expected = branches.map((b) => cityFromName(b.name, knownCities) ?? b.city);

  const pointsByCity = new Map<string, Centre[]>();
  branches.forEach((b, i) => {
    const city = expected[i];
    if (!b.anchor || UNKNOWN_CITY_LABELS.has(city) || !isValidCoordinates(b.lat, b.lng)) return;
    const list = pointsByCity.get(city) ?? [];
    list.push({ lat: b.lat, lng: b.lng });
    pointsByCity.set(city, list);
  });

  const centres = new Map<string, Centre>();
  for (const [city, points] of pointsByCity) {
    const centre = robustCentre(points);
    if (centre) centres.set(city, centre);
  }

  const out = new Map<string, BranchQuality>();
  branches.forEach((b, i) => {
    const city = expected[i];
    if (!isValidCoordinates(b.lat, b.lng)) {
      out.set(b.id, { trust: "suspect", city, offsetKm: null, reason: "invalid-coordinates" });
      return;
    }
    const centre = centres.get(city);
    if (!centre) {
      out.set(b.id, { trust: "unverified", city, offsetKm: null });
      return;
    }
    const offsetKm = distanceKm(b.lat, b.lng, centre.lat, centre.lng);
    if (offsetKm > MAX_CITY_OFFSET_KM) {
      out.set(b.id, { trust: "suspect", city, offsetKm, reason: "far-from-city" });
      return;
    }
    out.set(b.id, { trust: "consistent", city, offsetKm });
  });
  return out;
}
