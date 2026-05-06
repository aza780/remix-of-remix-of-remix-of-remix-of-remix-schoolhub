import { useCallback, useEffect, useState } from "react";

/**
 * usePWAInstall — captures `beforeinstallprompt` once at the module level
 * and shares it across every component that calls the hook. Without the
 * shared store, the first hook instance to mount swallows the event and
 * any other instance (e.g. an Install button on /profile) would always
 * see canInstall === false.
 */

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Store = {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
};

const store: Store = { deferred: null, installed: false };
const listeners = new Set<() => void>();
let initialized = false;

function emit() {
  listeners.forEach((l) => l());
}

function initOnce() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Standalone detection
  const mql = window.matchMedia("(display-mode: standalone)");
  const checkInstalled = () => {
    const installed =
      mql.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (installed !== store.installed) {
      store.installed = installed;
      emit();
    }
  };
  checkInstalled();
  mql.addEventListener?.("change", checkInstalled);

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    store.deferred = e as BeforeInstallPromptEvent;
    emit();
  });

  window.addEventListener("appinstalled", () => {
    store.deferred = null;
    store.installed = true;
    emit();
  });

  // Unregister stale SW inside Lovable preview iframe / preview hosts
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
}

export type PWAInstallState = {
  isInstalled: boolean;
  canInstall: boolean;
  install: () => Promise<boolean>;
};

export function usePWAInstall(): PWAInstallState {
  initOnce();

  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const install = useCallback(async () => {
    if (!store.deferred) return false;
    await store.deferred.prompt();
    const choice = await store.deferred.userChoice;
    store.deferred = null;
    emit();
    return choice.outcome === "accepted";
  }, []);

  return {
    isInstalled: store.installed,
    canInstall: !!store.deferred,
    install,
  };
}
