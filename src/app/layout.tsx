import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { LiveProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zerem",
  },: Metadata = {
  title: "Zerem | זרם — עומסים וחניה בסופרמרקטים בזמן אמת",
  description:
    "Zerem (זרם) — המעקב הקהילתי בזמן אמת אחרי עומסים בקופות ומצב חניה בסופרמרקטים ובמכולות בישראל. דיווח של קהילה, בדיקת המצב לפני שיוצאים, וניווט ישר ב-Waze.",
  applicationName: "Zerem",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Zerem",
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
        <AuthProvider>
          <LiveProvider>
            <div className="app-shell">{children}</div>
          </LiveProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
