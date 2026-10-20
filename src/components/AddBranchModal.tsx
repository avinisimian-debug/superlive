"use client";

import { useState } from "react";
import { useLive } from "@/lib/store";
import { CHAINS, type BranchSize, type Chain } from "@/lib/types";
import { CloseIcon, PlusIcon, BuildingIcon, MapPinIcon } from "./icons";

const TOP_CHAINS: Chain[] = [
  "מכולת שכונתית",
  "סופרמרקט שכונתי",
  "שופרסל שלי",
  "שופרסל דיל",
  "שופרסל אקספרס",
  "רמי לוי",
  "קרפור",
  "יוחננוף",
  "ויקטורי",
  "אושר עד",
  "חצי חינם",
  "טיב טעם",
  "am:pm",
  "סיטי מרקט",
  "זול ובגדול",
  "סופר יודה",
];

export function AddBranchModal({ onClose }: { onClose: () => void }) {
  const { addCustomBranch, showToast } = useLive();
  const [name, setName] = useState("");
  const [chain, setChain] = useState<Chain>("מכולת שכונתית");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [size, setSize] = useState<BranchSize>("standard");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !address.trim()) {
      showToast("נא למלא את כל השדות החובה");
      return;
    }

    setSubmitting(true);
    try {
      addCustomBranch({
        name: name.trim(),
        chain,
        city: city.trim(),
        address: address.trim(),
        size,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="הוספת סופרמרקט חדש"
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

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
            <PlusIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">הוספת סופר או מכולת</h2>
            <p className="text-xs font-semibold text-slate-500">
              הוספת סניף חדש ישירות למפת האפליקציה של Zerem
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              שם הסניף / מכולת <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="לדוגמה: מכולת האחים, שופרסל כיכר המדינה"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              רשת או סוג עסק <span className="text-rose-500">*</span>
            </label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value as Chain)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
            >
              {TOP_CHAINS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                עיר / יישוב <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="למשל: תל אביב, מודיעין"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                גודל סניף
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as BranchSize)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
              >
                <option value="express">אקספרס / מכולת קטנה</option>
                <option value="standard">סטנדרטי / סופר בינוני</option>
                <option value="hyper">היפר / סניף ענק</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              כתובת מדויקת <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="למשל: רחוב הרצל 42"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="rounded-2xl bg-sky-50 p-3 text-[0.72rem] text-sky-800 font-medium">
            💡 הסניף יתווסף מיד למפה, לרשימת המועדפים שלך, ויהיה זמין לניווט ישיר ב-Waze ולדיווחי עומס.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 text-xs font-black text-white shadow-md transition hover:bg-sky-600 active:scale-98 disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            {submitting ? "מוסיף סניף…" : "שמור והוסף סניף למפה"}
          </button>
        </form>
      </div>
    </div>
  );
}
