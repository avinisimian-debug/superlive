import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { LiveProvider } from "@/lib/store";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "סופר-לייב | עומסים וחניה בזמן אמת בסופר",
  description:
    "סופר-לייב — המעקב הקהילתי בזמן אמת אחרי עומסים בקופות ומצב חניה בסופרמרקטים בישראל. דיווח של קהילה, בדיקת המצב לפני שיוצאים, וניווט ישר ב-Waze.",
  applicationName: "סופר-לייב",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "סופר-לייב",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-icon.svg", type: "image/svg+xml" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="antialiased text-slate-900">
        <LiveProvider>
          <div className="app-shell">{children}</div>
        </LiveProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
