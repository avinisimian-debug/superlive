import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Passive crowd presence store.
 *
 * Each physical device near a branch is a key; its latest ping timestamp is
 * refreshed every time it reports, so a single device that stays put does not
 * inflate the count. Entries older than the active window are pruned, which
 * gives a live "how many devices are here right now" number per branch.
 */

/** How long a ping keeps a device counted as "present" (Waze-like). */
export const CROWD_ACTIVE_MS = 15 * 60 * 1000;

const DATA_DIR = path.join(process.cwd(), "data");
const CROWD_FILE = path.join(DATA_DIR, "crowd.json");

export interface CrowdDevice {
  at: number;
  lat: number;
  lng: number;
}

export type BranchCrowd = Record<string, CrowdDevice>;
type CrowdMap = Record<string, BranchCrowd>;

const memory = new Map<string, unknown>();

async function read(): Promise<CrowdMap> {
  try {
    const raw = await fs.readFile(CROWD_FILE, "utf8");
    return JSON.parse(raw) as CrowdMap;
  } catch {
    const cached = memory.get(CROWD_FILE);
    return cached === undefined ? {} : (cached as CrowdMap);
  }
}

async function write(value: CrowdMap): Promise<void> {
  memory.set(CROWD_FILE, value);
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(CROWD_FILE, JSON.stringify(value), "utf8");
  } catch {
    /* read-only FS — memory fallback already updated */
  }
}

export interface CrowdSnapshot {
  count: number;
  lastPingAt: number;
}

/** Records/refreshes a device ping and returns the branch's active crowd. */
export async function recordPing(
  branchId: string,
  deviceKey: string,
  lat: number,
  lng: number,
): Promise<CrowdSnapshot> {
  const all = await read();
  const branch = all[branchId] ?? {};
  branch[deviceKey] = { at: Date.now(), lat, lng };

  const cutoff = Date.now() - CROWD_ACTIVE_MS;
  let count = 0;
  let lastPingAt = 0;
  for (const key of Object.keys(branch)) {
    if (branch[key].at < cutoff) {
      delete branch[key];
    } else {
      count += 1;
      if (branch[key].at > lastPingAt) lastPingAt = branch[key].at;
    }
  }
  all[branchId] = branch;
  await write(all);
  return { count, lastPingAt };
}

/** Current active crowd for a branch (no mutation). */
export async function getCrowd(branchId: string): Promise<CrowdSnapshot> {
  const all = await read();
  const branch = all[branchId] ?? {};
  const cutoff = Date.now() - CROWD_ACTIVE_MS;
  const active = Object.values(branch).filter((d) => d.at >= cutoff);
  return {
    count: active.length,
    lastPingAt: active.reduce((max, d) => Math.max(max, d.at), 0),
  };
}