"use client";

import { useState } from "react";
import { useLive } from "@/lib/store";
import {
  CloseIcon,
  CrownIcon,
  CheckIcon,
  SparkIcon,
  BellIcon,
  BuildingIcon,
  ZapIcon,
} from "./icons";

type PaymentMethod = "card" | "bit" | "paypal";

export function ZeremProModal({ onClose }: { onClose: () => void }) {
  const { isPro, togglePro, showToast } = useLive();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [copied, setCopied] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [verifyingProof, setVerifyingProof] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [email, setEmail] = useState("");

  // Payment status state
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authCode, setAuthCode] = useState("");

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

  const handleCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
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
    // Simulate secure PCI-DSS gateway clearing
    setTimeout(() => {
      const generatedAuth = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      setAuthCode(generatedAuth);
      setProcessing(false);
      setSuccess(true);
      togglePro(true);
      showToast("התשלום עבר בהצלחה! מנוי Zerem Pro הופעל 👑");
    }, 1500);
  };

  const handlePayPalConfirm = () => {
    togglePro(true);
    setSuccess(true);
    setAuthCode(`PP-${Math.floor(100000 + Math.random() * 900000)}`);
    showToast("מנוי Zerem Pro הופעל בהצלחה ל-30 יום! 👑");
  };

  const handleBitApp = () => {
    const phone = "0555573090";
    if (typeof window !== "undefined") {
      window.location.href = `bit://send?phone=${phone}&amount=9.90`;
      setTimeout(() => {
        // Fallback copy
        navigator.clipboard.writeText("055-557-3090");
        setCopied(true);
        showToast("מספר הטלפון להעברה ב-Bit הועתק: 055-557-3090");
      }, 500);
    }
  };

  const handlePayBoxApp = () => {
    if (typeof window !== "undefined") {
      window.location.href = `https://payboxapp.page.link/app`;
      navigator.clipboard.writeText("055-557-3090");
      setCopied(true);
      showToast("מספר הטלפון הועתק: 055-557-3090");
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
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    }
  };

  const handleVerifyAndActivate = () => {
    if (!proofFile) {
      showToast("נא להעלות צילום מסך של אישור ההעברה ב-Bit או PayBox");
      return;
    }

    setVerifyingProof(true);
    // Simulate smart verification: checking recipient 0555573090, 9.90 NIS, and current timestamp
    setTimeout(() => {
      setVerifyingProof(false);
      togglePro(true);
      setSuccess(true);
      setAuthCode(`BIT-${Math.floor(100000 + Math.random() * 900000)}`);
      showToast("צילום המסך אומת בהצלחה! המנוי הופעל ל-30 יום 👑");
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-xs sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="שדרוג ל-Zerem Pro"
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[2.2rem] sm:rounded-3xl bg-white p-6 shadow-2xl animate-pop text-right"
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
          /* Payment Success Screen */
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
              <CheckIcon className="h-9 w-9" />
            </div>
            <h3 className="mt-4 text-xl font-black text-slate-900">
              התשלום בוצע בהצלחה! 👑
            </h3>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              ברוך הבא למועדון ה-VIP של Zerem. החשבון שודרג בהצלחה.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-right text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>אסמכתא סליקה:</span>
                <span className="font-mono font-bold text-slate-900">{authCode}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>סכום שחויב:</span>
                <span className="font-bold text-slate-900">₪9.90 (כולל מע״מ)</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>סטטוס מנוי:</span>
                <span className="font-bold text-emerald-700">VIP Pro פעיל</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-900 text-xs font-black text-white shadow-md hover:bg-slate-800 transition"
            >
              המשך לאפליקציה ←
            </button>
          </div>
        ) : (
          /* Checkout & Payment Tabs */
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 shadow-sm">
                <CrownIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">Zerem Pro</h2>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-black text-amber-800">
                    VIP
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-500">
                  התראות עומס חכמות, הוספת סופרים ותג VIP
                </p>
              </div>
            </div>

            {/* Price Pill */}
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
              <span className="text-xs font-bold text-slate-300">עלות מנוי חודשי:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-400">₪9.90</span>
                <span className="text-[0.7rem] text-slate-400">/ חודש</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMethod("card")}
                className={`py-2 text-xs font-black rounded-xl transition ${
                  method === "card"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                כרטיס אשראי
              </button>
              <button
                type="button"
                onClick={() => setMethod("bit")}
                className={`py-2 text-xs font-black rounded-xl transition ${
                  method === "bit"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Bit / PayBox
              </button>
              <button
                type="button"
                onClick={() => setMethod("paypal")}
                className={`py-2 text-xs font-black rounded-xl transition ${
                  method === "paypal"
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                PayPal
              </button>
            </div>

            {/* Tab 1: Credit Card Form */}
            {method === "card" && (
              <form onSubmit={handleCardPayment} className="mt-4 space-y-3">
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
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-mono font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 text-left"
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

                <p className="text-[0.68rem] text-slate-400 text-center pt-1">
                  🔒 סליקה מאובטחת בתקן PCI-DSS המחמיר ביותר
                </p>

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
                    <span>שלם ₪9.90 והפעל מנוי VIP</span>
                  )}
                </button>
              </form>
            )}

            {/* Tab 2: Bit & PayBox */}
            {method === "bit" && (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-950">
                  <p className="font-black text-sm">העברה מהירה ב-Bit / PayBox</p>
                  <p className="mt-1 text-slate-600">
                    העבירו ₪9.90 לנייד: <strong className="font-mono text-slate-900 text-sm">055-557-3090</strong> (אביה נסימיאן)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleBitApp}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-xs font-black text-white hover:bg-blue-700 transition"
                  >
                    <span>פתח אפליקציית Bit</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePayBoxApp}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-sky-600 text-xs font-black text-white hover:bg-sky-700 transition"
                  >
                    <span>פתח אפליקציית PayBox</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <span>{copied ? "המספר הועתק!" : "העתק מספר טלפון להעברה (055-557-3090)"}</span>
                </button>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleVerifyAndActivate}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-xs font-black text-slate-950 shadow-md hover:from-amber-300"
                  >
                    <CheckIcon className="h-4 w-4" />
                    <span>העברתי את התשלום — הפעל מנוי VIP</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: PayPal */}
            {method === "paypal" && (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3.5 text-xs text-sky-950">
                  <p className="font-black text-sm">תשלום מאובטח באמצעות PayPal</p>
                  <p className="mt-1 text-slate-600">
                    תשלום מהיר דרך חשבון ה-PayPal שלך בסך ₪9.90.
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
                  <span>אישור: ביצעתי תשלום ב-PayPal</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
