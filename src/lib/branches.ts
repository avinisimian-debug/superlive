import { RAW_BRANCHES, CITY_NAMES } from "./branches.generated";
import { SCHEDULES } from "./schedules";
import { CHAINS, type Branch, type BranchSize, type Chain } from "./types";
import { assessBranches, type BranchQuality } from "./data-quality";

const SIZES: BranchSize[] = ["express", "standard", "hyper"];

/**
 * Exact Waze search strings for branches where the auto-generated
 * "name + address + city" query would not resolve to the right place.
 */
const WAZE_QUERY_OVERRIDES: Record<string, string> = {
  "b-0509": "רמי לוי ישפרו סנטר מודיעין",
  "b-3449": "צרכניית מבוא חורון",
};

/**
 * Branches whose pin and opening hours were checked by a person against the
 * real store. They skip the automatic checks and show hours as confirmed.
 */
const HUMAN_VERIFIED_IDS = new Set<string>(["b-3449"]);

/**
 * Generic rows ("מכולת שכונתית", "סופרמרקט שכונתי") were imported from OSM
 * with unreliable names and city labels. They are only listed when their pin
 * matches the city they claim to be in.
 */
const GENERIC_CHAINS = new Set<Chain>(["מכולת שכונתית", "סופרמרקט שכונתי"]);

const ALL_BRANCHES: Branch[] = RAW_BRANCHES.map(
  ([id, name, c, ci, addr, lat, lng, sch, size]) => ({
    id,
    name,
    chain: CHAINS[c],
    city: CITY_NAMES[ci],
    address: addr,
    lat,
    lng,
    scheduleIdx: sch,
    hours: SCHEDULES[sch]?.label ?? "",
    size: SIZES[size] ?? "standard",
    wazeQuery: WAZE_QUERY_OVERRIDES[id],
    hoursVerified: HUMAN_VERIFIED_IDS.has(id),
  }),
);

/** Location check result for every imported branch, keyed by id. */
export const BRANCH_QUALITY: Map<string, BranchQuality> = assessBranches(
  ALL_BRANCHES.map((b) => ({ ...b, anchor: !GENERIC_CHAINS.has(b.chain) })),
);

export type QuarantineReason = "far-from-city" | "invalid-coordinates" | "unverifiable-generic";

export interface QuarantinedBranch {
  branch: Branch;
  reason: QuarantineReason;
  offsetKm: number | null;
}

/** Why a branch must not be shown or navigated to, or null when it is fine. */
function quarantineReason(branch: Branch, q: BranchQuality | undefined): QuarantineReason | null {
  if (HUMAN_VERIFIED_IDS.has(branch.id) || !q) return null;
  if (q.trust === "suspect") return q.reason === "invalid-coordinates" ? "invalid-coordinates" : "far-from-city";
  if (q.trust === "unverified" && GENERIC_CHAINS.has(branch.chain)) return "unverifiable-generic";
  return null;
}

const visible: Branch[] = [];
/** Branches held back because Waze would likely lead to the wrong place. */
export const QUARANTINED_BRANCHES: QuarantinedBranch[] = [];

for (const branch of ALL_BRANCHES) {
  const q = BRANCH_QUALITY.get(branch.id);
  const reason = quarantineReason(branch, q);
  if (reason) {
    QUARANTINED_BRANCHES.push({ branch, reason, offsetKm: q?.offsetKm ?? null });
    continue;
  }
  visible.push({
    ...branch,
    // The branch title is more reliable than the imported city field.
    city: q?.city && q.city !== "אזור אחר" ? q.city : branch.city,
    locationTrust: HUMAN_VERIFIED_IDS.has(branch.id)
      ? "verified"
      : q?.trust === "consistent"
        ? "consistent"
        : "unverified",
  });
}

/**
 * Nationwide directory of Israeli supermarket branches that passed the
 * location checks. Coordinates and names come from OpenStreetMap (Overpass
 * API); see data-quality.ts for what is held back and why.
 */
export const BRANCHES: Branch[] = visible;

export const NATIONWIDE_COUNT = BRANCHES.length;

/** Cities that actually contain listed branches, kept in the dataset's Hebrew order. */
const LISTED_CITIES = new Set(BRANCHES.map((b) => b.city));
export const CITIES: string[] = CITY_NAMES.filter((c) => LISTED_CITIES.has(c));

/** Pre-normalised search text per branch id. */
export const SEARCH_INDEX: Map<string, string> = new Map(
  BRANCHES.map((b) => [b.id, `${b.name} ${b.city} ${b.address} ${b.chain}`.toLowerCase()]),
);

/** Branch counts per chain across the whole country. */
export const CHAIN_TOTALS: Record<Chain, number> = CHAINS.reduce(
  (acc, chain) => {
    acc[chain] = 0;
    return acc;
  },
  {} as Record<Chain, number>,
);
for (const branch of BRANCHES) CHAIN_TOTALS[branch.chain] += 1;

/** Branch counts per city across the whole country. */
export const CITY_TOTALS: Record<string, number> = {};
for (const branch of BRANCHES) {
  CITY_TOTALS[branch.city] = (CITY_TOTALS[branch.city] ?? 0) + 1;
}
