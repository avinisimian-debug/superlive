#!/usr/bin/env bash
# Downloads every source the verification uses into $ZEREM_WORK (default ./work).
set -euo pipefail
cd "$(dirname "$0")"
W="${ZEREM_WORK:-$PWD/work}"; mkdir -p "$W/chains"
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
# OpenStreetMap extract for Israel and the West Bank (refreshed daily by openstreetmap.fr)
curl -sSf -o "$W/ilps.pbf" https://download.openstreetmap.fr/extracts/asia/israel_and_palestine-latest.osm.pbf
# Chain store locators that publish per-branch pins / hours
curl -sSfL -A "$UA" -o "$W/chains/victory.html" https://victory.co.il/branches/
curl -sSfL -A "$UA" -o "$W/chains/ampm.html" https://www.ampm.co.il/branches
curl -sSfL -A "$UA" -o "$W/chains/doralon_st.html" https://www.doralon.co.il/station/
