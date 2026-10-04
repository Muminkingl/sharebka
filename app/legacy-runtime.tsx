"use client";

import { useEffect } from "react";

const runtimeScripts = [
  "/scripts/localization.js",
  "/scripts/persistent-storage.js",
  "/scripts/ui-main.js",
  "/scripts/main.js",
];

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-pairdrop-runtime="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.dataset.pairdropRuntime = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Unable to load PairDrop runtime: ${src}`));
    document.body.appendChild(script);
  });
}

export default function LegacyRuntime() {
  useEffect(() => {
    let active = true;

    const start = async () => {
      // Load the same runtime config used by ServerConnection before opening
      // IndexedDB so paired rooms are scoped to the actual signaling endpoint.
      try {
        const response = await fetch("/config", { cache: "no-store" });
        if (response.ok) {
          const config = await response.json();
          (window as Window & { __PAIR_DROP_SIGNALING_SERVER__?: string }).__PAIR_DROP_SIGNALING_SERVER__ = config.signalingServer || "";
        }
      } catch (error) {
        console.error("Unable to load PairDrop config", error);
      }
      for (const src of runtimeScripts) {
        if (!active) return;
        await loadScript(src);
      }
    };

    start().catch((error) => console.error(error));
    return () => {
      active = false;
    };
  }, []);

  return null;
}
