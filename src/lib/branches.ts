import { RAW_BRANCHES, CITY_NAMES } from "./branches.generated";
import { SCHEDULES } from "./schedules";
import { CHAINS, type Branch, type BranchSize, type Chain } from "./types";

const SIZES: BranchSize[] = ["express", "standard", "hyper"];

/**
 * Exact Waze search strings for branches where the auto-generated
 * "name + address + city" query would not resolve to the right place.
 */
const WAZE_QUERY_OVERRIDES: Record<string, string> = {
  "b-0509": "רמי לוי ישפרו סנטר מודיעין",
};

/**
 * Nationwide directory of real Israeli supermarket branches. Coordinates and
 * names come from OpenStreetMap (Overpass API), deduplicated and normalised to
 * a clean Hebrew chain catalogue (see build_data.py).
 */
export const BRANCHES: Branch[] = RAW_BRANCHES.map(
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
  }),
);

export const NATIONWIDE_COUNT = BRANCHES.length;

/** Cities that actually contain branches, kept in the dataset's Hebrew order. */
export const CITIES: string[] = CITY_NAMES;

/** Pre-normalised search text per branch, aligned to `BRANCHES` by index. */
export const SEARCH_INDEX: string[] = BRANCHES.map((b) =>
  `${b.name} ${b.city} ${b.address} ${b.chain}`.toLowerCase(),
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
