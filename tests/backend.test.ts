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
    branchId: "b-0001",
    congestion: "super_crowded",
    parking: "plenty",
  });
  assert.strictEqual(res.valid, false);
  assert.match(res.error || "", /רמת עומס לא תקינה/);
});

it("rejects report with invalid parking status", () => {
  const res = validateReportInput({
    branchId: "b-0001",
    congestion: "medium",
    parking: "underground_vip",
  });
  assert.strictEqual(res.valid, false);
  assert.match(res.error || "", /מצב חניה לא תקין/);
});

it("accepts valid standard branch report", () => {
  const res = validateReportInput({
    branchId: "b-0001",
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
