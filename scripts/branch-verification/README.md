# Branch verification

Builds `src/lib/branch-verification.generated.ts`: which branch pins are confirmed,
where they really are, and which branches have published opening hours.
The app lists only confirmed branches (see `checkedBranch` in `src/lib/branches.ts`).

Run `./run.sh` (python3 with `osmium` and `shapely`, plus node). Downloads and
intermediate files go to `work/` (git-ignored).

## Sources

| Source | Used for |
| --- | --- |
| OpenStreetMap extract for Israel + West Bank (openstreetmap.fr, daily) | chain shops, house numbers, streets, town boundaries, `opening_hours` |
| victory.co.il/branches | Victory pins and per-day hours |
| ampm.co.il/branches | am:pm hours |
| doralon.co.il/station | Dor Alon / Alonit pins |
| Nominatim | house numbers missing from the OSM index (cached, 1 request/s) |

Shufersal, Rami Levy, Carrefour/Yeinot Bitan, Tiv Taam, Osher Ad, Yochananof and
Hazi Hinam block requests from outside Israel, so they could not be read from a
cloud machine. Running `fetch.sh` from an Israeli connection and adding a parser in
`chains/` is the way to add them.

## How a pin is confirmed (`verify.py`)

A branch is listed only when one of these holds, checked in this order:

1. **chain**: the chain's own locator has this branch, and its pin is not
   contradicted by the branch's street address.
2. **osm**: an OpenStreetMap shop of the same chain is within 150 m of the pin and
   not contradicted by the branch's street address. For the generic grocery rows, the pin is itself an
   OSM shop, so only the town label and name are corrected.
3. **address**: the pin is within 250 m of the branch's exact house number.
4. Otherwise the pin is moved: to the single same-chain OSM shop on the branch's
   street in its town, or to its exact house number. The same address in two
   towns is ambiguous and is not moved.
5. **street**: the pin is on the branch's street (within 80 m) inside the right town.

Two branches of one chain with different addresses never share a pin: the one
whose address matches keeps it, the others are held back. Everything else is held
back rather than guessed (`npm run audit:branches` writes the list to CSV).

Hours come from the chain's site (`hoursVerified`), else from the matched OSM shop's
`opening_hours` (shown as "לפי OpenStreetMap"), else the chain-typical profile,
which the app labels as estimated. Friday and Saturday-night times published
relative to Shabbat are kept relative and resolved by `src/lib/shabbat.ts`.
