/**
 * Branch data audit. Prints how many branches are listed vs held back and
 * writes every held-back branch to a CSV so it can be fixed by hand or
 * re-sourced. Usage: npm run audit:branches [-- out.csv]
 */
import { writeFileSync } from "node:fs";
import { BRANCHES, QUARANTINED_BRANCHES } from "../src/lib/branches";

const out = process.argv[2] ?? "branch-audit.csv";

const csvCell = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const rows = [
  ["id", "name", "chain", "city", "address", "lat", "lng", "reason", "offset_km", "google_maps"],
  ...QUARANTINED_BRANCHES.map(({ branch: b, reason, offsetKm }) => [
    b.id,
    b.name,
    b.chain,
    b.city,
    b.address,
    b.lat,
    b.lng,
    reason,
    offsetKm === null ? "" : offsetKm.toFixed(1),
    `https://www.google.com/maps?q=${b.lat},${b.lng}`,
  ]),
];
writeFileSync(out, "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\n"));

const byReason: Record<string, number> = {};
for (const q of QUARANTINED_BRANCHES) byReason[q.reason] = (byReason[q.reason] ?? 0) + 1;
const trust: Record<string, number> = {};
for (const b of BRANCHES) trust[b.locationTrust ?? "?"] = (trust[b.locationTrust ?? "?"] ?? 0) + 1;
const hoursVerified = BRANCHES.filter((b) => b.hoursVerified).length;

console.log(`Listed:      ${BRANCHES.length}`, trust);
console.log(`Held back:   ${QUARANTINED_BRANCHES.length}`, byReason);
console.log(`Hours confirmed for ${hoursVerified} of ${BRANCHES.length} listed branches`);
console.log(`Wrote ${out}`);
