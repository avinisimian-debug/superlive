"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  LogoMark,
  AndroidIcon,
  AppleIcon,
  ShareIcon,
  CheckIcon,
  WazeIcon,
  MapPinIcon,
  CartIcon,
  CarIcon,
  CloseIcon,
  ChevronDownIcon,
  QrIcon,
  DownloadIcon,
  SparkIcon,
} from "./icons";

const TOTAL_BRANCHES = "3,449";
const TOTAL_CITIES = "1,174";

const FEATURES: {
  emoji: string;
  title: string;
  body: string;
  icon: typeof CartIcon;
  tint: string;
}[] = [
  {
    emoji: "🛒",
    title: "עומס קופות וחניה בלייב",
    body: "מודל עומס חכם בשילוב דיווחי קהילה של אלפי קונים — אדום, צהוב או ירוק, לפני שיוצאים מהבית.",
    icon: CartIcon,
    tint: "from-emerald-500 to-teal-500",
  },
  {
    emoji: "📍",
    title: "3,449 סופרים ומכולות",
    body: "פריסה ארצית הרמטית בכל עיר, מושב וקיבוץ בישראל — מ־3,449 סניפים ב־1,174 יישובים.",
    icon: MapPinIcon,
    tint: "from-sky-500 to-indigo-500",
  },
  {
    emoji: "🚗",
    title: "ניווט ישיר ב-Waze",
    body: "לחיצה אחת ומנווטים ישר לחניה ולכניסה לסניף. בלי לחפש כתובות, בלי להסתבך.",
    icon: WazeIcon,
    tint: "from-violet-500 to-fuchsia-500",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "האם האפליקציה בחינם?",
    a: "כן, זרם חינמית לחלוטין — בלי מנוי, בלי פרסומות ובלי הרשמה. כל הדיווחים מגיעים מהקהילה ועוזרים לכולם.",
  },
  {
    q: "איך מתקינים באייפון?",
    a: "פותחים את זרם ב-Safari, מקישים על כפתור השיתוף ⬆️ בתחתית המסך ובוחרים ״הוסף למסך הבית״. האפליקציה תופיע כמו אפליקציה רגילה.",
  },
  {
    q: "איך מתקינים באנדרואיד?",
    a: "מורידים את קובץ ה-APK בלחיצה על כפתור האנדרואיד, ואם צריך מאשרים ״התקנה ממקורות לא ידועים״ בהגדרות הדפדפן. ההתקנה אורכת שנייה.",
  },
];

const PREVIEW_BRANCHES: {
  chain: string;
  name: string;
  status: "free" | "medium" | "heavy";
  label: string;
  dot: string;
  text: string;
  bg: string;
  parking: string;
}[] = [
  {
    chain: "שופרסל דיל",
    name: "שופרסל דיל מגדלי תל אביב",
    status: "free",
    label: "פנוי",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    parking: "חניה חלקית",
  },
  {
    chain: "שופרסל",
    name: "שופרסל דיל מודיעין",
    status: "medium",
    label: "בינוני",
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    parking: "חניה בשפע",
  },
  {
    chain: "רמי לוי",
    name: "רמי לוי מבשרת ציון",
    status: "free",
    label: "פנוי",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    parking: "חניה בשפע",
  },
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[290px] sm:w-[320px]">
      {/* glow */}
      <div
        aria-hidden="true"
        className="animate-aura absolute -inset-10 rounded-[4rem] bg-[radial-gradient(60%_60%_at_50%_40%,rgba(16,185,129,0.35),transparent_70%)] blur-2xl"
      />

      {/* floating chips */}
      <div className="animate-float absolute -right-4 top-16 z-20 hidden sm:block">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[0.72rem] font-bold text-emerald-700 shadow-float ring-1 ring-emerald-500/15">
          <span className="live-dot" aria-hidden="true" />
          פנוי עכשיו
        </span>
      </div>
      <div className="animate-float-slow absolute -left-5 bottom-24 z-20 hidden sm:block">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[0.72rem] font-bold text-slate-700 shadow-float ring-1 ring-slate-200">
          <WazeIcon className="h-4 w-4 text-sky-500" />
          ניווט ב-Waze
        </span>
      </div>

      {/* device */}
      <div className="relative rounded-[2.6rem] border border-slate-800/70 bg-slate-900 p-2.5 shadow-float">
        <div className="absolute left-1/2 top-2.5 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
        <div className="overflow-hidden rounded-[2.1rem] bg-[#f7f9fc]">
          {/* status bar */}
          <div className="flex items-center justify-between bg-emerald-600 px-4 pb-2 pt-3 text-[0.62rem] font-semibold text-emerald-50">
            <span>18:42</span>
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="h-2 w-3 rounded-[2px] bg-emerald-200/80" />
              <span className="h-2 w-3 rounded-[2px] bg-emerald-200/80" />
              <span className="h-2 w-4 rounded-[2px] bg-emerald-100" />
            </span>
          </div>

          {/* app header */}
          <div className="bg-emerald-600 px-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogoMark className="h-7 w-7" />
                <span className="text-[0.95rem] font-extrabold text-white">
                  זרם
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[0.6rem] font-bold text-white">
                <span className="live-dot" aria-hidden="true" />
                LIVE
              </span>
            </div>
            <p className="mt-3 text-[0.7rem] text-emerald-50/90">
              1,842 סניפים פנויים כעת · 1,174 יישובים
            </p>
            <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-[0.72rem] text-slate-400 shadow-sm">
              <MapPinIcon className="h-3.5 w-3.5" />
              חפשו סופר, עיר או סניף…
            </div>
          </div>

          {/* cards */}
          <div className="space-y-2.5 px-3 py-3">
            {PREVIEW_BRANCHES.map((b) => (
              <div
                key={b.name}
                className="rounded-2xl border border-slate-100 bg-white p-3 shadow-card"
              >
                <p className="text-[0.6rem] font-semibold text-slate-400">
                  {b.chain}
                </p>
                <h4 className="mt-0.5 truncate text-[0.82rem] font-bold text-slate-900">
                  {b.name}
                </h4>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full ${b.bg} px-2 py-1 text-[0.66rem] font-bold ${b.text}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${b.dot}`}
                      aria-hidden="true"
                    />
                    {b.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[0.64rem] font-medium text-slate-500">
                    <CarIcon className="h-3.5 w-3.5 text-slate-400" />
                    {b.parking}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* bottom bar */}
          <div className="flex items-center justify-around border-t border-slate-100 bg-white px-4 py-3 text-[0.58rem] font-semibold text-slate-400">
            <span className="flex flex-col items-center gap-1 text-emerald-600">
              <MapPinIcon className="h-4 w-4" />
              מפה
            </span>
            <span className="flex flex-col items-center gap-1">
              <CartIcon className="h-4 w-4" />
              סופרים
            </span>
            <span className="flex flex-col items-center gap-1">
              <ShareIcon className="h-4 w-4" />
              שיתוף
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition open:shadow-lift">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.02rem] font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDownIcon className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-500">{a}</p>
    </details>
  );
}

export function DownloadLanding() {
  const [iosOpen, setIosOpen] = useState(false);
  const [qrSvg, setQrSvg] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = `${window.location.origin}/download`;
    QRCode.toString(url, {
      type: "svg",
      margin: 1,
      width: 220,
      errorCorrectionLevel: "M",
      color: { dark: "#0b1220", light: "#ffffff" },
    })
      .then((svg) => {
        if (cancelled) return;
        setQrSvg(svg);
        setShareUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrSvg("");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!iosOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIosOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [iosOpen]);

  const handleShare = useCallback(async () => {
    const url = shareUrl || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "זרם",
          text: "לדעת מתי הסופר פנוי — עוד לפני שיוצאים מהבית.",
          url,
        });
        return;
      }
    } catch {
      /* user dismissed the share sheet */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [shareUrl]);

  return (
    <div className="landing min-h-dvh bg-white" data-testid="landing">
      {/* ambient background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-aura absolute -top-40 right-[-10%] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.18),transparent)]" />
        <div className="animate-float-slow absolute top-1/3 left-[-15%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.16),transparent)]" />
      </div>

      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link href="/download" className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="flex items-center gap-2 text-[1.2rem] font-extrabold tracking-tight text-slate-900">
              זרם<span className="live-dot" aria-hidden="true" />
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-[0.92rem] font-semibold text-slate-600 md:flex">
            <a className="transition hover:text-slate-900" href="#features">
              תכונות
            </a>
            <a className="transition hover:text-slate-900" href="#how">
              התקנה
            </a>
            <a className="transition hover:text-slate-900" href="#faq">
              שאלות
            </a>
            <Link
              className="transition hover:text-slate-900"
              href="/"
            >
              לאפליקציה
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center rounded-xl px-3 text-[0.88rem] font-bold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]"
            >
              התחברות
            </Link>
            <a
              href="#download"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-[0.88rem] font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
            >
              <DownloadIcon className="h-4 w-4" />
              הורדה
            </a>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative" data-testid="landing-hero">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="text-center lg:text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3.5 py-1.5 text-[0.78rem] font-bold text-emerald-700">
              <SparkIcon className="h-3.5 w-3.5" />
              עומסים בזמן אמת מ־3,449 סניפים
            </span>

            <h1 className="mt-5 text-[2.15rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-[3rem] lg:text-[3.4rem]">
              לדעת מתי הסופר פנוי —{" "}
              <span className="bg-gradient-to-l from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                עוד לפני שיוצאים מהבית
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-[1.05rem] leading-relaxed text-slate-500 lg:mx-0 lg:text-[1.15rem]">
              Zerem (זרם) — המעקב הקהילתי בזמן אמת לעומסי קופות וחניה
              בסופרמרקטים ובמכולות בישראל.
            </p>

            <div
              id="download"
              className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
            >
              <a
                href="/zerem.apk"
                download
                data-testid="download-android"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-500 px-6 text-[1.02rem] font-bold text-white shadow-glow transition hover:brightness-105 active:scale-[0.98]"
              >
                <AndroidIcon className="h-6 w-6" />
                הורדה ל-Android (APK ישיר)
              </a>

              <button
                type="button"
                onClick={() => setIosOpen(true)}
                data-testid="download-ios"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 text-[1.02rem] font-bold text-white shadow-lift transition hover:bg-slate-800 active:scale-[0.98]"
              >
                <AppleIcon className="h-6 w-6 -translate-y-px" />
                הורדה ל-iPhone (iOS)
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.85rem] font-medium text-slate-500 lg:justify-start">
              <Link
                href="/"
                data-testid="open-web"
                className="inline-flex items-center gap-1.5 font-bold text-emerald-700 underline-offset-4 hover:underline"
              >
                פתח באפליקציית Web ←
              </Link>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-500" />
                ללא הרשמה
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-500" />
                100% בחינם
              </span>
            </div>
          </div>

          <div className="relative">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* stats strip */}
      <section className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-200 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-2 py-7 shadow-card">
          {[
            { v: TOTAL_BRANCHES, l: "נקודות בישראל" },
            { v: TOTAL_CITIES, l: "יישובים" },
            { v: "100%", l: "בחינם" },
          ].map((s) => (
            <div key={s.l} className="px-2 text-center">
              <p className="text-[1.7rem] font-extrabold tracking-tight text-slate-900 sm:text-[2.1rem]">
                {s.v}
              </p>
              <p className="mt-1 text-[0.78rem] font-semibold text-slate-500 sm:text-[0.9rem]">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[0.82rem] font-bold uppercase tracking-[0.3em] text-emerald-600">
            מה מקבלים
          </p>
          <h2 className="mt-3 text-[1.9rem] font-extrabold tracking-tight text-slate-900 sm:text-[2.5rem]">
            כל מה שצריך כדי לצאת בזמן הנכון
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.tint} text-white shadow-glow`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-[1.15rem] font-bold text-slate-900">
                  <span className="me-2" aria-hidden="true">
                    {f.emoji}
                  </span>
                  {f.title}
                </h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-slate-500">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* QR / how to install */}
      <section id="how" className="relative overflow-hidden bg-slate-900 py-20 text-white lg:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="animate-aura absolute -right-24 -top-24 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.35),transparent)]" />
          <div className="absolute bottom-[-6rem] left-[-6rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.25),transparent)]" />
        </div>
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="text-[0.82rem] font-bold uppercase tracking-[0.3em] text-emerald-400">
              סרקו והתקינו
            </p>
            <h2 className="mt-3 text-[1.9rem] font-extrabold tracking-tight sm:text-[2.5rem]">
              יש לכם מחשב? סרקו כדי לפתוח בנייד
            </h2>
            <p className="mt-4 max-w-lg text-[1.02rem] leading-relaxed text-slate-300">
              כוונו את מצלמת הטלפון אל הקוד ופתחו את זרם ישירות במכשיר.
              באנדרואיד תורידו APK, ובאייפון תוסיפו למסך הבית בשתי הקשות.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <AndroidIcon className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-bold">אנדרואיד</p>
                  <p className="mt-1 text-[0.85rem] text-slate-300">
                    הורדת APK ישירה והתקנה בנגיעה.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <AppleIcon className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-bold">אייפון</p>
                  <p className="mt-1 text-[0.85rem] text-slate-300">
                    Safari ← שיתוף ← הוסף למסך הבית.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white p-7 text-center shadow-float">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <QrIcon className="h-6 w-6" />
              </div>
              <p className="mt-4 text-[1.05rem] font-bold text-slate-900">
                סרקו לפתיחה בנייד
              </p>
              <div
                data-testid="qr-code"
                className="mx-auto mt-4 flex h-[220px] w-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white"
              >
                {qrSvg ? (
                  <div
                    className="h-[200px] w-[200px]"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <span className="text-[0.8rem] text-slate-400">
                    מכין קוד QR…
                  </span>
                )}
              </div>
              <p className="mt-4 break-all font-mono text-[0.72rem] text-slate-400">
                {shareUrl || "/download"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="text-center">
          <p className="text-[0.82rem] font-bold uppercase tracking-[0.3em] text-emerald-600">
            שאלות נפוצות
          </p>
          <h2 className="mt-3 text-[1.9rem] font-extrabold tracking-tight text-slate-900 sm:text-[2.5rem]">
            כל מה שרציתם לדעת
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* final CTA */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-emerald-600 to-teal-500 px-8 py-14 text-center text-white shadow-glow sm:px-14">
          <div aria-hidden="true" className="animate-float absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <h2 className="relative text-[1.8rem] font-extrabold tracking-tight sm:text-[2.4rem]">
            מוכנים לדעת לפני שיוצאים?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-[1.02rem] text-emerald-50">
            הורידו את זרם בחינם והצטרפו לאלפי קונים שכבר חוסכים זמן
            ועצבים בכל קנייה.
          </p>
          <div className="relative mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <a
              href="/zerem.apk"
              download
              className="inline-flex min-h-13 items-center justify-center gap-2.5 rounded-2xl bg-white px-6 text-[1rem] font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 active:scale-[0.98]"
            >
              <AndroidIcon className="h-5 w-5" />
              הורדה לאנדרואיד
            </a>
            <button
              type="button"
              onClick={() => setIosOpen(true)}
              className="inline-flex min-h-13 items-center justify-center gap-2.5 rounded-2xl bg-slate-900 px-6 text-[1rem] font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              <AppleIcon className="h-5 w-5 -translate-y-px" />
              הורדה לאייפון
            </button>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <div className="leading-tight">
              <p className="font-extrabold text-slate-900">זרם</p>
              <p className="text-[0.72rem] font-semibold text-slate-400">
                Zerem
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.9rem] font-semibold text-slate-500">
            <a className="transition hover:text-slate-900" href="#features">
              תכונות
            </a>
            <a className="transition hover:text-slate-900" href="#faq">
              שאלות נפוצות
            </a>
            <Link className="transition hover:text-slate-900" href="/">
              פתח באפליקציה
            </Link>
          </nav>

          <button
            type="button"
            onClick={handleShare}
            data-testid="share"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[0.9rem] font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-[0.98]"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4 text-emerald-500" />
                הועתק!
              </>
            ) : (
              <>
                <ShareIcon className="h-4 w-4" />
                שיתוף
              </>
            )}
          </button>
        </div>
        <div className="border-t border-slate-200/70 px-5 py-5 text-center text-[0.8rem] text-slate-400 sm:px-8">
          © {2026} זרם · נבנה באהבה עבור הקהילה בישראל 🇮🇱
        </div>
      </footer>

      {/* iOS install modal */}
      {iosOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
          data-testid="ios-modal"
          onClick={() => setIosOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="התקנה באייפון"
            className="animate-pop relative w-full max-w-md rounded-3xl bg-white p-7 shadow-float"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIosOpen(false)}
              aria-label="סגור"
              className="absolute left-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            >
              <CloseIcon className="h-4.5 w-4.5" />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <AppleIcon className="h-6 w-6 -translate-y-px" />
            </div>
            <h3 className="mt-4 text-center text-[1.25rem] font-extrabold text-slate-900">
              התקנה באייפון
            </h3>
            <p className="mt-1.5 text-center text-[0.9rem] text-slate-500">
              שתי הקשות והאפליקציה על מסך הבית.
            </p>

            <ol className="mt-6 space-y-3">
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[0.85rem] font-bold text-white">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-900">פתחו ב-Safari</p>
                  <p className="mt-0.5 text-[0.86rem] text-slate-500">
                    הקישור חייב להיפתח בדפדפן Safari במכשיר.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[0.85rem] font-bold text-white">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-900">
                    הקישו שיתוף <span aria-hidden="true">⬆️</span> ואז ״הוסף
                    למסך הבית״
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[0.86rem] text-slate-500">
                    <ShareIcon className="h-4 w-4" />
                    הכפתור נמצא בתחתית המסך.
                  </p>
                </div>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setIosOpen(false)}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-900 text-[0.98rem] font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              הבנתי, תודה
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
