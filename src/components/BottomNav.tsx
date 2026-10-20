"use client";

import { useLive } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { ZapIcon, StarIcon, UserIcon } from "./icons";

export type AppTab = "feed" | "favorites" | "profile";

export function BottomNav({
  currentTab,
  onTabChange,
}: {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}) {
  const { favorites } = useLive();
  const { user } = useAuth();

  return (
    <nav
      aria-label="ניווט ראשי"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800/90 bg-slate-950/90 backdrop-blur-xl shadow-2xl"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2">
        {/* Tab 1: Feed */}
        <button
          type="button"
          onClick={() => onTabChange("feed")}
          className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 transition active:scale-95 ${
            currentTab === "feed"
              ? "text-cyan-400 font-black"
              : "text-slate-400 hover:text-slate-200 font-medium"
          }`}
        >
          <div className="relative">
            <ZapIcon className={`h-5 w-5 ${currentTab === "feed" ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" : ""}`} />
            {currentTab === "feed" ? (
              <span className="absolute -bottom-1 inset-x-0 mx-auto h-0.5 w-3 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            ) : null}
          </div>
          <span className="text-[0.74rem] tracking-tight">סופרים בלייב</span>
        </button>

        {/* Tab 2: Favorites */}
        <button
          type="button"
          onClick={() => onTabChange("favorites")}
          className={`relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 transition active:scale-95 ${
            currentTab === "favorites"
              ? "text-cyan-400 font-black"
              : "text-slate-400 hover:text-slate-200 font-medium"
          }`}
        >
          <div className="relative">
            <StarIcon
              filled={currentTab === "favorites" || favorites.length > 0}
              className={`h-5 w-5 ${
                currentTab === "favorites"
                  ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  : favorites.length > 0
                    ? "text-amber-400"
                    : "text-slate-500"
              }`}
            />
            {favorites.length > 0 ? (
              <span className="absolute -top-1.5 -end-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.62rem] font-black text-slate-950 shadow-sm">
                {favorites.length}
              </span>
            ) : null}
            {currentTab === "favorites" ? (
              <span className="absolute -bottom-1 inset-x-0 mx-auto h-0.5 w-3 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            ) : null}
          </div>
          <span className="text-[0.74rem] tracking-tight">מועדפים</span>
        </button>

        {/* Tab 3: Personal Area */}
        <button
          type="button"
          onClick={() => onTabChange("profile")}
          className={`relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 transition active:scale-95 ${
            currentTab === "profile"
              ? "text-cyan-400 font-black"
              : "text-slate-400 hover:text-slate-200 font-medium"
          }`}
        >
          <div className="relative">
            <UserIcon className={`h-5 w-5 ${currentTab === "profile" ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" : ""}`} />
            {user ? (
              <span className="absolute top-0 end-0 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-slate-950 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            ) : null}
            {currentTab === "profile" ? (
              <span className="absolute -bottom-1 inset-x-0 mx-auto h-0.5 w-3 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            ) : null}
          </div>
          <span className="text-[0.74rem] tracking-tight">אזור אישי</span>
        </button>
      </div>
    </nav>
  );
}
