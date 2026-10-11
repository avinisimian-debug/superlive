import type { Metadata } from "next";
import { DownloadLanding } from "@/components/DownloadLanding";

export const metadata: Metadata = {
  title: "סופר-לייב | לדעת מתי הסופר פנוי — עוד לפני שיוצאים מהבית",
  description:
    "SuperLive (סופר-לייב) — המעקב הקהילתי בזמן אמת לעומסי קופות וחניה בסופרמרקטים ובמכולות בישראל. הורדה חינם לאנדרואיד ולאייפון.",
  alternates: { canonical: "/landing" },
};

export default function LandingPage() {
  return <DownloadLanding />;
}
