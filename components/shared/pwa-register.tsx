"use client";

import { useEffect } from "react";

export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Gagal mendaftarkan service worker:", error);
    });
  }, []);

  return null;
}
