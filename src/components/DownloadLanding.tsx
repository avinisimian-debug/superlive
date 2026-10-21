"use client";

import { ChainLogo } from "./ChainLogo";

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
  CrownIcon,
  BellIcon,
  BuildingIcon,
  ZapIcon,
  StarIcon,
} from "./icons";
import { ZeremProModal } from "./ZeremProModal";

const TOTAL_BRANCHES = "3,449";
const TOTAL_CITIES = "1,174";

const FEATURES: {
  title: string;
  body: string;
  icon: typeof CartIcon;
  tint: string;
}[] = [
  {
    title: "עומס קופות וחניה בלייב",
    body: "אלגוריתם חכם מבוסס דיווחי קהילה של אלפי קונים בישראל — ירוק, צהוב או אדום עוד לפני שיוצאים מהבית.",
    icon: CartIcon,
    tint: "from-sky-500 to-cyan-500",
  },
  {
    title: "ניווט Waze ישיר לחניה",
    body: "לחיצה אחת ומנווטים ישירות לחניה ולכניסה לסניף בלי לחפש כתובות ובלי להסתבך בכבישים ללא שם.",
    icon: WazeIcon,
    tint: "from-blue-600 to-indigo-600",
  },
  {
    title: "גרף שעות שקטות AI",
    body: "תחזית שעות פנויות בכל שעות היממה וימי השבוע — מתי הכי מומלץ להגיע כדי לעבור תוך דקות.",
    icon: ZapIcon,
    tint: "from-amber-500 to-orange-500",
  },
  {
    title: "3,449 סופרים ומכולות",
    body: "כיסוי ארצי הרמטי בכל עיר, מושב וקיבוץ בישראל — שופרסל, רמי לוי, יוחננוף, אושר עד, קרפור ומכולות שכונתיות.",
    icon: MapPinIcon,
    tint: "from-emerald-500 to-teal-500",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "האם האפליקציה בחינם?",
    a: "כן! השימוש הבסיסי ב-Zerem הוא חינם לחלוטין לכלל הציבור בישראל — חיפוש סופרים, צפייה בעומסים, ניווט Waze ודיווחי קהילה.",
  },
  {
    q: "מה זה Zerem Pro ואיך מצטרפים?",
    a: "מועדון ה-VIP של Zerem מאפשר לקבל התראות עומס חכמות בסניפים המועדפים עליך, להוסיף סופרים ומכולות חדשות ישירות למפה, ולקבל תג VIP קהילתי. ההצטרפות היא בעלות סמלית של ₪9.90 לחודש בלבד, דרך Bit, PayBox או PayPal.",
  },
  {
    q: "איך מתקינים באייפון (iOS)?",
    a: "פותחים את האפליקציה בדפדפן Safari, מקישים על כפתור השיתוף (אייקון ריבוע עם חץ למעלה ⬆️) ובוחרים 'הוסף למסך הבית'. האפליקציה מותקנת מיד ללא צורך ב-App Store.",
  },
  {
    q: "איך מתקינים באנדרואיד?",
    a: "מורידים ישירות את קובץ ה-APK מהאתר ומתקינים אותו בקליק. ניתן גם להוסיף את האפליקציה למסך הבית דרך דפדפן Chrome.",
  },
  {
    q: "איך נקבע העומס בסניף?",
    a: "העומס מחושב בשילוב של דיווחי קונים בלייב מהשטח יחד עם מודל חכם הלומד את דפוסי הקניות, שעות הפעילות וגודל הסניף.",
  },
];

interface SimBranch {
  name: string;
  chain: string;
  city: string;
  status: "free" | "medium" | "heavy";
  label: string;
  dot: string;
  text: string;
  bg: string;
  parking: string;
  quietHour: string;
  wazeHref: string;
}

const SIMULATOR_BRANCHES: SimBranch[] = [
  {
    name: "שופרסל דיל מגדלי תל אביב",
    chain: "שופרסל דיל",
    city: "תל אביב",
    status: "free",
    label: "פנוי לחלוטין",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    parking: "חניה בשפע",
    quietHour: "14:00 - 16:30",
    wazeHref: "https://www.waze.com/ul?q=שופרסל+דיל+מגדלי+תל+אביב&navigate=yes",
  },
  {
    name: "רמי לוי ישפרו סנטר",
    chain: "רמי לוי",
    city: "מודיעין",
    status: "medium",
    label: "עומס בינוני",
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    parking: "חניה חלקית",
    quietHour: "12:30 - 15:00",
    wazeHref: "https://www.waze.com/ul?q=רמי+לוי+ישפרו+סנטר+מודיעין&navigate=yes",
  },
  {
    name: "יוחננוף מתחם כורזים",
    chain: "יוחננוף",
    city: "גבעתיים",
    status: "free",
    label: "פנוי",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    parking: "חניה זמינה",
    quietHour: "13:00 - 15:30",
    wazeHref: "https://www.waze.com/ul?q=יוחננוף+כורזים+גבעתיים&navigate=yes",
  },
  {
    name: "אושר עד קניון הדר",
    chain: "אושר עד",
    city: "ירושלים",
    status: "heavy",
    label: "עמוס בקופות",
    dot: "bg-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-50",
    parking: "חניה מלאה",
    quietHour: "21:00 - 23:00",
    wazeHref: "https://www.waze.com/ul?q=אושר+עד+קניון+הדר+ירושלים&navigate=yes",
  },
];

const TESTIMONIALS = [
  {
    quote: "סוף סוף מישהו פתר את התורים של יום חמישי בערב. אני פותח את Zerem, רואה מתי פנוי ומגיע בלי לחכות שנייה.",
    author: "אלון מזרחי",
    city: "מודיעין",
    saved: "חיסכון של 45 דק׳",
  },
  {
    quote: "החיבור הישיר ל-Waze גאוני. לוחצים על הסניף, Waze פותח ישר את החניה הנכונה ולא שולח אותך לחפש כתובות.",
    author: "מאיה לוין",
    city: "תל אביב",
    saved: "חוסך עצבים בחניה",
  },
  {
    quote: "שדרגתי ל-Pro והוספתי את המכולת השכונתית שלנו ליד הבית. עכשיו כל השכונה בודקת לפני שיוצאים לקניות.",
    author: "רונן כהן",
    city: "חיפה",
    saved: "משתמש VIP Pro",
  },
];

export function DownloadLanding() {
  const [iosOpen, setIosOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [selectedSim, setSelectedSim] = useState(0);
  const [qrSvg, setQrSvg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = typeof window !== "undefined" ? window.location.origin : "https://zerem.app";
    QRCode.toString(url, {
      type: "svg",
      margin: 1,
      width: 180,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = "לדעת מתי הסופר פנוי עוד לפני שיוצאים מהבית — Zerem (זרם)";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Zerem", text, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled
    }
  }, []);

  const currentSim = SIMULATOR_BRANCHES[selectedSim];

  return (
    <div className="min-h-dvh bg-[#f8fafc] text-slate-800 antialiased selection:bg-sky-500 selection:text-white" dir="rtl">
      {/* Top Brand Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-sky-950 to-slate-950 px-4 py-2 text-center text-xs font-bold text-sky-200">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>עכשיו באוויר: מעקב עומסים חי ב-3,449 סופרמרקטים ומכולות בישראל</span>
        </span>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9 rounded-2xl shadow-xs" />
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                זרם
              </span>
              <span className="text-[0.62rem] block font-black text-sky-600 tracking-wider">
                ZEREM LIVE
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#simulator" className="transition hover:text-sky-600">סימולטור עומס</a>
            <a href="#features" className="transition hover:text-sky-600">יתרונות</a>
            <a href="#pricing" className="transition hover:text-sky-600">Zerem Pro</a>
            <a href="#testimonials" className="transition hover:text-sky-600">המלצות</a>
            <a href="#faq" className="transition hover:text-sky-600">שאלות נפוצות</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setProModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-black text-amber-800 transition hover:bg-amber-100"
            >
              <CrownIcon className="h-3.5 w-3.5 text-amber-600" />
              Zerem Pro
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-2 text-xs font-black text-white shadow-xs transition hover:bg-sky-600 active:scale-95"
            >
              פתח אפליקציה
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-black text-sky-700 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
              <span>הסוף לתורים ולחיפושי חניה</span>
            </div>

            {/* Headline */}
            <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
              לדעת מתי הסופר פנוי
              <br />
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                עוד לפני שיוצאים מהבית.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              האפליקציה הקהילתית של ישראל למעקב עומסי קופות, זמינות חניה ושעות שקטות מומלצות ב-3,449 סופרמרקטים ומכולות — עם ניווט ישיר ב-Waze.
            </p>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-6 text-sm font-black text-white shadow-md transition hover:bg-sky-600 active:scale-98"
              >
                <span>כניסה ישירה לאפליקציה (חינם)</span>
                <span>←</span>
              </Link>

              <button
                type="button"
                onClick={() => setIosOpen(true)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 active:scale-98"
              >
                <AppleIcon className="h-4.5 w-4.5 text-slate-900" />
                <span>התקנה לאייפון (iOS)</span>
              </button>

              <a
                href="/zerem.apk"
                download="zerem.apk"
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 active:scale-98"
              >
                <AndroidIcon className="h-4.5 w-4.5 text-emerald-600" />
                <span>הורדה לאנדרואיד (APK)</span>
              </a>
            </div>

            {/* Verified Facts & Coverage */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-6 border-t border-slate-200/60">
              <div className="rounded-2xl bg-white p-3 border border-slate-200/70 shadow-2xs">
                <p className="text-xl font-black text-sky-600 tabular-nums">3,449</p>
                <p className="text-[0.68rem] font-bold text-slate-500 mt-0.5">סניפים בפריסה ארצית</p>
              </div>
              <div className="rounded-2xl bg-white p-3 border border-slate-200/70 shadow-2xs">
                <p className="text-xl font-black text-emerald-600 tabular-nums">1,174</p>
                <p className="text-[0.68rem] font-bold text-slate-500 mt-0.5">יישובים מקצה לקצה</p>
              </div>
              <div className="rounded-2xl bg-white p-3 border border-slate-200/70 shadow-2xs">
                <p className="text-xl font-black text-teal-600 tabular-nums">100%</p>
                <p className="text-[0.68rem] font-bold text-slate-500 mt-0.5">רשתות השיווק בישראל</p>
              </div>
              <div className="rounded-2xl bg-white p-3 border border-slate-200/70 shadow-2xs">
                <p className="text-xl font-black text-blue-600 tabular-nums">Waze</p>
                <p className="text-[0.68rem] font-bold text-slate-500 mt-0.5">ניווט ישיר לחניה</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section id="simulator" className="py-12 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-800">
              רואים את זה בעיניים
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              בדקו סופרמרקט לדוגמה בזמן אמת
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              בחרו אחד מהסניפים וראו את רמת העומס, החניה ושעת ההגעה המומלצת:
            </p>
          </div>

          {/* Branch selector tabs */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SIMULATOR_BRANCHES.map((b, idx) => (
              <button
                key={b.name}
                type="button"
                onClick={() => setSelectedSim(idx)}
                className={`rounded-2xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                  selectedSim === idx
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {b.name} ({b.city})
              </button>
            ))}
          </div>

          {/* Interactive Card Preview */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-card text-right">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <ChainLogo chain={currentSim.chain} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-lg bg-sky-50 px-2 py-0.5 text-[0.7rem] font-bold text-sky-700">
                        {currentSim.chain}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.66rem] font-bold text-slate-500">
                        {currentSim.city}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-base font-black text-slate-900 truncate">
                      {currentSim.name}
                    </h3>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full ${currentSim.bg} px-3 py-1 text-xs font-bold ${currentSim.text}`}>
                  <span className={`h-2 w-2 rounded-full ${currentSim.dot} animate-pulse`} />
                  {currentSim.label}
                </span>
              </div>

              {/* Status details */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-2xl bg-white p-3 border border-slate-100">
                  <p className="text-[0.66rem] font-bold text-slate-400">מצב חניה</p>
                  <p className="mt-0.5 font-bold text-slate-800 flex items-center gap-1">
                    <CarIcon className="h-3.5 w-3.5 text-sky-600" />
                    {currentSim.parking}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-3 border border-slate-100">
                  <p className="text-[0.66rem] font-bold text-slate-400">שעה מומלצת היום</p>
                  <p className="mt-0.5 font-bold text-emerald-700 flex items-center gap-1">
                    <ZapIcon className="h-3.5 w-3.5 text-amber-500" />
                    {currentSim.quietHour}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 flex gap-2">
                <a
                  href={currentSim.wazeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-11 inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 text-xs font-black text-white shadow-xs transition hover:bg-sky-600 active:scale-98"
                >
                  <WazeIcon className="h-4 w-4" />
                  ניווט Waze ישיר לחניה
                </a>
                <Link
                  href="/"
                  className="min-h-11 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  לכל 3,449 הסניפים ←
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
              למה Zerem?
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black text-slate-900">
              כל מה שצריך כדי לקנות חכם ובמהירות
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              נבנה מהיסוד עבור הצרכנים בישראל, כדי שלא תצטרכו לבזבז שעות בתורים מיותרים.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card text-right transition hover:shadow-lift"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${feat.tint} text-white shadow-sm`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-black text-slate-900">
                    {feat.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 font-medium leading-relaxed">
                    {feat.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Zerem Pro Pricing Section */}
      <section id="pricing" className="py-14 bg-gradient-to-b from-slate-900 via-sky-950 to-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 px-3.5 py-1 text-xs font-black text-amber-300">
              <CrownIcon className="h-3.5 w-3.5" />
              מועדון ה-VIP
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white">
              הצטרפו ל-Zerem Pro
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300">
              קבלו התראות עומס אישיות, הוסיפו סופרים ומכולות שכונתיות, ותיהנו מעדיפות כפולה בדיווחי קהילה.
            </p>
          </div>

          {/* Pricing Cards Comparison */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="rounded-3xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-sm text-right flex flex-col justify-between">
              <div>
                <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-300">
                  בסיסי חינם
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₪0</span>
                  <span className="text-xs text-slate-400">/ לנצח</span>
                </div>
                <p className="mt-2 text-xs text-slate-300">מתאים לכל קונה בישראל שרוצה לדעת עומס לפני היציאה.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>חיפוש וסינון בכל 3,449 הסופרמרקטים</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>סטטוס עומס וחניה בזמן אמת</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>ניווט ישיר ב-Waze לחניה</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>שמירת סניפים במועדפים</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/"
                className="mt-8 flex min-h-11 items-center justify-center rounded-2xl border border-slate-600 bg-slate-700 text-xs font-bold text-white transition hover:bg-slate-600"
              >
                התחילו בחינם עכשיו
              </Link>
            </div>

            {/* Pro VIP Tier */}
            <div className="relative rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-slate-800/90 to-slate-900 p-6 shadow-2xl text-right flex flex-col justify-between">
              <div className="absolute -top-3.5 right-6 rounded-full bg-amber-400 px-3 py-0.5 text-[0.68rem] font-black text-slate-950 shadow-md">
                הכי פופולרי
              </div>
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-black text-amber-300">
                  <CrownIcon className="h-3.5 w-3.5" />
                  Zerem Pro VIP
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-amber-300">₪9.90</span>
                  <span className="text-xs text-slate-300">/ לחודש</span>
                </div>
                <p className="mt-2 text-xs text-slate-300">לחברים שרוצים את החוויה המלאה ביותר ותומכים בקהילה.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-white">
                  <li className="flex items-center gap-2 font-bold text-amber-200">
                    <CheckIcon className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>כל מה שכלול בחינם, ובנוסף:</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>התראות עומס חכמות כשהסופר המועדף מתפנה</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>הוספת סופרים ומכולות חדשות ישירות למפה</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>תג VIP קהילתי ומשקל דיווח כפול</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>גרף שעות שקטות מבוסס AI לחיסכון בזמן</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setProModalOpen(true)}
                className="mt-8 flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-xs font-black text-slate-950 shadow-md transition hover:from-amber-300 hover:to-amber-400 active:scale-98"
              >
                <CrownIcon className="h-4 w-4" />
                שדרוג ל-Zerem Pro (₪9.90 בלבד)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How Zerem Works */}
      <section id="how-it-works" className="py-14 sm:py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-800">
              פשוט, מהיר וחכם
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              איך זרם חוסך לך זמן בקניות?
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card text-right flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 font-black text-lg mb-4">
                  1
                </div>
                <h3 className="text-base font-black text-slate-900">בדיקת עומס וחניה בזמן אמת</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  פותחים את האפליקציה ורואים מיד באיזה סופר קרוב פנוי עכשיו (ירוק), בינוני (כתום) או עמוס (אדום), כולל מצב חניה מעודכן.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-emerald-700">✓ התראות עומס חיות</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card text-right flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 font-black text-lg mb-4">
                  2
                </div>
                <h3 className="text-base font-black text-slate-900">שעת הגעה אידיאלית והשוואה</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  האלגוריתם מחשב עבור כל סניף את השעה המומלצת ביותר להגעה לפי שעות הפתיחה והיסטוריית העומסים, ומאפשר להשוות רשתות סמוכות.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-sky-700">✓ תזמון חכם למניעת תורים</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card text-right flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 font-black text-lg mb-4">
                  3
                </div>
                <h3 className="text-base font-black text-slate-900">ניווט מדויק ישירות ל-Waze</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  לחיצה אחת פותחת את Waze עם שם הסניף והרשת המדויקים וקואורדינטות GPS היישר לכניסה ולחניון הסופר.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-blue-700">✓ יעד מדויק ללא שגיאות מיקום</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-14 sm:py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              שאלות נפוצות
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              כל מה שרציתם לדעת על השימוש ב-Zerem
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {FAQ.map((f, idx) => (
              <details
                key={idx}
                className="group rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition open:bg-white open:shadow-card text-right"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs sm:text-sm font-bold text-slate-900">
                  <span>{f.q}</span>
                  <ChevronDownIcon className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2.5 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-2.5">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 py-10 text-white text-center pb-24 sm:pb-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8 rounded-xl shadow-xs" />
              <div className="text-right">
                <p className="font-black text-sm text-white">זרם · Zerem</p>
                <p className="text-[0.64rem] text-slate-400">עומסים וחניה בסופרמרקטים בזמן אמת</p>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Zerem. נבנה באהבה עבור הצרכנים בישראל 🇮🇱
            </p>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              <ShareIcon className="h-3.5 w-3.5" />
              {copied ? "הקישור הועתק!" : "שתף את האפליקציה"}
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md p-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] shadow-lg">
        <div className="flex gap-2">
          <Link
            href="/"
            className="flex-1 min-h-11 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-sky-500 text-xs font-black text-white shadow-xs"
          >
            <span>פתח אפליקציה חינם</span>
            <span>←</span>
          </Link>
          <button
            type="button"
            onClick={() => setProModalOpen(true)}
            className="min-h-11 inline-flex items-center justify-center gap-1 rounded-2xl bg-amber-400 px-3 text-xs font-black text-slate-950"
          >
            <CrownIcon className="h-4 w-4" />
            <span>Pro</span>
          </button>
        </div>
      </div>

      {/* iOS Modal */}
      {iosOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setIosOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="התקנה באייפון"
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-pop text-right"
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
              <AppleIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-center text-lg font-black text-slate-900">
              התקנה מהירה באייפון (iOS)
            </h3>
            <p className="mt-1 text-center text-xs text-slate-500">
              ללא צורך ב-App Store — עובד תוך 2 שניות
            </p>

            <ol className="mt-5 space-y-2.5">
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-black text-white">
                  1
                </span>
                <div>
                  <p className="text-xs font-black text-slate-900">פתחו ב-Safari</p>
                  <p className="mt-0.5 text-[0.72rem] text-slate-500">
                    ודאו שפתחתם את הקישור בדפדפן Safari של האייפון.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-black text-white">
                  2
                </span>
                <div>
                  <p className="text-xs font-black text-slate-900">
                    הקישו על שיתוף ⬆️ ואז &ldquo;הוסף למסך הבית&rdquo;
                  </p>
                  <p className="mt-0.5 text-[0.72rem] text-slate-500">
                    האייקון של זרם יופיע במסך הבית כאפליקציה רגילה לחלוטין.
                  </p>
                </div>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setIosOpen(false)}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-slate-900 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-98"
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      ) : null}

      {/* Pro Modal */}
      {proModalOpen ? (
        <ZeremProModal onClose={() => setProModalOpen(false)} />
      ) : null}
    </div>
  );
}
