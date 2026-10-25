"use client";

import { useLive } from "@/lib/store";
import type { Congestion } from "@/lib/types";
import { formatDistance } from "@/lib/geo";
import { LogoMark, NavigationIcon, MapPinIcon, ChevronDownIcon, SparkIcon } from "./icons";
import { AuthButton } from "./AuthButton";
import { ChainLogo } from "./ChainLogo";
import { CountUp, CrowdMeter, TONE } from "./ui";
import type { ListItem } from "./SupermarketList";

function greeting(hour: number): string {
  if (hour < 5) return "לילה טוב";
  if (hour < 12) return "בוקר טוב";
  if (hour < 17) return "צהריים טובים";
  if (hour < 21) return "ערב טוב";
  return "לילה טוב";
}

const SEGMENTS: Congestion[] = ["free", "medium", "heavy"];

export function Header({
  totalBranches,
  cityCount,
  pulse,
  city,
  now,
  firstName,
  suggestion,
  onOpenCity,
  onOpenBranch,
}: {
  totalBranches: number;
  cityCount: number;
  pulse: Record<Congestion, number>;
  city: string;
  now: number;
  firstName?: string | null;
  suggestion: ListItem | null;
  onOpenCity: () => void;
  onOpenBranch: (item: ListItem) => void;
}) {
  const { ready, locate, locating, usingGps, location } = useLive();
  const total = pulse.free + pulse.medium + pulse.heavy || 1;
  const hour = new Date(now).getHours();

  return (
    <>
    <header className={`hero ${suggestion ? "pb-14" : "pb-6"}`}>
      <span className="aurora aurora-a" aria-hidden="true" />
      <span className="aurora aurora-b" aria-hidden="true" />
      <span className="aurora aurora-c" aria-hidden="true" />
      <div className="radar" style={{ top: "3.2rem", left: "-2.6rem" }} aria-hidden="true">
        <i className="blip text-emerald-400" style={{ left: "68.0%", top: "28.6%", animationDelay: "0.50s" }} />
        <i className="blip text-emerald-400" style={{ left: "68.1%", top: "58.5%", animationDelay: "1.44s" }} />
        <i className="blip text-amber-400" style={{ left: "55.7%", top: "82.5%", animationDelay: "2.12s" }} />
        <i className="blip text-emerald-400" style={{ left: "30.3%", top: "63.8%", animationDelay: "2.94s" }} />
        <i className="blip text-rose-400" style={{ left: "20.6%", top: "33.0%", animationDelay: "3.75s" }} />
        <i className="blip text-emerald-400" style={{ left: "47.2%", top: "34.2%", animationDelay: "4.38s" }} />
      </div>

      <div className="px-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
        {/* Brand bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="bob h-10 w-10 rounded-[0.9rem] shadow-glow" />
            <div className="leading-none">
              <div className="flex items-center gap-2">
                <span className="text-[1.35rem] font-black tracking-tight">זרם</span>
                <span className="live-dot text-cyan-300" aria-hidden="true" />
              </div>
              <p className="mt-1 text-[0.66rem] font-semibold tracking-wide text-cyan-200/80">
                עומסים וחניה בסופר, בזמן אמת
              </p>
            </div>
          </div>
          <AuthButton tone="dark" />
        </div>

        {/* Greeting */}
        <div className="mt-7 animate-rise">
          <p className="text-sm font-semibold text-white/60">
            {ready ? `${greeting(hour)}${firstName ? `, ${firstName}` : ""}` : "\u00a0"}
          </p>
          <h1 className="mt-1 text-[1.9rem] font-black leading-[1.1] tracking-tight">
            איפה <span className="text-gradient">הכי פנוי</span>
            <br />
            עכשיו?
          </h1>
        </div>

        {/* Location + area */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="glass-dark press flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-right"
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                ready && usingGps ? "bg-brand-gradient shadow-glow" : "bg-white/10"
              }`}
            >
              <NavigationIcon className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.62rem] font-semibold text-white/50">המיקום שלי</span>
              <span className="block truncate text-[0.8rem] font-bold">
                {!ready ? "…" : locating ? "מאתר…" : usingGps ? "לפי GPS" : location.label.replace(" (ברירת מחדל)", "")}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCity}
            className="glass-dark press flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-right"
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                city !== "all" ? "bg-brand-gradient shadow-glow" : "bg-white/10"
              }`}
            >
              <MapPinIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.62rem] font-semibold text-white/50">אזור</span>
              <span className="block truncate text-[0.8rem] font-bold">
                {city === "all" ? "כל הארץ" : city}
              </span>
            </span>
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-white/40" />
          </button>
        </div>

        {/* Live pulse */}
        <div className="glass-dark mt-3 rounded-3xl p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-[0.72rem] font-bold text-white/70">
              <span className="live-dot text-emerald-400" aria-hidden="true" />
              הדופק של הסופרים עכשיו
            </p>
            <p className="text-[0.68rem] font-semibold text-white/45">
              <span className="tabular">{totalBranches.toLocaleString("he-IL")}</span> סניפים ·{" "}
              {cityCount} יישובים
            </p>
          </div>

          <div className="mt-3 flex h-2.5 gap-1 overflow-hidden rounded-full" aria-hidden="true">
            {SEGMENTS.map((key) => (
              <span
                key={key}
                className="flow h-full rounded-full transition-[flex-grow] duration-700"
                style={{
                  flexGrow: Math.max(pulse[key], total * 0.02),
                  background: TONE[key].color,
                }}
              />
            ))}
          </div>

          <dl className="mt-3 grid grid-cols-3 gap-2">
            {SEGMENTS.map((key) => (
              <div key={key}>
                <dt className="flex items-center gap-1.5 text-[0.66rem] font-semibold text-white/55">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: TONE[key].color }} />
                  {key === "free" ? "צפויים פנויים" : key === "medium" ? "עומס סביר" : "עמוסים"}
                </dt>
                <dd className="mt-0.5 text-lg font-black">
                  <CountUp value={pulse[key]} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

    </header>

      {/* Recommendation, floating over the hero's edge */}
      {suggestion ? (
        <div className="relative z-10 -mt-9 px-4">
          <div className="orbit-border rounded-3xl animate-rise">
            <button
              type="button"
              onClick={() => onOpenBranch(suggestion)}
              className="press flex w-full items-center gap-3 rounded-3xl bg-white p-3 text-right text-ink-900 shadow-lift"
            >
              <ChainLogo chain={suggestion.branch.chain} size="md" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[0.64rem] font-bold text-brand-700">
                  <SparkIcon className="h-3 w-3" />
                  ההמלצה שלנו עכשיו
                </span>
                <span className="block truncate text-[0.92rem] font-extrabold">
                  {suggestion.branch.name}
                </span>
                <span className="block truncate text-[0.7rem] font-medium text-slate-500">
                  {formatDistance(suggestion.distance)} ·{" "}
                  {suggestion.live.estimated ? "צפוי פנוי" : "פנוי לפי דיווח"}
                </span>
              </span>
              <CrowdMeter congestion={suggestion.live.congestion} live={!suggestion.live.estimated} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
