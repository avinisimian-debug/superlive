"use client";

import { useLive } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { ZapIcon, StarIcon, UserIcon } from "./icons";

export type AppTab = "feed" | "favorites" | "profile";

const TABS: { id: AppTab; label: string }[] = [
  { id: "feed", label: "סופרים" },
  { id: "favorites", label: "מועדפים" },
  { id: "profile", label: "אזור אישי" },
];

export function BottomNav({
  currentTab,
  onTabChange,
}: {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}) {
  const { favorites } = useLive();
  const { user } = useAuth();
  const index = TABS.findIndex((t) => t.id === currentTab);

  return (
    <nav
      aria-label="ניווט ראשי"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]"
    >
      <div className="pointer-events-auto relative grid w-full max-w-[22rem] grid-cols-3 rounded-[1.4rem] bg-ink-900/92 p-1.5 shadow-float ring-1 ring-white/10 backdrop-blur-xl">
        {/* Sliding active pill */}
        <span
          aria-hidden="true"
          className="bg-brand-gradient absolute inset-y-1.5 rounded-[1.05rem] shadow-glow transition-transform duration-500 ease-[var(--ease-spring)]"
          style={{
            right: 6,
            width: "calc((100% - 12px) / 3)",
            transform: `translateX(${-index * 100}%)`,
          }}
        />

        {TABS.map((tab) => {
          const active = tab.id === currentTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={active ? "page" : undefined}
              className={`relative z-10 flex h-12 items-center justify-center gap-1.5 rounded-[1.05rem] text-[0.78rem] font-bold transition-colors active:scale-95 ${
                active ? "text-white" : "text-white/55 hover:text-white/80"
              }`}
            >
              <span key={active ? `${tab.id}-on` : tab.id} className={`relative ${active ? "icon-bounce" : ""}`}>
                {tab.id === "feed" ? (
                  <ZapIcon className="h-5 w-5" />
                ) : tab.id === "favorites" ? (
                  <StarIcon filled={active} className="h-5 w-5" />
                ) : (
                  <UserIcon className="h-5 w-5" />
                )}
                {tab.id === "favorites" && favorites.length > 0 ? (
                  <span className="absolute -top-1.5 -end-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[0.58rem] font-black text-ink-950">
                    {favorites.length}
                  </span>
                ) : null}
                {tab.id === "profile" && user ? (
                  <span className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-ink-900" />
                ) : null}
              </span>
              <span className={active ? "" : "max-[360px]:hidden"}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
