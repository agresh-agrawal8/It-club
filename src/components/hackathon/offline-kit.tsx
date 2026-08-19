"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Download, Loader2, MonitorDown, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Infinium's offline kit.
 *
 * The labs lose internet for the entire build, so the app has to keep working
 * with no network. That is handled by the service worker; this is the part
 * students actually touch:
 *
 *   • registers the worker on any /hackathon page
 *   • lets a team save everything in one deliberate click, rather than hoping
 *     they happened to visit each page before the network went away
 *   • says plainly whether they are online, and what they last saved
 *
 * The team portal is included in the sync on purpose: it is server-rendered,
 * so its cached HTML already contains that team's brief and roster.
 */

const LAST_SYNC_KEY = "infinium:last-sync";

/** Pages every team needs on the day. */
const SYNC_URLS = [
  "/hackathon",
  "/hackathon/schedule",
  "/hackathon/problems",
  "/hackathon/passport",
  "/hackathon/rules",
  "/hackathon/team",
];

type Status = "idle" | "saving" | "saved" | "error";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Whether the site itself is reachable — not merely whether a cable is in.
 *
 * `navigator.onLine` only reports the network interface. A lab machine whose
 * internet has been cut upstream still reports `true`, so relying on it alone
 * would leave a team reading a cached brief with no hint that it is a saved
 * copy. So: trust `onLine` for the fast negative, then confirm with a real
 * request the service worker does not answer from cache.
 */
function useReachable() {
  // Assume reachable until proven otherwise: flashing "offline" during
  // hydration on a perfectly connected machine is worse than a beat's delay.
  const [reachable, setReachable] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      if (!navigator.onLine) {
        if (!cancelled) setReachable(false);
        return;
      }
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        // Unique query string, so neither the HTTP cache nor the worker's
        // asset branch can answer it.
        await fetch(`/hackathon/manifest.webmanifest?ping=${Date.now()}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!cancelled) setReachable(true);
      } catch {
        if (!cancelled) setReachable(false);
      }
    };

    probe();
    const onVisible = () => document.visibilityState === "visible" && probe();
    addEventListener("online", probe);
    addEventListener("offline", probe);
    document.addEventListener("visibilitychange", onVisible);
    // Slow heartbeat, so a team notices when the network comes back without
    // hammering a server that may not be there.
    const id = setInterval(probe, 30_000);

    return () => {
      cancelled = true;
      clearInterval(id);
      removeEventListener("online", probe);
      removeEventListener("offline", probe);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return reachable;
}

function formatWhen(ts: number | null) {
  if (!ts) return null;
  const d = new Date(ts);
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return today ? time : `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
}

/**
 * Drops the cached portal when a different team signs in on this machine.
 *
 * The portal's cached HTML holds one team's sealed brief and roster, and the
 * service-worker cache is keyed by URL rather than by cookie — so without this
 * a second team on a shared lab PC could open the app offline and read the
 * first team's brief. Mount it on the portal with the signed-in team's id.
 */
const CACHED_TEAM_KEY = "infinium:cached-team";

export function PortalCacheGuard({ teamId }: { teamId: string }) {
  useEffect(() => {
    const previous = localStorage.getItem(CACHED_TEAM_KEY);
    if (previous === teamId) return;

    localStorage.setItem(CACHED_TEAM_KEY, teamId);
    localStorage.removeItem(LAST_SYNC_KEY);

    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => {
        const worker = reg.active ?? navigator.serviceWorker.controller;
        worker?.postMessage({ type: "INFINIUM_CLEAR_PAGES" });
      })
      .catch(() => {});
  }, [teamId]);

  return null;
}

/** Registers the worker. Mount once, high in the tree. */
export function OfflineRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration fails on http:// origins other than localhost, and in
      // private windows. Offline support is a bonus, never a hard dependency.
    });
  }, []);
  return null;
}

/** Fixed badge shown only while the browser reports no connection. */
export function OfflineBadge() {
  const online = useReachable();
  const [lastSync, setLastSync] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(LAST_SYNC_KEY);
    setLastSync(raw ? Number(raw) : null);
  }, [online]);

  if (online) return null;

  const when = formatWhen(lastSync);
  return (
    <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 px-4">
      <div className="flex items-center gap-2.5 rounded-full border border-amber-400/30 bg-[#1a1408]/95 px-4 py-2.5 shadow-lg backdrop-blur">
        <WifiOff className="h-4 w-4 shrink-0 text-amber-300" />
        <span className="text-[12.5px] text-amber-100">
          Offline — showing your saved copy
          {when ? <span className="text-amber-300/70"> from {when}</span> : null}
        </span>
      </div>
    </div>
  );
}

/**
 * The "save this for offline" control.
 *
 * `variant="panel"` is the full card for the portal; `variant="inline"` is a
 * compact button for elsewhere.
 */
export function SaveOffline({
  variant = "panel",
  className,
}: {
  variant?: "panel" | "inline";
  className?: string;
}) {
  const online = useReachable();
  const [status, setStatus] = useState<Status>("idle");
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [installer, setInstaller] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(LAST_SYNC_KEY);
    setLastSync(raw ? Number(raw) : null);

    setInstalled(matchMedia("(display-mode: standalone)").matches);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstaller(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstaller(null);
    };
    addEventListener("beforeinstallprompt", onPrompt);
    addEventListener("appinstalled", onInstalled);
    return () => {
      removeEventListener("beforeinstallprompt", onPrompt);
      removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const save = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      setStatus("error");
      setDetail("This browser cannot save pages for offline use.");
      return;
    }
    setStatus("saving");
    setDetail(null);

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      // A worker that is installing cannot receive messages yet.
      await navigator.serviceWorker.ready;
      const worker = reg.active ?? navigator.serviceWorker.controller;
      if (!worker) throw new Error("no active worker");

      const done = new Promise<{ ok: number; total: number; at: number }>((resolve, reject) => {
        const onMessage = (e: MessageEvent) => {
          if (e.data?.type !== "INFINIUM_SYNCED") return;
          navigator.serviceWorker.removeEventListener("message", onMessage);
          resolve(e.data);
        };
        navigator.serviceWorker.addEventListener("message", onMessage);
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener("message", onMessage);
          reject(new Error("timeout"));
        }, 60_000);
      });

      worker.postMessage({ type: "INFINIUM_SYNC", urls: SYNC_URLS });
      const res = await done;

      localStorage.setItem(LAST_SYNC_KEY, String(res.at));
      setLastSync(res.at);
      setStatus("saved");
      setDetail(
        res.ok < res.total
          ? `Saved ${res.ok} of ${res.total} pages — reconnect and try again for the rest.`
          : null,
      );
    } catch {
      setStatus("error");
      setDetail("Could not save everything. Check your connection and try again.");
    }
  }, []);

  const install = useCallback(async () => {
    if (!installer) return;
    await installer.prompt();
    await installer.userChoice;
    setInstaller(null);
  }, [installer]);

  const when = formatWhen(lastSync);

  if (variant === "inline") {
    return (
      <button
        onClick={save}
        disabled={status === "saving" || !online}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-[12.5px] text-white transition-colors hover:border-brand-400/50 disabled:opacity-50",
          className,
        )}
      >
        {status === "saving" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : status === "saved" ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-accent-400" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {status === "saving" ? "Saving…" : when ? "Update offline copy" : "Save for offline"}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0d0d11] p-6 sm:p-7",
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10",
        "before:bg-[radial-gradient(120%_100%_at_100%_0%,rgba(139,92,246,0.14),transparent_60%)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
            <Download className="h-[18px] w-[18px]" />
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-[17px] font-semibold tracking-tight text-white">
              Save this for the offline day
            </h3>
            <p className="text-[13.5px] leading-relaxed text-zinc-400">
              The labs have no internet during the build. Save everything now — your brief, roster,
              schedule, rules and the passport — and this app keeps working with the network gone.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={save}
            disabled={status === "saving" || !online}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
          >
            {status === "saving" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {status === "saving" ? "Saving…" : when ? "Update saved copy" : "Save for offline"}
          </button>

          {!installed && installer && (
            <button
              onClick={install}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-[13px] text-white transition-colors hover:border-brand-400/50"
            >
              <MonitorDown className="h-3.5 w-3.5" />
              Install as an app
            </button>
          )}
          {installed && (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-accent-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Installed as an app
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 border-t border-white/[0.07] pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  online ? "bg-accent-400" : "bg-amber-400",
                )}
              />
              <span className={online ? "text-zinc-400" : "text-amber-300"}>
                {online ? "Online" : "Offline"}
              </span>
            </span>
            <span className="text-zinc-500">
              {when ? `Last saved ${when}` : "Nothing saved yet"}
            </span>
          </div>
          {detail && (
            <p
              className={cn(
                "text-[12px]",
                status === "error" ? "text-red-300" : "text-amber-300",
              )}
            >
              {detail}
            </p>
          )}
          {status === "saved" && !detail && (
            <p className="text-[12px] text-accent-400">
              Saved. You can open this app with the internet off.
            </p>
          )}
          {!installed && !installer && (
            <p className="text-[12px] leading-relaxed text-zinc-600">
              To keep it on the desktop: open your browser menu and choose “Install” (Chrome/Edge:
              the icon in the address bar).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
