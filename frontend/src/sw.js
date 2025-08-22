import { clientsClaim } from "workbox-core";
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

self.__WB_DISABLE_DEV_LOGS = true;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST || []);

const postToAll = (data) => {
  self.clients
    .matchAll({ includeUncontrolled: true, type: "window" })
    .then((clients) => clients.forEach((c) => c.postMessage(data)))
    .catch(() => {});
};

self.addEventListener("error", (ev) => {
  postToAll({
    __log: {
      level: "error",
      msg: ev.message || "SW error",
      meta: { stack: ev.error && ev.error.stack },
    },
  });
});
self.addEventListener("unhandledrejection", (ev) => {
  postToAll({
    __log: {
      level: "error",
      msg: String(ev.reason || "SW unhandledrejection"),
    },
  });
});

self.addEventListener("install", () =>
  postToAll({ __log: { level: "info", msg: "SW installed" } })
);
self.addEventListener("activate", () =>
  postToAll({ __log: { level: "info", msg: "SW activated" } })
);

registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith("/api/") &&
    request.method === "GET",
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 }), // 1 hour
    ],
  })
);

registerRoute(
  /^https:\/\/([a-z0-9-]+\.)?ftrackerapp\.co\.uk\/api\//,
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 }),
    ],
  }),
  "GET"
);

registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "image-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

const SPA_INDEX = self.registration.scope.replace(/\/$/, "") + "/index.html";
const navigationFallback = new NavigationRoute(
  createHandlerBoundToURL(SPA_INDEX),
  {
    denylist: [/^\/api\//, /\/.*\.(?:png|jpg|svg|js|css|map|json)$/],
  }
);
registerRoute(navigationFallback);
