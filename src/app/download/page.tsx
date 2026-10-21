import type { Metadata } from "next";
import { DownloadLanding } from "@/components/DownloadLanding";
import { CITIES, NATIONWIDE_COUNT } from "@/lib/branches";

export const metadata: Metadata = {
  title: "הורדת Zerem (זרם) | עומסים וחניה בזמן אמת בסופר",
  description:
    `הורידו את Zerem (זרם) בחינם — המעקב הקהילתי בזמן אמת אחר עומסים בקופות ומצב חניה ב-${NATIONWIDE_COUNT.toLocaleString("en-US")} סניפים בישראל. הורדה לאנדרואיד (APK) ולאייפון (iOS).`,
  alternates: { canonical: "/download" },
};

export default function DownloadPage() {
  return <DownloadLanding branchCount={NATIONWIDE_COUNT} cityCount={CITIES.length} />;
}
