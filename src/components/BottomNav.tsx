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
      className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-nav"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2">
        {/* Tab 1: Feed */}
        <button
          type="button"
          onClick={() => onTabChange("feed")}
          className={`flex flex-col items-center gap-1 rounded-2xl px-5 py-1.5 transition active:scale-95 ${
            currentTab === "feed"
              ? "text-sky-600 font-black"
              : "text-slate-500 hover:text-slate-900 font-medium"
          }`}
        >
          <div className="relative">
            <ZapIcon className={`h-6 w-6 ${currentTab === "feed" ? "text-sky-500" : ""}`} />
            {currentTab === "feed" ? (
              <span className="absolute -bottom-1 inset-x-0 mx-auto h-1 w-4 rounded-full bg-sky-500" />
            ) : null}
          </div>
          <span className="text-[0.72rem] tracking-tight">מפת סופרים</span>
        </button>

        {/* Tab 2: Favorites */}
        <button
          type="button"
          onClick={() => onTabChange("favorites")}
          className={`relative flex flex-col items-center gap-1 rounded-2xl px-5 py-1.5 transition active:scale-95 ${
            currentTab === "favorites"
              ? "text-sky-600 font-black"
              : "text-slate-500 hover:text-slate-900 font-medium"
          }`}
        >
          <div className="relative">
            <StarIcon
              filled={currentTab === "favorites" || favorites.length > 0}
              className={`h-6 w-6 ${
                currentTab === "favorites"
                  ? "text-sky-500"
                  : favorites.length > 0
                    ? "text-amber-400"
                    : "text-slate-400"
              }`}
            />
            {favorites.length > 0 ? (
              <span className="absolute -top-1.5 -end-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.62rem] font-black text-white shadow-xs">
                {favorites.length}
              </span>
            ) : null}
            {currentTab === "favorites" ? (
              <span className="absolute -bottom-1 inset-x-0 mx-auto h-1 w-4 rounded-full bg-sky-500" />
            ) : null}
          </div>
          <span className="text-[0.72rem] tracking-tight">מועדפים</span>
        </button>

        {/* Tab 3: Personal Area / Settings */}
        <button
          type="button"
          onClick={() => onTabChange("profile")}
          className={`relative flex flex-col items-center gap-1 rounded-2xl px-5 py-1.5 transition active:scale-95 ${
            currentTab === "profile"
              ? "text-sky-600 font-black"
              : "text-slate-500 hover:text-slate-900 font-medium"
          }`}
        >
          <div className="relative">
            <UserIcon className={`h-6 w-6 ${currentTab === "profile" ? "text-sky-500" : ""}`} />
            {user ? (
              <span className="absolute top-0 end-0 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white" />
            ) : null}
            {currentTab === "profile" ? (
              <span className="absolute -bottom-1 inset-x-0 mx-auto h-1 w-4 rounded-full bg-sky-500" />
            ) : null}
          </div>
          <span className="text-[0.72rem] tracking-tight">אזור אישי</span>
        </button>
      </div>
    </nav>
  );
}
