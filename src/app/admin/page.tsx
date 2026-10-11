import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "פאנל ניהול | Zerem (זרם)",
  description: "פאנל ניהול Zerem — משתמשים, כניסות ודיווחי עומס.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
