/* Avinya service worker — push notifications, offline shell, and the
   offline-capable Infinium hackathon app. */

const CACHE = "avinya-v2";
const OFFLINE_URL = "/offline.html";

/* ── Infinium offline app ─────────────────────────────────────────────────
   The hackathon runs with the internet cut for the whole build, so every
   /hackathon page a team might need has to survive without a network.

   Two caches, because the two kinds of content expire differently:

     INFINIUM_SHELL  the fixed reference pages (schedule, rules, passport…).
                     Precached on install so they work even if never visited.
     INFINIUM_PAGES  pages that depend on who you are — chiefly the team
                     portal, whose server-rendered HTML already contains that
                     team's brief and roster. Cached whenever it is fetched
                     successfully, so the last successful sync is what the
                     team reads all day.

   Static assets are hashed and immutable, so they are cache-first: after one
   online visit the app paints instantly and works with no network at all. */
const SHELL = "infinium-shell-v1";
const PAGES = "infinium-pages-v1";
const ASSETS = "infinium-assets-v1";

const SHELL_URLS = [
  "/hackathon",
  "/hackathon/schedule",
  "/hackathon/problems",
  "/hackathon/passport",
  "/hackathon/rules",
  "/hackathon/manifest.webmanifest",
  "/hackathon/icon-192.png",
  "/hackathon/icon-512.png",
];

const isHackathon = (url) => url.pathname === "/hackathon" || url.pathname.startsWith("/hackathon/");

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      await c.addAll([OFFLINE_URL, "/icons/icon-192.png"]);
      // Best-effort: one missing page must not abort the whole install.
      const shell = await caches.open(SHELL);
      await Promise.allSettled(SHELL_URLS.map((u) => shell.add(u)));
    })(),
  );
  self.skipWaiting();
});

const KEEP = new Set([CACHE, SHELL, PAGES, ASSETS]);

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/* ── Fetch ────────────────────────────────────────────────────────────── */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  /* Immutable build assets — cache-first. This is what makes the installed
     app paint instantly and survive with no network. */
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/hackathon/icon-")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSETS).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode !== "navigate") return;

  /* Hackathon pages — network-first, falling back to the last good copy.
     Online you always get fresh data; offline you get exactly what you had
     when the internet was cut. */
  if (isHackathon(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            const bucket = SHELL_URLS.includes(url.pathname) ? SHELL : PAGES;
            caches.open(bucket).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(async () => {
          const hit =
            (await caches.match(url.pathname)) ||
            (await caches.match("/hackathon"));
          return hit || caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  /* Everything else keeps the original behaviour: straight to the network,
     with the offline page as a fallback. */
  event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
});

/* ── Explicit "save for offline" ──────────────────────────────────────────
   Warms every page a team needs in one deliberate action, so nobody has to
   remember to visit each one before the network goes away. */
self.addEventListener("message", (event) => {
  const data = event.data || {};

  /* Drop every team-specific page.
     The portal's cached HTML contains one team's sealed brief and roster, and
     the cache is keyed by URL, not by cookie — so on a shared lab PC a second
     team could otherwise open the app offline and read the first team's copy.
     The page guard fires this the moment a different team signs in. */
  if (data.type === "INFINIUM_CLEAR_PAGES") {
    event.waitUntil(caches.delete(PAGES));
    return;
  }

  if (data.type !== "INFINIUM_SYNC") return;

  const urls = Array.from(new Set([...SHELL_URLS, ...(data.urls || [])]));

  event.waitUntil(
    (async () => {
      const results = await Promise.allSettled(
        urls.map(async (u) => {
          const res = await fetch(u, { cache: "reload" });
          if (!res.ok) throw new Error(String(res.status));
          const bucket = SHELL_URLS.includes(u) ? SHELL : PAGES;
          const c = await caches.open(bucket);
          await c.put(u, res.clone());

          // Pull in the JS/CSS this page references, so it hydrates offline.
          if (res.headers.get("content-type")?.includes("text/html")) {
            const html = await res.text();
            const refs = [...html.matchAll(/"(\/_next\/static\/[^"]+?)"/g)]
              .map((m) => m[1])
              .filter((h) => h.endsWith(".js") || h.endsWith(".css"));
            const assets = await caches.open(ASSETS);
            await Promise.allSettled(
              Array.from(new Set(refs)).map(async (h) => {
                const r = await fetch(h);
                if (r.ok) await assets.put(h, r);
              }),
            );
          }
          return u;
        }),
      );

      const ok = results.filter((r) => r.status === "fulfilled").length;
      const client = event.source;
      if (client) {
        client.postMessage({
          type: "INFINIUM_SYNCED",
          ok,
          total: urls.length,
          at: Date.now(),
        });
      }
    })(),
  );
});

/* ── Push ─────────────────────────────────────────────────── */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Avinya", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Avinya";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "avinya-notice",
    renotify: true,
    requireInteraction: !!payload.urgent,
    vibrate: payload.urgent ? [200, 100, 200] : undefined,
    data: { url: payload.url || "/notifications" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
