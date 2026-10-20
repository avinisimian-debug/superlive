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

export function ZeremProModal({ onClose }: { onClose: () => void }) {
  const { isPro, togglePro, showToast } = useLive();
  const [copied, setCopied] = useState<string | null>(null);

  const handleActivatePro = () => {
    togglePro(true);
    showToast("ברכות! שודרגת בהצלחה ל-Zerem Pro 👑");
    onClose();
  };

  const handleBitTransfer = () => {
    // Bit / PayBox donation or payment intent
    const phone = "055-557-3090";
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopied("bit");
      showToast("מספר הטלפון להעברה ב-Bit הועתק: " + phone);
      setTimeout(() => setCopied(null), 3000);
    }
  };

  const handlePayPal = () => {
    window.open("https://paypal.me/avinisimian", "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="שדרוג ל-Zerem Pro"
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-pop text-right"
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

        {/* Header with Crown */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-900 shadow-sm">
            <CrownIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Zerem Pro</h2>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.66rem] font-black text-amber-800">
                VIP CLUB
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              מועדון הקונים החכמים של ישראל
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-2xs">
              <BellIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">התראות עומס חכמות בלייב</p>
              <p className="text-[0.72rem] text-slate-600 mt-0.5">
                התראה מיידית כשהסופר המועדף עליך פנוי מקופות ויש שפע חניה.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-2xs">
              <BuildingIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">הוספת סופרים ומכולות שכונתיות</p>
              <p className="text-[0.72rem] text-slate-600 mt-0.5">
                הוספת סניפים ומכולות חדשות ישירות למפת האפליקציה עם ניווט Waze.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-2xs">
              <SparkIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">תג VIP קהילתי + משקל דיווח כפול</p>
              <p className="text-[0.72rem] text-slate-600 mt-0.5">
                הדיווחים שלך מקבלים עדיפות באלגוריתם הקהילתי ותג זהב ייחודי.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white shadow-2xs">
              <ZapIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">גרף שעות שקטות מבוסס AI</p>
              <p className="text-[0.72rem] text-slate-600 mt-0.5">
                תחזית שעות פנויות בכל ימי השבוע כדי לחסוך עד 30 דקות בכל קנייה.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Pill */}
        <div className="mt-5 rounded-2xl bg-gradient-to-r from-slate-900 to-sky-950 p-4 text-white text-center shadow-md">
          <p className="text-xs font-medium text-sky-200">מחיר השקה מיוחד למצטרפים השבוע</p>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span className="text-3xl font-black text-amber-300">₪9.90</span>
            <span className="text-xs text-slate-300">/ לחודש בלבד</span>
          </div>
          <p className="mt-1 text-[0.72rem] text-slate-400">
            תמיכה בפיתוח עצמאי ישראלי · ללא התחייבות · ביטול בכל עת
          </p>
        </div>

        {/* Payment Buttons */}
        <div className="mt-4 space-y-2">
          {/* Instant Activation Button */}
          <button
            type="button"
            onClick={handleActivatePro}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 text-sm font-black text-white shadow-md transition hover:from-amber-600 hover:to-amber-700 active:scale-98"
          >
            <CrownIcon className="h-5 w-5" />
            {isPro ? "עדכן הגדרות Pro" : "הפעל מנוי Pro לניסיון מיידי"}
          </button>

          {/* Direct Bit Button */}
          <button
            type="button"
            onClick={handleBitTransfer}
            className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/70 px-4 text-xs font-bold text-blue-900 transition hover:bg-blue-100 active:scale-98"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[0.68rem] text-white font-black">
                Bit
              </span>
              <span>העברה מהירה ב-Bit / PayBox</span>
            </span>
            <span className="text-blue-700 font-extrabold">
              {copied === "bit" ? "הועתק!" : "העתק מספר"}
            </span>
          </button>

          {/* PayPal Button */}
          <button
            type="button"
            onClick={handlePayPal}
            className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-sky-200 bg-sky-50/70 px-4 text-xs font-bold text-sky-900 transition hover:bg-sky-100 active:scale-98"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-[0.68rem] text-white font-black">
                P
              </span>
              <span>תשלום מאובטח באמצעות PayPal</span>
            </span>
            <span className="text-sky-700 font-extrabold">פתח קישור ↗</span>
          </button>
        </div>
      </div>
    </div>
  );
}
