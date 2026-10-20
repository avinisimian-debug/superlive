export interface ProofVerificationResult {
  valid: boolean;
  reason?: string;
  code?: "INVALID_RECIPIENT" | "INVALID_AMOUNT" | "EXPIRED_DATE" | "OCR_FAILED";
  extractedText?: string;
  recipient?: string;
  amount?: string;
}

export function parseAndVerifyProofText(rawText: string): ProofVerificationResult {
  const text = rawText.toLowerCase().replace(/[\u200e\u200f]/g, " ");

  // 1. Recipient check
  const hasAviya = text.includes("אביה") || text.includes("avinisimian") || text.includes("aviya");
  const hasNisimian =
    text.includes("נסימיאן") ||
    text.includes("ניסימיאן") ||
    text.includes("ברוך") ||
    text.includes("zerem") ||
    text.includes("זרם");
  const hasPhone =
    text.includes("0555573090") ||
    text.includes("055-557-3090") ||
    text.includes("555573090") ||
    text.includes("0555573") ||
    text.includes("5573090");

  const validRecipient = (hasAviya && hasNisimian) || hasPhone || (hasAviya && text.includes("אביה ברוך"));

  if (!validRecipient) {
    return {
      valid: false,
      code: "INVALID_RECIPIENT",
      reason: "האישור נדחה: הנמען בצילום המסך אינו אביה ברוך נסימיאן (Zerem). יש להעביר לנמען הנכון.",
      extractedText: rawText,
    };
  }

  // 2. Amount check: strictly 9.90 or 9.9
  const amountMatch = text.match(/(?:^|[^\d])(9[.,]90?)(?:[^\d]|$)/);
  if (!amountMatch) {
    return {
      valid: false,
      code: "INVALID_AMOUNT",
      reason: "האישור נדחה: הסכום בצילום המסך אינו 9.90 ₪. יש לבצע העברה על סך ₪9.90 בדיוק.",
      extractedText: rawText,
    };
  }

  // 3. Date check: must be recent (today/yesterday)
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const yearFull = String(now.getFullYear());
  const yearShort = yearFull.slice(-2);

  const freshDatePatterns = [
    `${day}/${month}`,
    `${day}.${month}`,
    `${day}-${month}`,
    `${day}/${month}/${yearFull}`,
    `${day}/${month}/${yearShort}`,
    `${day}.${month}.${yearFull}`,
    `${day}.${month}.${yearShort}`,
    "היום",
    "today",
  ];

  const hasFreshDate = freshDatePatterns.some((pattern) => text.includes(pattern));

  if (!hasFreshDate) {
    // Check if an explicit older date is present (e.g. 12/08/2026, 15/07, etc.)
    const foundOtherDates = text.match(/\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b/g);
    if (foundOtherDates && foundOtherDates.length > 0) {
      return {
        valid: false,
        code: "EXPIRED_DATE",
        reason: `האישור נדחה: תאריך ההעברה ישן ואינו מהיום (${day}/${month}/${yearFull}). יש להעלות צילום מסך של העברה שבוצעה היום.`,
        extractedText: rawText,
      };
    }
  }

  return {
    valid: true,
    recipient: "אביה ברוך נסימיאן (Zerem)",
    amount: "₪9.90",
    extractedText: rawText,
  };
}
