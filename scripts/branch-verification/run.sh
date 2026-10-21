#!/usr/bin/env bash
# Rebuilds src/lib/branch-verification.generated.ts. Needs python3 with `osmium` and `shapely`.
set -euo pipefail
cd "$(dirname "$0")"
W="${ZEREM_WORK:-$PWD/work}"; export ZEREM_WORK="$W/"
[ -f "$W/ilps.pbf" ] || ./fetch.sh
npx tsx dump-branches.ts > "$W/branches.json"
python3 extract.py "$W/ilps.pbf" "$W/osm_shops.json"
python3 places.py "$W/ilps.pbf" "$W/places.json"
python3 areas.py "$W/ilps.pbf" "$W/areas.json"
python3 addrindex.py "$W/ilps.pbf" "$W/addrindex.json"
for c in victory ampm doralon; do python3 "chains/$c.py"; done
python3 verify.py
# Nominatim fills in house numbers OSM's local index lacks (1 request/s; cached in work/).
python3 geocode2.py
python3 verify.py
python3 gen_ts.py ../../src/lib/branch-verification.generated.ts
