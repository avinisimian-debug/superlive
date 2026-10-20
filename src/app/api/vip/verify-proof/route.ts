import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { parseAndVerifyProofText } from "@/lib/verify-proof";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "לא נבחר קובץ לאימות" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Initialize worker with Hebrew and English
    const worker = await createWorker("heb+eng");
    const ret = await worker.recognize(buffer);
    await worker.terminate();

    const extractedText = ret.data.text || "";
    const verification = parseAndVerifyProofText(extractedText);

    if (!verification.valid) {
      return NextResponse.json({
        success: false,
        valid: false,
        reason: verification.reason,
        code: verification.code,
        extractedText: extractedText.slice(0, 300),
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      recipient: verification.recipient,
      amount: verification.amount,
      extractedText: extractedText.slice(0, 300),
    });
  } catch (err: any) {
    console.error("[verify-proof] Error:", err);
    return NextResponse.json(
      { success: false, error: "שגיאה בסריקת התמונה. נא לוודא שהתמונה ברורה." },
      { status: 500 }
    );
  }
}
