import { useCallback, useEffect, useState } from "react";

/**
 * usePWAInstall — captures the `beforeinstallprompt` event and exposes a
 * trigger to show the native install prompt.
 *
 * Also handles registering / unregistering the service worker safely:
 *  - In Lovable preview iframes & dev: actively unregister any existing SW.
 *  - In production (top-level window): the SW is auto-registered by
 *    vite-plugin-pwa with `registerType: "autoUpdate"`.
 */

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type PWAInstallState = {
  /** True when running as an installed PWA (display-mode: standalone). */
  isInstalled: boolean;
  /** True when the browser has fired beforeinstallprompt and we can prompt. */
  canInstall: boolean;
  /** Trigger the native install prompt. Resolves to true if accepted. */
  install: () => Promise<boolean>;
};

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect standalone mode (already installed)
    const mql = window.matchMedia("(display-mode: standalone)");
    const checkInstalled = () => {
      setIsInstalled(
        mql.matches ||
          // iOS Safari standalone flag
          (window.navigator as Navigator & { standalone?: boolean })
            .standalone === true,
      );
    };
    checkInstalled();
    mql.addEventListener?.("change", checkInstalled);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // Unregister any stale service worker when running inside an iframe
    // (Lovable preview) or on a preview host. Must NEVER cache the editor.
    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();
    const host = window.location.hostname;
    const isPreviewHost =
      host.includes("id-preview--") || host.includes("lovableproject.com");

    if ((isInIframe || isPreviewHost) && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }

    return () => {
      mql.removeEventListener?.("change", checkInstalled);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice.outcome === "accepted";
  }, [deferredPrompt]);

  return {
    isInstalled,
    canInstall: !!deferredPrompt,
    install,
  };
}
