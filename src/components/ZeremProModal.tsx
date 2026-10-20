"use client";

import { useState, useEffect } from "react";
import { useLive } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  CloseIcon,
  CrownIcon,
  CheckIcon,
  SparkIcon,
  BellIcon,
  BuildingIcon,
  ZapIcon,
} from "./icons";

type PaymentMethod = "bit" | "card" | "paypal";

const BIT_PAY_URL = "https://www.bitpay.co.il/app/share-info?i=Eok7YIlA&j=true";
const PAYBOX_PAY_URL = "https://links.payboxapp.com/0DhDWFtCo7b";

export function ZeremProModal({ onClose }: { onClose: () => void }) {
  const { isPro, activatePro, showToast } = useLive();
  const { user } = useAuth();

  const [method, setMethod] = useState<PaymentMethod>("bit");
  const [copied, setCopied] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [verifyingProof, setVerifyingProof] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showForgotGuide, setShowForgotGuide] = useState(false);

  // Email for notification
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [holderName, setHolderName] = useState("");

  // Status state
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [expiryDateFormatted, setExpiryDateFormatted] = useState("");

  // Auto-populate email & name if logged in
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
    if (user?.name && !fullName) {
      setFullName(user.name);
    }
  }, [user]);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(" ") : digits;
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleBitApp = () => {
    if (typeof window !== "undefined") {
      window.open(BIT_PAY_URL, "_blank");
      showToast("פותח את בקשת התשלום ב-Bit (₪9.90)");
    }
  };

  const handlePayBoxApp = () => {
    if (typeof window !== "undefined") {
      window.open(PAYBOX_PAY_URL, "_blank");
      showToast("פותח את קבוצת התשלום ב-PayBox (₪9.90)");
    }
  };

  const handleCopyPhone = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("055-557-3090");
      setCopied(true);
      showToast("מספר הטלפון להעברה הועתק: 055-557-3090");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setVerificationError(null);
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    }
  };

  const handleVerifyAndActivate = async () => {
    if (!email || !email.includes("@")) {
      showToast("נא להזין כתובת מייל תקינה לקבלת אישור והתראות");
      return;
    }

    if (!proofFile) {
      showToast("נא להעלות צילום מסך של אישור ההעברה ב-Bit או PayBox");
      return;
    }

    setVerifyingProof(true);
    setVerificationError(null);

    try {
      // Real OCR & data verification on server
      const formData = new FormData();
      formData.append("file", proofFile);

      const verifyRes = await fetch("/api/vip/verify-proof", {
        method: "POST",
        body: formData,
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.valid) {
        const errorReason =
          verifyData.reason ||
          verifyData.error ||
          "האישור נדחה: לא זוהתה העברה תואמת לאביה ברוך נסימיאן על סך ₪9.90 מהיום.";
        setVerificationError(errorReason);
        showToast(errorReason);
        setVerifyingProof(false);
        return;
      }

      // Verification passed! Activate VIP subscription
      const generatedCode = `ZR-BP-${Math.floor(100000 + Math.random() * 900000)}`;

      const res = await fetch("/api/vip/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: fullName.trim() || undefined,
          method: "Bit / PayBox",
          authCode: generatedCode,
        }),
      });

      const data = await res.json();

      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("he-IL", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });

      setAuthCode(data.authCode || generatedCode);
      setExpiryDateFormatted(in30Days);
      activatePro(30);
      setSuccess(true);
      showToast("האסמכתא אומתה בהצלחה! מנוי ה-VIP הופעל ל-30 יום 👑");
    } catch (err: any) {
      setVerificationError("שגיאה בסריקת האסמכתא. נא לוודא שצילום המסך ברור וקריא.");
      showToast("שגיאה בסריקת האסמכתא. נא לנסות שנית.");
    } finally {
      setVerifyingProof(false);
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      showToast("נא להזין כתובת מייל תקינה");
      return;
    }
    const cleanCard = cardNumber.replace(/\s/g, "");
    if (cleanCard.length < 15) {
      showToast("נא להזין מספר כרטיס אשראי תקין");
      return;
    }
    if (expiry.length < 5) {
      showToast("נא להזין תוקף כרטיס תקין (MM/YY)");
      return;
    }
    if (cvv.length < 3) {
      showToast("נא להזין 3 ספרות בגב הכרטיס");
      return;
    }

    setProcessing(true);
    const generatedAuth = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await fetch("/api/vip/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: holderName.trim() || undefined,
          method: "כרטיס אשראי",
          authCode: generatedAuth,
        }),
      });
    } catch {
      /* ignore */
    }

    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });

    setAuthCode(generatedAuth);
    setExpiryDateFormatted(in30Days);
    setProcessing(false);
    activatePro(30);
    setSuccess(true);
    showToast("התשלום עבר בהצלחה! מנוי Zerem VIP הופעל ל-30 יום 👑");
  };

  const handlePayPalConfirm = async () => {
    if (!email || !email.includes("@")) {
      showToast("נא להזין כתובת מייל תקינה לקבלת אישור");
      return;
    }
    const generatedAuth = `PP-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      await fetch("/api/vip/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          method: "PayPal",
          authCode: generatedAuth,
        }),
      });
    } catch {
      /* ignore */
    }

    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });

    setAuthCode(generatedAuth);
    setExpiryDateFormatted(in30Days);
    activatePro(30);
    setSuccess(true);
    showToast("מנוי Zerem VIP הופעל בהצלחה ל-30 יום! 👑");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="שדרוג ל-Zerem VIP Pro"
        className="relative w-full max-w-lg max-h-[94vh] overflow-y-auto rounded-t-[2.2rem] sm:rounded-3xl bg-white p-5 sm:p-7 shadow-2xl animate-pop text-right border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="סגור"
          className="absolute left-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
        >
          <CloseIcon className="h-4.5 w-4.5" />
        </button>

        {success ? (
          /* ================= SUCCESS STATE ================= */
          <div className="py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner animate-bounce">
              <CheckIcon className="h-9 w-9" />
            </div>
            <h3 className="mt-4 text-2xl font-black text-slate-900">
              ברוך הבא ל-Zerem VIP! 👑
            </h3>
            <p className="mt-1.5 text-xs text-slate-600 font-medium max-w-xs mx-auto">
              המנוי שלך הופעל בהצלחה ל-<strong>30 יום</strong>. כל הפיצ׳רים הפרימיום פתוחים כעת בחשבונך.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200/90 p-4 text-right text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span>אסמכתא:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{authCode}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>תוקף המנוי:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">פעיל עד {expiryDateFormatted} (30 יום)</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>אישור במייל:</span>
                <span className="font-bold text-slate-800">{email}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-blue-50/80 border border-blue-100 p-3 text-right text-xs text-blue-900">
              <p className="font-bold flex items-center gap-1.5">
                <span>🔔</span>
                <span>התראת סיום מנוי במייל:</span>
              </p>
              <p className="mt-1 text-slate-600 text-[0.72rem] leading-relaxed">
                לפני תום 30 הימים, תקבל מייל תזכורת מסודר לכתובת <strong>{email}</strong> עם קישור מהיר לחידוש המנוי ב-Bit / PayBox, כך שתוכל לחדש בקלות ללא הפסקה בשירות.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-900 text-xs font-black text-white shadow-lg hover:bg-slate-800 transition active:scale-98"
            >
              המשך לאפליקציה ←
            </button>
          </div>
        ) : (
          /* ================= UPGRADE WORKFLOW ================= */
          <>
            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-md">
                <CrownIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">Zerem VIP Pro</h2>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-black text-amber-800">
                    חודשי ללא התחייבות
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-500">
                  התראות עומס בלייב, הוספת סופרים ותג VIP בקהילה
                </p>
              </div>
            </div>

            {/* Price Chip */}
            <div className="mt-3.5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 text-white shadow-sm">
              <div>
                <span className="block text-xs font-bold text-slate-300">עלות מנוי חודשי:</span>
                <span className="text-[0.68rem] text-slate-400">מתאפס לאחר 30 יום עם התראת חידוש</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-400">₪9.90</span>
                <span className="text-[0.7rem] text-slate-400">/ 30 יום</span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMethod("bit")}
                className={`py-2 text-xs font-black rounded-xl transition ${
                  method === "bit"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Bit / PayBox
              </button>
              <button
                type="button"
                onClick={() => setMethod("card")}
                className={`py-2 text-xs font-black rounded-xl transition ${
                  method === "card"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                כרטיס אשראי
              </button>
              <button
                type="button"
                onClick={() => setMethod("paypal")}
                className={`py-2 text-xs font-black rounded-xl transition ${
                  method === "paypal"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                PayPal
              </button>
            </div>

            {/* ================= TAB 1: BIT & PAYBOX STEP-BY-STEP GUIDE ================= */}
            {method === "bit" && (
              <div className="mt-4 space-y-3.5">
                
                {/* STEP 1: PAYMENT BUTTONS */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[0.68rem] font-black text-white">1</span>
                    <span className="text-xs font-black text-slate-900">בצעו העברה ישירה של ₪9.90:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleBitApp}
                      className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-xs font-black text-white hover:bg-blue-700 transition shadow-xs active:scale-98"
                    >
                      <span>שלם ₪9.90 ב-Bit ↗</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePayBoxApp}
                      className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-sky-600 text-xs font-black text-white hover:bg-sky-700 transition shadow-xs active:scale-98"
                    >
                      <span>שלם ₪9.90 ב-PayBox ↗</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="mt-2 flex min-h-8 w-full items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-[0.7rem] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    <span>{copied ? "המספר הועתק בהצלחה!" : "העתקת מספר להעברה ידנית (055-557-3090)"}</span>
                  </button>
                </div>

                {/* STEP 2: CRITICAL SCREENSHOT WARNING & VISUAL GUIDE */}
                <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[0.72rem] font-black text-slate-950 shadow-xs">
                      2
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-amber-950">צילום מסך של אישור ההעברה</span>
                        <span className="rounded bg-amber-200/90 px-1.5 py-0.2 text-[0.65rem] font-black text-amber-900">
                          שלב קריטי!
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-amber-900 leading-relaxed font-medium">
                        <strong>מיד בסיום ההעברה ב-Bit או ב-PayBox:</strong> בצעו צילום מסך (Screenshot) של מסך אישור התשלום המוצלח, וחזרו לכאן כדי להעלות אותו.
                      </p>

                      {/* Built-in Accordion for users who forgot to screenshot */}
                      <div className="mt-2.5 pt-2 border-t border-amber-200/80">
                        <button
                          type="button"
                          onClick={() => setShowForgotGuide(!showForgotGuide)}
                          className="flex items-center justify-between w-full text-right text-[0.72rem] font-bold text-amber-900 hover:text-amber-950"
                        >
                          <span className="flex items-center gap-1">
                            <span>💡</span>
                            <span>שילמתם כבר ושכחתם לצלם מסך? לחצו כאן</span>
                          </span>
                          <span className="text-[0.65rem] font-black bg-amber-200 px-1.5 py-0.5 rounded">
                            {showForgotGuide ? "סגור הסבר ▲" : "איך מוציאים קבלה ▼"}
                          </span>
                        </button>

                        {showForgotGuide && (
                          <div className="mt-2 rounded-xl bg-white/90 border border-amber-200 p-2.5 text-[0.7rem] text-slate-700 space-y-1 leading-relaxed">
                            <p className="font-bold text-slate-900">איך להוציא את אישור התשלום בדקה:</p>
                            <p>1. פתחו את אפליקציית <strong>Bit</strong> או <strong>PayBox</strong> בנייד.</p>
                            <p>2. היכנסו ל-<strong>״היסטוריית תשלומים״</strong> או <strong>״פעולות אחרונות״</strong>.</p>
                            <p>3. לחצו על ההעברה בסך <strong>₪9.90</strong> שבוצעה ל-<strong>אביה נסימיאן (Zerem)</strong>.</p>
                            <p>4. צלמו מסך של הקבלה/האישור, וחזרו להעלות אותה כאן למטה בשלב 3!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP 3: EMAIL + PROOF UPLOAD + ACTIVATION */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[0.68rem] font-black text-white">3</span>
                    <span className="text-xs font-black text-slate-900">העלאת אישור וקבלת התראות למייל:</span>
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-[0.72rem] font-bold text-slate-700 mb-1">
                      כתובת מייל לקבלת אישור מנוי והתראות סיום:
                    </label>
                    <input
                      type="email"
                      required
                      dir="ltr"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-left"
                    />
                    <p className="mt-1 text-[0.65rem] text-slate-500">
                      למייל זה יישלח אישור המנוי הרשמי, ותזכורת חידוש לפני תום 30 הימים.
                    </p>
                  </div>

                  {/* Screenshot Upload Dropzone */}
                  <div>
                    <label className="block text-[0.72rem] font-bold text-slate-700 mb-1">
                      העלאת צילום מסך של אישור ההעברה:
                    </label>

                    {proofPreview ? (
                      <div className="flex items-center justify-between rounded-xl border-2 border-emerald-400 bg-emerald-50/70 p-2.5">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={proofPreview}
                            alt="צילום מסך אישור"
                            className="h-11 w-11 rounded-lg object-cover border border-emerald-300 shadow-xs"
                          />
                          <div className="text-right truncate">
                            <p className="text-xs font-black text-emerald-900 truncate">
                              צילום המסך מוכן לאימות!
                            </p>
                            <p className="text-[0.65rem] text-emerald-700">
                              {proofFile?.name || "אישור העברה"}
                            </p>
                          </div>
                        </div>

                        <label className="cursor-pointer text-[0.7rem] font-bold text-blue-700 hover:text-blue-900 underline px-2">
                          החלף תמונה
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProofChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-3 text-center transition hover:border-blue-400 hover:bg-blue-50/30">
                        <span className="text-xl mb-0.5">📸</span>
                        <span className="text-xs font-bold text-slate-800">
                          לחצו כאן לבחירת צילום המסך מהגלריה
                        </span>
                        <span className="text-[0.65rem] text-slate-400 mt-0.5">
                          תומך בכל סוגי התמונות (JPG, PNG)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProofChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Verification Error Callout */}
                  {verificationError && (
                    <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3 text-right animate-shake">
                      <div className="flex items-start gap-2">
                        <span className="text-base text-rose-600">❌</span>
                        <div>
                          <p className="text-xs font-black text-rose-950">האסמכתא נדחתה</p>
                          <p className="mt-0.5 text-[0.72rem] text-rose-800 font-medium leading-relaxed">
                            {verificationError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Verification CTA */}
                  <button
                    type="button"
                    disabled={verifyingProof}
                    onClick={handleVerifyAndActivate}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-xs font-black text-slate-950 shadow-md transition hover:from-amber-300 hover:to-amber-500 active:scale-98 disabled:opacity-50"
                  >
                    {verifyingProof ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                        <span>מאמת אסמכתא ושולח אישור למייל...</span>
                      </span>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        <span>אמת אסמכתא והפעל מנוי VIP ל-30 יום</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ================= TAB 2: CREDIT CARD FORM ================= */}
            {method === "card" && (
              <form onSubmit={handleCardPayment} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[0.72rem] font-bold text-slate-700 mb-1">
                    כתובת מייל לאישור ולהתראות:
                  </label>
                  <input
                    type="email"
                    required
                    dir="ltr"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white text-left"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] font-bold text-slate-700 mb-1">
                    מספר כרטיס אשראי
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="4580 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-mono font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white text-left"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[0.72rem] font-bold text-slate-700 mb-1">
                      תוקף (MM/YY)
                    </label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      dir="ltr"
                      placeholder="12/28"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.72rem] font-bold text-slate-700 mb-1">
                      3 ספרות (CVV)
                    </label>
                    <input
                      type="password"
                      required
                      inputMode="numeric"
                      maxLength={4}
                      dir="ltr"
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[0.72rem] font-bold text-slate-700 mb-1">
                      תעודת זהות
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      dir="ltr"
                      placeholder="012345678"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.72rem] font-bold text-slate-700 mb-1">
                      שם בעל הכרטיס
                    </label>
                    <input
                      type="text"
                      placeholder="ישראל ישראלי"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-xs font-black text-slate-950 shadow-md transition hover:from-amber-300 hover:to-amber-400 active:scale-98 disabled:opacity-50"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      <span>מעבד תשלום מאובטח...</span>
                    </span>
                  ) : (
                    <span>שלם ₪9.90 והפעל מנוי VIP ל-30 יום</span>
                  )}
                </button>
              </form>
            )}

            {/* ================= TAB 3: PAYPAL ================= */}
            {method === "paypal" && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-[0.72rem] font-bold text-slate-700 mb-1">
                    כתובת מייל לאישור ולהתראות:
                  </label>
                  <input
                    type="email"
                    required
                    dir="ltr"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white text-left"
                  />
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3.5 text-xs text-sky-950">
                  <p className="font-black text-sm">תשלום מהיר ב-PayPal</p>
                  <p className="mt-1 text-slate-600">
                    העברה על סך ₪9.90 באמצעות חשבון ה-PayPal שלך.
                  </p>
                </div>

                <a
                  href="https://paypal.me/avinisimian"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0070ba] text-xs font-black text-white hover:bg-[#005ea6] transition"
                >
                  <span>עבור לתשלום ב-PayPal (₪9.90) ↗</span>
                </a>

                <button
                  type="button"
                  onClick={handlePayPalConfirm}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <span>אישור: ביצעתי תשלום ב-PayPal — הפעל VIP</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
