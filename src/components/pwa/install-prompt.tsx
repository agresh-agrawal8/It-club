"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "avinya-install-dismissed";

/**
 * "Add Avinya to your phone" banner. Uses the native install prompt where
 * available (Android/desktop Chrome & Edge); on iOS Safari — which has no
 * programmatic prompt — it shows the manual Share → Add to Home Screen steps.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Already installed → never nag.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS gets the manual hint after a short delay.
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    if (isIos) {
      const t = setTimeout(() => {
        setShowIosHint(true);
        setVisible(true);
      }, 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode — fine, it'll show again next visit */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") dismiss();
    setDeferred(null);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-md sm:inset-x-auto sm:right-5 sm:bottom-5">
      <div className="glass-deep animate-fade-up flex items-start gap-4 rounded-3xl p-4 pr-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700">
          <span className="h-3.5 w-3.5 rotate-45 rounded-[2px] bg-white" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-white">Install Avinya</h3>
          {showIosHint ? (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs leading-relaxed text-zinc-400">
              Tap <Share className="inline h-3.5 w-3.5 text-brand-300" /> Share, then
              <span className="inline-flex items-center gap-1 font-medium text-zinc-200">
                <Plus className="h-3 w-3" /> Add to Home Screen
              </span>
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Add it to your home screen for one-tap access and club notifications.
            </p>
          )}

          {!showIosHint && (
            <Button onClick={install} variant="brand" size="sm" className="mt-3 rounded-full">
              <Download className="h-4 w-4" /> Install app
            </Button>
          )}
        </div>

        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
