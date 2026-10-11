"use client";

import { useLive } from "@/lib/store";
import { CheckIcon } from "./icons";

export function Toast() {
  const { toast } = useLive();
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-[60] flex justify-center px-4"
    >
      <div className="animate-rise inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-[0.82rem] font-bold text-white shadow-float">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500">
          <CheckIcon className="h-4 w-4" />
        </span>
        {toast}
      </div>
    </div>
  );
}
