"use client";

import { useEffect } from "react";

/** Cleans up legacy service workers and purges stale caches */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => undefined);
        }
      });
    }
    if ("caches" in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key).catch(() => undefined);
        }
      });
    }
  }, []);

  return null;
}
