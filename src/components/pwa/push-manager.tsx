"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import {
  savePushSubscriptionAction,
  removePushSubscriptionAction,
  sendTestPushAction,
} from "@/lib/actions/push";
import { Button } from "@/components/ui/button";

/** base64url VAPID key → Uint8Array for PushManager.subscribe(). */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = "loading" | "unsupported" | "denied" | "off" | "on";

/**
 * Notification opt-in for members. Registers the service worker, subscribes
 * to web push, and stores the subscription server-side so the core team's
 * notices reach this device even when the site is closed.
 */
export function PushManager({ vapidKey }: { vapidKey: string }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; err?: string } | null>(null);

  useEffect(() => {
    (async () => {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !vapidKey
      ) {
        setState("unsupported");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        if (Notification.permission === "denied") {
          setState("denied");
          return;
        }
        const existing = await reg.pushManager.getSubscription();
        setState(existing ? "on" : "off");
      } catch {
        setState("unsupported");
      }
    })();
  }, [vapidKey]);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }));
      const res = await savePushSubscriptionAction(JSON.stringify(sub), navigator.userAgent);
      if (res?.error) {
        setMsg({ err: res.error });
      } else {
        setState("on");
        setMsg({ ok: "Notifications enabled on this device." });
      }
    } catch {
      setMsg({ err: "Could not enable notifications on this device." });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
      setMsg({ ok: "Notifications turned off for this device." });
    } catch {
      setMsg({ err: "Could not turn notifications off." });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg(null);
    const res = await sendTestPushAction();
    setMsg(res?.error ? { err: res.error } : { ok: res?.success });
    setBusy(false);
  }

  if (state === "loading") return null;

  return (
    <div className="glass flex flex-col gap-4 rounded-3xl p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            state === "on" ? "bg-emerald-500/15 text-emerald-300" : "bg-brand-500/15 text-brand-300"
          }`}
        >
          {state === "on" ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-white">
            {state === "on" ? "Notifications are on" : "Get club notifications"}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            {state === "unsupported" &&
              "This browser can't receive push notifications. On iPhone, add Avinya to your home screen first, then turn them on from there."}
            {state === "denied" &&
              "Notifications are blocked for this site. Enable them in your browser settings, then reload."}
            {state === "off" &&
              "Turn on alerts and you'll hear about urgent notices, events and tasks even when Avinya is closed."}
            {state === "on" &&
              "You'll receive club notices on this device. Send a test to check it works."}
          </p>
        </div>
      </div>

      {(state === "off" || state === "on") && (
        <div className="flex flex-wrap items-center gap-3">
          {state === "off" ? (
            <Button onClick={enable} disabled={busy} variant="brand" size="sm" className="rounded-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              {busy ? "Enabling…" : "Turn on notifications"}
            </Button>
          ) : (
            <>
              <Button onClick={test} disabled={busy} variant="secondary" size="sm" className="rounded-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                Send test
              </Button>
              <Button onClick={disable} disabled={busy} variant="ghost" size="sm" className="rounded-full">
                <BellOff className="h-4 w-4" /> Turn off
              </Button>
            </>
          )}
        </div>
      )}

      {msg?.ok && <p className="text-xs text-emerald-400">{msg.ok}</p>}
      {msg?.err && <p className="text-xs text-red-400">{msg.err}</p>}
    </div>
  );
}
