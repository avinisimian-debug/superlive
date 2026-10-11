import type { Metadata } from "next";
import { DownloadLanding } from "@/components/DownloadLanding";

export const metadata: Metadata = {
  title: "הורדת Zerem (זרם) | עומסים וחניה בזמן אמת בסופר",
  description:
    "הורידו את Zerem (זרם) בחינם — המעקב הקהילתי בזמן אמת אחר עומסים בקופות ומצב חניה ב-3,449 סניפים בישראל. הורדה לאנדרואיד (APK) ולאייפון (iOS).",
  alternates: { canonical: "/download" },
};

export default function DownloadPage() {
  return <DownloadLanding />;
}
