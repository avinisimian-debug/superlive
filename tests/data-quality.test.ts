import assert from "node:assert";
import { BRANCHES, QUARANTINED_BRANCHES, NATIONWIDE_COUNT } from "../src/lib/branches";
import { assessBranches, cityFromName, MAX_CITY_OFFSET_KM } from "../src/lib/data-quality";
import { getWazeNavigationUrl, isValidCoordinates } from "../src/lib/navigation";
import { isOpenAt, openStatus, scheduleOf, weeklyHours, type ScheduleProfile } from "../src/lib/schedules";
import { distanceKm } from "../src/lib/geo";
import { shabbatTimes } from "../src/lib/shabbat";

console.log("🧭 Zerem branch data-quality checks\n");

let passed = 0;
let failed = 0;

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${(err as Error).message}`);
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

it("known wrong pins are corrected (Eilat store pinned in Haifa, Eilat shop labelled Elad)", () => {
  const eilat = BRANCHES.find((b) => b.id === "b-0091");
  assert.ok(eilat, "b-0091 שופרסל שלי אילת should be listed at its real pin");
  assert.strictEqual(eilat.city, "אילת");
  assert.ok(distanceKm(eilat.lat, eilat.lng, 29.5598, 34.9506) < 0.2, `${eilat.lat},${eilat.lng}`);
  const elad = BRANCHES.find((b) => b.id === "b-1650");
  assert.ok(elad, "b-1650 is a real Eilat shop and should be listed there");
  assert.strictEqual(elad.city, "אילת");
  assert.ok(!elad.name.includes("אלעד"), elad.name);
});

it("every listed catalog branch has a confirmed pin with a named source", () => {
  const bad = BRANCHES.filter((b) => b.locationTrust !== "verified" || !b.locationSource);
  assert.deepStrictEqual(bad.map((b) => b.id), []);
});

it("pins that were kilometres off are moved to the store (Shufersal Sheli Haifa Horev)", () => {
  const b = BRANCHES.find((x) => x.id === "b-0132")!;
  assert.ok(distanceKm(b.lat, b.lng, 32.7844, 34.987) < 0.2, `${b.lat},${b.lng}`);
});

it("published hours come with their source page", () => {
  const withHours = BRANCHES.filter((b) => b.schedule);
  assert.ok(withHours.length > 300, `only ${withHours.length}`);
  for (const b of withHours) {
    assert.ok(b.hoursSource && b.hoursSourceUrl?.startsWith("https://"), b.id);
    assert.strictEqual(b.schedule!.days.length, 7, b.id);
  }
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
  const status = openStatus(scheduleOf(unverified), sundayNoon, true);
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

it("Victory Ofakim: Friday closes two hours before Shabbat, Saturday closed", () => {
  const b = BRANCHES.find((x) => x.id === "b-0001")!;
  assert.strictEqual(b.hoursSource, "chain");
  const rows = weeklyHours(scheduleOf(b));
  assert.ok(rows.some((r) => r.value.includes("שעתיים לפני כניסת שבת")), JSON.stringify(rows));
  // Friday 23 Oct 2026 (in Israel: sunset ~18:00, Shabbat ~17:40, closing ~15:40).
  const friday = new Date(2026, 9, 23);
  const closing = shabbatTimes(friday).entry - 120;
  const at = (m: number) => new Date(2026, 9, 23, Math.floor(m / 60), m % 60);
  assert.strictEqual(isOpenAt(scheduleOf(b), at(closing - 30)), true);
  assert.strictEqual(isOpenAt(scheduleOf(b), at(closing + 30)), false);
  assert.strictEqual(isOpenAt(scheduleOf(b), new Date(2026, 9, 24, 12, 0)), false);
});

it("hours past midnight stay open into the next day", () => {
  const late: ScheduleProfile = { label: "", days: Array.from({ length: 7 }, () => [[420, 1500]] as [number, number][]) };
  assert.strictEqual(isOpenAt(late, new Date(2026, 9, 20, 0, 30)), true);
  assert.strictEqual(isOpenAt(late, new Date(2026, 9, 20, 1, 30)), false);
  assert.ok(openStatus(late, new Date(2026, 9, 20, 0, 30)).text.includes("01:00"));
});

console.log(`\n${passed} passed, ${failed} failed · listed ${NATIONWIDE_COUNT}, held back ${QUARANTINED_BRANCHES.length}`);
if (failed > 0) process.exit(1);
