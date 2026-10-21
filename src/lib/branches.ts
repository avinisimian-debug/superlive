import { RAW_BRANCHES, CITY_NAMES } from "./branches.generated";
import { SCHEDULES, weeklyHours, type ScheduleProfile } from "./schedules";
import { CHAINS, type Branch, type BranchSize, type Chain } from "./types";
import { assessBranches, type BranchQuality } from "./data-quality";
import { BRANCH_HOURS, LOCATION_CHECKS } from "./branch-verification.generated";
import { isValidCoordinates } from "./navigation";

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

function publishedSchedule(id: string): Pick<Branch, "schedule" | "hoursSource" | "hoursSourceUrl"> {
  const entry = BRANCH_HOURS[id];
  if (!entry) return {};
  const [source, url, days] = entry;
  const schedule: ScheduleProfile = { label: "", days };
  schedule.label = weeklyHours(schedule)
    .map((row) => `${row.label} ${row.value}`)
    .join(" · ");
  return { schedule, hoursSource: source, hoursSourceUrl: url };
}

const ALL_BRANCHES: Branch[] = RAW_BRANCHES.map(([id, name, c, ci, addr, lat, lng, sch, size]) => {
  const published = publishedSchedule(id);
  return {
    id,
    name,
    chain: CHAINS[c],
    city: CITY_NAMES[ci],
    address: addr,
    lat,
    lng,
    scheduleIdx: sch,
    hours: published.schedule?.label ?? SCHEDULES[sch]?.label ?? "",
    size: SIZES[size] ?? "standard",
    wazeQuery: WAZE_QUERY_OVERRIDES[id],
    ...published,
    // Hours from the chain's own site (or a person) are this branch's real hours.
    hoursVerified: HUMAN_VERIFIED_IDS.has(id) || published.hoursSource === "chain",
  };
});

/** Location check result for every imported branch, keyed by id. */
export const BRANCH_QUALITY: Map<string, BranchQuality> = assessBranches(
  ALL_BRANCHES.map((b) => ({ ...b, anchor: !GENERIC_CHAINS.has(b.chain) })),
);

export type QuarantineReason =
  | "far-from-city"
  | "invalid-coordinates"
  | "unverifiable-generic"
  | "unconfirmed-location";

export interface QuarantinedBranch {
  branch: Branch;
  reason: QuarantineReason;
  offsetKm: number | null;
}

/**
 * Applies the cross-checked pin from branch-verification.generated.ts, or
 * returns why the branch must not be shown. A branch is only listed when an
 * independent source (the chain's locator, an OpenStreetMap shop of the same
 * chain, or its exact street address) puts the pin where Waze should drive.
 */
function checkedBranch(branch: Branch, q: BranchQuality | undefined): Branch | QuarantineReason {
  if (HUMAN_VERIFIED_IDS.has(branch.id)) {
    return { ...branch, locationTrust: "verified", locationSource: "human", hoursSource: "human" };
  }
  const check = LOCATION_CHECKS[branch.id];
  if (!check) {
    if (q?.trust === "suspect") return q.reason === "invalid-coordinates" ? "invalid-coordinates" : "far-from-city";
    if (q?.trust === "unverified" && GENERIC_CHAINS.has(branch.chain)) return "unverifiable-generic";
    return "unconfirmed-location";
  }
  const [lat, lng, source, city, name] = check;
  if (!isValidCoordinates(lat, lng)) return "invalid-coordinates";
  return {
    ...branch,
    lat,
    lng,
    // The verified settlement replaces the imported city label, which was often a street or neighbourhood.
    city: city ?? (q?.city && q.city !== "אזור אחר" ? q.city : branch.city),
    name: name ?? branch.name,
    locationTrust: "verified",
    locationSource: source,
  };
}

const visible: Branch[] = [];
/** Branches held back because Waze could lead to the wrong place. */
export const QUARANTINED_BRANCHES: QuarantinedBranch[] = [];

for (const branch of ALL_BRANCHES) {
  const q = BRANCH_QUALITY.get(branch.id);
  const checked = checkedBranch(branch, q);
  if (typeof checked === "string") {
    QUARANTINED_BRANCHES.push({ branch, reason: checked, offsetKm: q?.offsetKm ?? null });
    continue;
  }
  visible.push(checked);
}

/**
 * Nationwide directory of Israeli supermarket branches whose pin was
 * confirmed by an independent source (see branch-verification.generated.ts
 * and scripts/branch-verification). Everything else is held back.
 */
export const BRANCHES: Branch[] = visible;

export const NATIONWIDE_COUNT = BRANCHES.length;

/** Cities that actually contain listed branches, in Hebrew alphabetical order. */
export const CITIES: string[] = [...new Set(BRANCHES.map((b) => b.city))].sort((a, b) => a.localeCompare(b, "he"));

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
