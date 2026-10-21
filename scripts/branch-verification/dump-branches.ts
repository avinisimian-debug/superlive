/** Dumps the imported branch rows as JSON for the verification pipeline. */
import { RAW_BRANCHES, CITY_NAMES } from "../../src/lib/branches.generated";
import { CHAINS } from "../../src/lib/types";

const out = RAW_BRANCHES.map(([id, name, c, ci, addr, lat, lng, sch, size]) => ({
  id,
  name,
  chain: CHAINS[c],
  city: CITY_NAMES[ci],
  addr,
  lat,
  lng,
  sch,
  size,
}));
console.log(JSON.stringify(out));
