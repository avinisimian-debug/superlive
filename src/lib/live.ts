import type {
  Branch,
  Chain,
  Congestion,
  LiveState,
  Parking,
  Report,
} from "./types";

export const CONGESTION_LABEL: Record<Congestion, string> = {
  free: "פנוי",
  medium: "בינוני",
  heavy: "עמוס",
};

export const CONGESTION_HINT: Record<Congestion, string> = {
  free: "עד 5 דק׳",
  medium: "10–15 דק׳",
  heavy: "20+ דק׳",
};

export const PARKING_LABEL: Record<Parking, string> = {
  plenty: "פנוי בשפע",
  partial: "חניה חלקית",
  none: "אין חניה",
};

export const PARKING_SHORT: Record<Parking, string> = {
  plenty: "בשפע",
  partial: "חלקית",
  none: "אין",
};

const FRESH_WINDOW_MS = 90 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SIZE_FACTOR: Record<Branch["size"], number> = {
  express: 0.1,
  standard: 0,
  hyper: -0.1,
};

/**
 * Small neighbourhood / village groceries that are effectively never crowded:
 * their baseline is pinned to quiet so congestion stays "free" and parking
 * "plenty" (a real community report can still override the default).
 */
const ALWAYS_QUIET_CHAINS: ReadonlySet<Chain> = new Set(["מכולת שכונתית"]);

/** Specific branches pinned to the quiet baseline as well. */
const ALWAYS_QUIET_BRANCH_IDS: ReadonlySet<string> = new Set(["b-3449"]);

const QUIET_LOAD = 0.18;

function isAlwaysQuiet(branch: Branch): boolean {
  return ALWAYS_QUIET_CHAINS.has(branch.chain) || ALWAYS_QUIET_BRANCH_IDS.has(branch.id);
}

/**
 * Per-chain baseline demand offset (-0.1 … +0.14). Discount/hyper chains draw
 * bigger crowds at peak, express convenience formats stay lighter.
 */
const CHAIN_LOAD: Record<Chain, number> = {
  "שופרסל": 0.0,
  "שופרסל שלי": 0.0,
  "שופרסל דיל": 0.1,
  "שופרסל אקספרס": -0.1,
  "יש (שופרסל)": 0.0,
  "רמי לוי": 0.1,
  "קרפור": 0.0,
  "מגה": 0.0,
  "יינות ביתן": 0.0,
  "ויקטורי": 0.0,
  "יוחננוף": 0.1,
  "אושר עד": 0.1,
  "טיב טעם": 0.0,
  "פרשמרקט": 0.0,
  "חצי חינם": 0.1,
  "מחסני השוק": 0.1,
  "סופר יודה": 0.0,
  "קשת טעמים": 0.0,
  "אלונית / דור אלון": 0.0,
  "קופיקס": -0.1,
  "am:pm": -0.1,
  "yellow": -0.1,
  "סוגוד": 0.0,
  "מנטה": -0.1,
  "אלונית": 0.0,
  "זול ובגדול": 0.0,
  "קואופ": 0.0,
  "סיטי מרקט": 0.0,
  "סטופ מרקט": 0.0,
  "נתיב החסד": 0.0,
  "שוק העיר": 0.0,
  "סופר ברקת": 0.0,
  "פוליצר": 0.0,
  "סופרמרקט שכונתי": 0.0,
  "מכולת שכונתית": 0.0,
  "סופר ספיר": 0.0,
  "מעיין 2000": 0.0,
  "סלאח דבאח": 0.1
};

/**
 * Deterministic baseline "load" (0..1) for a branch at a given time, modelling
 * Israel's shopping rhythm: Friday morning crush, Saturday-night rush after
 * Shabbat, weekday evening peaks and quiet early mornings — combined with a
 * per-chain demand profile and store size.
 */
export function loadScore(branch: Branch, date: Date): number {
  if (isAlwaysQuiet(branch)) return QUIET_LOAD;
  const hour = date.getHours() + date.getMinutes() / 60;
  const day = date.getDay(); // 0 = Sunday … 5 = Friday, 6 = Saturday
  const popularity = (hash(branch.id) % 1000) / 1000;

  let load =
    0.24 +
    popularity * 0.3 +
    SIZE_FACTOR[branch.size] +
    (CHAIN_LOAD[branch.chain] ?? 0);

  if (day === 5) {
    load += hour >= 7 && hour <= 14 ? 0.42 : hour > 14 && hour < 17 ? 0.16 : -0.12;
  } else if (day === 6) {
    load += hour >= 19 ? 0.38 : -0.22;
  } else {
    if (hour >= 16 && hour <= 20) load += 0.38;
    else if (hour >= 12 && hour <= 14) load += 0.2;
    else if (hour >= 8 && hour < 11) load += 0.08;
    else if (hour < 8 || hour > 21) load -= 0.16;
  }

  return clamp(load, 0.04, 0.98);
}

function congestionFromLoad(load: number): Congestion {
  if (load < 0.42) return "free";
  if (load < 0.68) return "medium";
  return "heavy";
}

function parkingFromLoad(load: number, jitter: number): Parking {
  const score = clamp(load + 0.06 + (jitter - 0.5) * 0.24, 0, 1);
  if (score < 0.4) return "plenty";
  if (score < 0.66) return "partial";
  return "none";
}

function weightedPick<T extends string>(
  scores: Record<T, number>,
  order: readonly T[],
): T {
  let best = order[0];
  let bestScore = -1;
  for (const key of order) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      best = key;
    }
  }
  return best;
}

const CONGESTION_ORDER: readonly Congestion[] = ["free", "medium", "heavy"];
const PARKING_ORDER: readonly Parking[] = ["plenty", "partial", "none"];

/**
 * Fuse all reports into a single live state, applying exponential time decay so
 * older reports fade and the freshest signal dominates.
 */
export function effectiveState(
  branch: Branch,
  reports: Report[],
  now: number,
): LiveState {
  const recent = reports.filter((r) => now - r.at >= 0 && now - r.at <= FRESH_WINDOW_MS);

  if (recent.length === 0) {
    const load = loadScore(branch, new Date(now));
    return {
      congestion: congestionFromLoad(load),
      parking: parkingFromLoad(load, (hash(branch.id) % 100) / 100),
      lastReportAt: null,
      reportCount: 0,
      estimated: true,
    };
  }

  const congestionScores: Record<Congestion, number> = { free: 0, medium: 0, heavy: 0 };
  const parkingScores: Record<Parking, number> = { plenty: 0, partial: 0, none: 0 };
  let newest = 0;
  let weightSum = 0;

  for (const report of recent) {
    const ageMin = (now - report.at) / 60000;
    const weight = Math.pow(0.5, ageMin / 25); // half-life ≈ 25 minutes
    congestionScores[report.congestion] += weight;
    parkingScores[report.parking] += weight;
    weightSum += weight;
    if (report.at > newest) newest = report.at;
  }

  return {
    congestion: weightedPick(congestionScores, CONGESTION_ORDER),
    parking: weightedPick(parkingScores, PARKING_ORDER),
    lastReportAt: newest,
    reportCount: recent.length,
    estimated: weightSum < 0.75,
  };
}
