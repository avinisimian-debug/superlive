import assert from "node:assert";
import { validateReportInput, checkRateLimit, calculateLiveState } from "../src/lib/server/crowd-engine";
import { parseAndVerifyProofText } from "../src/lib/verify-proof";

console.log("🚀 Starting Zerem Backend Architecture & Crowd Engine Test Suite...\n");

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

// ================= TEST GROUP 1: REPORT VALIDATION =================
console.log("--- 1. Report Validation Tests ---");

it("rejects empty or null report payload", () => {
  const res1 = validateReportInput(null);
  assert.strictEqual(res1.valid, false);

  const res2 = validateReportInput({});
  assert.strictEqual(res2.valid, false);
});

it("rejects report with non-existent branch ID", () => {
  const res = validateReportInput({
    branchId: "b-invalid-999999",
    congestion: "free",
    parking: "plenty",
  });
  assert.strictEqual(res.valid, false);
  assert.match(res.error || "", /סניף לא נמצא/);
});

it("rejects report with invalid congestion level", () => {
  const res = validateReportInput({
    branchId: "b-0002",
    congestion: "super_crowded",
    parking: "plenty",
  });
  assert.strictEqual(res.valid, false);
  assert.match(res.error || "", /רמת עומס לא תקינה/);
});

it("rejects report with invalid parking status", () => {
  const res = validateReportInput({
    branchId: "b-0002",
    congestion: "medium",
    parking: "underground_vip",
  });
  assert.strictEqual(res.valid, false);
  assert.match(res.error || "", /מצב חניה לא תקין/);
});

it("accepts valid standard branch report", () => {
  const res = validateReportInput({
    branchId: "b-0002",
    congestion: "heavy",
    parking: "none",
    branchName: "שופרסל דיל",
  });
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.clean?.congestion, "heavy");
  assert.strictEqual(res.clean?.parking, "none");
});

it("accepts custom user branch report", () => {
  const res = validateReportInput({
    branchId: "custom-1729450000",
    congestion: "free",
    parking: "plenty",
    branchName: "מכולת שכונתית",
  });
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.clean?.branchId, "custom-1729450000");
});

// ================= TEST GROUP 2: RATE LIMITING =================
console.log("\n--- 2. Rate Limiting Tests ---");

it("allows first report and blocks immediate duplicate from same client", () => {
  const branch = "b-rate-test-1";
  const ip = "192.168.1.100";

  const first = checkRateLimit(branch, ip);
  assert.strictEqual(first, true, "First request should be allowed");

  const immediateDuplicate = checkRateLimit(branch, ip);
  assert.strictEqual(immediateDuplicate, false, "Immediate duplicate should be blocked");
});

it("allows different clients to report on same branch simultaneously", () => {
  const branch = "b-rate-test-2";
  const clientA = "10.0.0.1";
  const clientB = "10.0.0.2";

  assert.strictEqual(checkRateLimit(branch, clientA), true);
  assert.strictEqual(checkRateLimit(branch, clientB), true);
});

// ================= TEST GROUP 3: CROWD ENGINE TIME DECAY =================
console.log("\n--- 3. Crowd Level Decay & Aggregation Tests ---");

it("applies exponential time decay: fresh reports override older opposite reports", () => {
  const now = Date.now();

  const reports = [
    // 3 old reports saying "free" from 75 minutes ago
    { congestion: "free" as const, parking: "plenty" as const, at: now - 75 * 60 * 1000 },
    { congestion: "free" as const, parking: "plenty" as const, at: now - 70 * 60 * 1000 },
    { congestion: "free" as const, parking: "plenty" as const, at: now - 65 * 60 * 1000 },
    // 1 very fresh report saying "heavy" from 2 minutes ago
    { congestion: "heavy" as const, parking: "none" as const, at: now - 2 * 60 * 1000 },
  ];

  const state = calculateLiveState(reports);
  assert.strictEqual(state.congestion, "heavy", "Fresh heavy report should dominate decayed free reports");
  assert.strictEqual(state.parking, "none");
  assert.strictEqual(state.reportCount, 4);
});

// ================= TEST GROUP 4: PROOF OCR VERIFICATION =================
console.log("\n--- 4. Proof OCR Parser Tests ---");

it("rejects proof with wrong recipient (e.g. transfer to someone else)", () => {
  const fakeText = "אישור העברה ב-Bit לנמען ישראל ישראלי סכום 20.00 שח תאריך 20/10/2026";
  const res = parseAndVerifyProofText(fakeText);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.code, "INVALID_RECIPIENT");
});

it("rejects proof with wrong amount (e.g. 20 NIS instead of 9.90 NIS)", () => {
  const wrongAmount = "אישור תשלום Bit לכבוד אביה ברוך נסימיאן סכום 20.00 שח תאריך 20/10/2026";
  const res = parseAndVerifyProofText(wrongAmount);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.code, "INVALID_AMOUNT");
});

it("rejects proof with stale / expired date", () => {
  const staleDate = "אישור תשלום Bit לכבוד אביה ברוך נסימיאן סכום 9.90 שח תאריך 15/07/2025";
  const res = parseAndVerifyProofText(staleDate);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.code, "EXPIRED_DATE");
});

it("accepts valid fresh transfer to Aviya Nisimian for 9.90 NIS", () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  const validText = `העברת כספים ב-Bit\nלכבוד: אביה ברוך נסימיאן (Zerem)\nסכום: 9.90 ש"ח\nתאריך: ${day}/${month}/${year} 21:30`;
  const res = parseAndVerifyProofText(validText);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.amount, "₪9.90");
});

console.log(`\n========================================`);
console.log(`Test Results: ${passed} passed, ${failed} failed.`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

// ================= TEST GROUP 5: NAVIGATION & GPS ACCURACY =================
import { isValidCoordinates, getWazeNavigationUrl } from "../src/lib/navigation";

console.log("\n--- 5. Navigation & GPS Accuracy Tests ---");

it("validates Israeli geographic boundaries correctly", () => {
  assert.strictEqual(isValidCoordinates(32.0853, 34.7818), true, "Tel Aviv should be valid");
  assert.strictEqual(isValidCoordinates(31.7683, 35.2137), true, "Jerusalem should be valid");
  assert.strictEqual(isValidCoordinates(29.5581, 34.9482), true, "Eilat should be valid");
  assert.strictEqual(isValidCoordinates(33.2073, 35.5694), true, "Kiryat Shmona should be valid");

  // Out of bounds
  assert.strictEqual(isValidCoordinates(40.7128, -74.0060), false, "New York should be invalid");
  assert.strictEqual(isValidCoordinates(0, 0), false, "Null island should be invalid");
  assert.strictEqual(isValidCoordinates(NaN, 34.78), false, "NaN should be invalid");
});

it("generates exact coordinates Waze URL without search text override", () => {
  const branch = {
    id: "b-0001",
    name: "סופרמרקט",
    chain: "שופרסל שלי" as const,
    city: "חיפה",
    address: "העצמאות 40",
    lat: 32.8191,
    lng: 34.9983,
    scheduleIdx: 0,
    hours: "08:00–21:00",
    size: "standard" as const,
  };

  const url = getWazeNavigationUrl(branch);
  assert.strictEqual(url, "https://www.waze.com/ul?ll=32.8191%2C34.9983&navigate=yes");
  assert.strictEqual(url.includes("&q="), false, "URL must NOT include &q= parameter which overrides coordinates in Waze");
});

it("respects explicit wazeQuery overrides when provided", () => {
  const branchWithOverride = {
    id: "b-0509",
    name: "ישפרו סנטר",
    chain: "רמי לוי" as const,
    city: "מודיעין",
    address: "המלאכות 1",
    lat: 31.8900,
    lng: 34.9600,
    scheduleIdx: 0,
    hours: "08:00–21:00",
    size: "hyper" as const,
    wazeQuery: "רמי לוי ישפרו סנטר מודיעין",
  };

  const url = getWazeNavigationUrl(branchWithOverride);
  assert.match(url, /q=%D7%A8%D7%9E%D7%99%20%D7%9C%D7%95%D7%99/, "Should use explicit wazeQuery override");
});
