import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginScreen } from "@/components/LoginScreen";

export const metadata: Metadata = {
  title: "התחברות | Zerem (זרם)",
  description: "התחברות מאובטחת ל-Zerem באמצעות קוד אימות חד-פעמי למייל.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="full-bleed flex min-h-dvh items-center justify-center bg-slate-50">
          <p className="text-[0.9rem] font-semibold text-slate-400">טוען…</p>
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
