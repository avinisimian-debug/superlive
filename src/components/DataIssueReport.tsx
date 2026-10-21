"use client";

import { useState } from "react";
import type { Branch } from "@/lib/types";

type Kind = "wrong-location" | "wrong-hours" | "closed" | "other";

const OPTIONS: { value: Kind; label: string }[] = [
  { value: "wrong-location", label: "המיקום / הניווט שגוי" },
  { value: "wrong-hours", label: "שעות הפתיחה שגויות" },
  { value: "closed", label: "הסניף נסגר" },
  { value: "other", label: "משהו אחר" },
];

/**
 * "Something's wrong here" form inside the branch sheet. Reports land in the
 * admin data queue so wrong pins and hours get fixed at the source.
 */
export function DataIssueReport({ branch }: { branch: Branch }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!kind) return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/data-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: branch.id, branchName: branch.name, kind, note }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error || "לא הצלחנו לשלוח. נסו שוב בעוד רגע.");
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setError("אין חיבור לרשת. נסו שוב בעוד רגע.");
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <p role="status" className="rounded-2xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800">
        תודה! נבדוק ונתקן את פרטי הסניף.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-1 text-center text-[0.72rem] font-bold text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
      >
        מצאת טעות בפרטי הסניף? דווח לנו
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
      <p className="text-xs font-black text-slate-800">מה לא נכון?</p>
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="סוג הטעות">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={kind === o.value}
            onClick={() => setKind(o.value)}
            className={`min-h-10 rounded-xl border px-2 text-[0.72rem] font-bold transition ${
              kind === o.value
                ? "border-sky-400 bg-sky-50 text-sky-900 ring-1 ring-sky-300"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="פרטים שיעזרו לנו (לא חובה), למשל: השעות הנכונות או הכתובת המדויקת"
        className="w-full resize-none rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
      />
      {error && <p className="text-[0.7rem] font-bold text-rose-700">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!kind || state === "sending"}
          onClick={submit}
          className="min-h-10 flex-1 rounded-xl bg-slate-900 text-xs font-black text-white transition disabled:opacity-40"
        >
          {state === "sending" ? "שולח..." : "שליחת דיווח"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-10 rounded-xl px-3 text-xs font-bold text-slate-500 hover:bg-slate-100"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}
