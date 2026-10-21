import assert from "node:assert";
import { BRANCHES, QUARANTINED_BRANCHES, NATIONWIDE_COUNT } from "../src/lib/branches";
import { assessBranches, cityFromName, MAX_CITY_OFFSET_KM } from "../src/lib/data-quality";
import { getWazeNavigationUrl, isValidCoordinates } from "../src/lib/navigation";
import { openStatus } from "../src/lib/schedules";

console.log("🧭 Zerem branch data-quality checks\n");

let passed = 0;
let failed = 0;

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

it("every listed branch has valid Israeli coordinates", () => {
  const bad = BRANCHES.filter((b) => !isValidCoordinates(b.lat, b.lng));
  assert.deepStrictEqual(bad.map((b) => b.id), []);
});

it("every listed branch navigates to a real Waze destination", () => {
  for (const b of BRANCHES) {
    const url = getWazeNavigationUrl(b);
    assert.ok(url.startsWith("https://www.waze.com/ul?"), `${b.id}: ${url}`);
    assert.ok(url.includes("navigate=yes"), `${b.id}: ${url}`);
    // Never mix a pin with a free-text search: Waze then ignores the pin.
    assert.ok(!(url.includes("ll=") && url.includes("q=")), `${b.id}: ${url}`);
  }
});

it("known wrong pins are held back (Eilat store pinned in Haifa, Elad store pinned in Eilat)", () => {
  const held = new Set(QUARANTINED_BRANCHES.map((q) => q.branch.id));
  assert.ok(held.has("b-0091"), "b-0091 שופרסל שלי אילת should be quarantined");
  assert.ok(held.has("b-1650"), "b-1650 אלעד should be quarantined");
  assert.ok(!BRANCHES.some((b) => b.id === "b-0091" || b.id === "b-1650"));
});

it("human-verified Mevo Horon branch stays listed with confirmed hours and its exact Waze query", () => {
  const b = BRANCHES.find((x) => x.id === "b-3449");
  assert.ok(b, "b-3449 must be listed");
  assert.strictEqual(b.hoursVerified, true);
  assert.strictEqual(b.locationTrust, "verified");
  assert.ok(getWazeNavigationUrl(b).includes(encodeURIComponent("צרכניית מבוא חורון")));
});

it("listed + quarantined accounts for every imported branch, ids unique", () => {
  const ids = new Set([...BRANCHES.map((b) => b.id), ...QUARANTINED_BRANCHES.map((q) => q.branch.id)]);
  assert.strictEqual(ids.size, NATIONWIDE_COUNT + QUARANTINED_BRANCHES.length);
});

it("branches with unverified hours never claim to be open as a fact", () => {
  const sundayNoon = new Date(2026, 9, 18, 12, 0);
  const unverified = BRANCHES.find((b) => !b.hoursVerified)!;
  const status = openStatus(unverified.scheduleIdx, sundayNoon, true);
  assert.ok(status.text.startsWith("כנראה"), status.text);
});

it("cityFromName reads the city out of a branch title", () => {
  const cities = new Set(["אשקלון", "באר שבע", "באר", "יקנעם"]);
  assert.strictEqual(cityFromName("ויקטורי - אשקלון (ברנע)", cities), "אשקלון");
  assert.strictEqual(cityFromName("ויקטורי - באר שבע", cities), "באר שבע");
  assert.strictEqual(cityFromName("שופרסל - יוקנעם", cities), "יקנעם");
  assert.strictEqual(cityFromName("am:pm", cities), null);
});

it("assessBranches flags a pin far from its city's branded stores", () => {
  const base = { anchor: true, city: "עיר" };
  const q = assessBranches([
    { ...base, id: "a", name: "רשת - עיר", lat: 32.08, lng: 34.78 },
    { ...base, id: "b", name: "רשת - עיר", lat: 32.081, lng: 34.781 },
    { ...base, id: "c", name: "רשת - עיר", lat: 32.079, lng: 34.779 },
    { ...base, id: "far", name: "רשת - עיר", lat: 29.55, lng: 34.95, anchor: false },
  ]);
  assert.strictEqual(q.get("a")!.trust, "consistent");
  assert.strictEqual(q.get("far")!.trust, "suspect");
  assert.ok(q.get("far")!.offsetKm! > MAX_CITY_OFFSET_KM);
});

console.log(`\n${passed} passed, ${failed} failed · listed ${NATIONWIDE_COUNT}, held back ${QUARANTINED_BRANCHES.length}`);
if (failed > 0) process.exit(1);
