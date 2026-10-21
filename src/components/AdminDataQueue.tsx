"use client";

import { useEffect, useState } from "react";

interface Summary {
  branchId: string;
  branchName: string;
  open: number;
  kinds: Record<"wrong-location" | "wrong-hours" | "closed" | "other", number>;
  lastAt: string;
  notes: string[];
}

interface QueueData {
  listed: number;
  quarantined: number;
  quarantineReasons: Record<string, number>;
  reports: Summary[];
}

const KIND_LABEL: Record<keyof Summary["kinds"], string> = {
  "wrong-location": "מיקום",
  "wrong-hours": "שעות",
  closed: "נסגר",
  other: "אחר",
};

const REASON_LABEL: Record<string, string> = {
  "far-from-city": "רחוק מהעיר שלו",
  "invalid-coordinates": "קואורדינטות לא תקינות",
  "unverifiable-generic": "מכולת ללא אימות מיקום",
};

/** Admin panel: listing health plus shopper reports of wrong locations/hours. */
export function AdminDataQueue() {
  const [data, setData] = useState<QueueData | null>(null);
  const [failed, setFailed] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/data-reports", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<QueueData>;
      })
      .then((json) => {
        if (active) setData(json);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const resolve = async (branchId: string) => {
    await fetch("/api/admin/data-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId }),
    });
    setReloadKey((k) => k + 1);
  };

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <h2 className="text-[1.02rem] font-bold text-slate-900">איכות נתוני סניפים</h2>
        {data && (
          <span className="text-[0.76rem] font-semibold text-slate-500">
            {data.listed.toLocaleString("en-US")} מוצגים · {data.quarantined.toLocaleString("en-US")} מוסתרים
          </span>
        )}
      </div>

      {failed && <p className="px-5 py-6 text-center text-[0.86rem] text-rose-600">טעינת הנתונים נכשלה.</p>}

      {data && (
        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.quarantineReasons).map(([reason, count]) => (
              <span key={reason} className="rounded-full bg-amber-50 px-3 py-1 text-[0.74rem] font-bold text-amber-800">
                {REASON_LABEL[reason] ?? reason}: {count}
              </span>
            ))}
          </div>

          {data.reports.length === 0 ? (
            <p className="py-6 text-center text-[0.86rem] text-slate-400">אין דיווחי טעות פתוחים.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.reports.map((r) => (
                <li key={r.branchId} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[0.88rem] font-bold text-slate-900">
                      {r.branchName} <span className="font-mono text-[0.7rem] text-slate-400">{r.branchId}</span>
                    </p>
                    <p className="mt-0.5 text-[0.74rem] text-slate-500">
                      {(Object.keys(r.kinds) as (keyof Summary["kinds"])[])
                        .filter((k) => r.kinds[k] > 0)
                        .map((k) => `${KIND_LABEL[k]} ×${r.kinds[k]}`)
                        .join(" · ")}
                    </p>
                    {r.notes.map((n, i) => (
                      <p key={i} className="mt-1 text-[0.78rem] text-slate-700">“{n}”</p>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => resolve(r.branchId)}
                    className="min-h-9 rounded-xl bg-slate-100 px-3 text-[0.76rem] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    טופל
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
