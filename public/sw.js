/* Empresa Plana PWA service worker.
 *
 * Strategy:
 *  - The app shell (/dashboard/*) is served with network-first + cache fallback so
 *    updates propagate while the app stays usable offline.
 *  - Static assets (/dashboard-icons, CSS/JS hashed bundles) are cache-first.
 *  - Remote fonts (Geist via jsDelivr, Material Symbols via Google Fonts) are
 *    cached at runtime (stale-while-revalidate), so icons/typography keep
 *    working offline after the first visit.
 *  - The rest of the marketing website is intentionally NOT intercepted.
 */
const SHELL_CACHE = "plana-shell-v1";
const ASSET_CACHE = "plana-assets-v1";
const FONT_CACHE = "plana-fonts-v1";

const SHELL_NAV = ["/dashboard/", "/dashboard/cliente/", "/dashboard/trabajador/", "/dashboard/perfil/"];

const FONT_HOSTS = [
	"cdn.jsdelivr.net",
	"fonts.googleapis.com",
	"fonts.gstatic.com",
	"lh3.googleusercontent.com",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(SHELL_CACHE)
			.then((cache) => cache.addAll(["/dashboard/", "/manifest.webmanifest", "/app-icons/icon-192.png", "/app-icons/icon-512.png"]))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((k) => ![SHELL_CACHE, ASSET_CACHE, FONT_CACHE].includes(k)).map((k) => caches.delete(k))),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;
	const url = new URL(request.url);

	// Cross-origin fonts/icons: stale-while-revalidate.
	if (FONT_HOSTS.includes(url.hostname)) {
		event.respondWith(
			caches.open(FONT_CACHE).then(async (cache) => {
				const cached = await cache.match(request);
				const network = fetch(request)
					.then((response) => {
						if (response && response.ok) cache.put(request, response.clone());
						return response;
					})
					.catch(() => cached);
				return cached ?? network;
			}),
		);
		return;
	}

	// Same-origin requests only below this point.
	if (url.origin !== self.location.origin) return;

	// Static hashed assets (/_astro/...): cache-first.
	if (url.pathname.startsWith("/_astro/") || url.pathname.startsWith("/app-icons/")) {
		event.respondWith(
			caches.open(ASSET_CACHE).then(async (cache) => {
				const cached = await cache.match(request);
				const network = fetch(request)
					.then((response) => {
						if (response && response.ok) cache.put(request, response.clone());
						return response;
					})
					.catch(() => cached);
				return cached ?? network;
			}),
		);
		return;
	}

	// App shell navigations: network-first, cache fallback.
	if (request.mode === "navigate" && url.pathname.startsWith("/dashboard/")) {
		event.respondWith(
			caches.open(SHELL_CACHE).then(async (cache) => {
				const cached = await cache.match(request);
				try {
					const response = await fetch(request);
					if (response && response.ok) cache.put(request, response.clone());
					return response;
				} catch {
					if (cached) return cached;
					// Unknown /dashboard route offline: fall back to the shell entry.
					const fallback = await cache.match("/dashboard/");
					if (fallback) return fallback;
					throw new Error("offline");
				}
			}),
		);
		return;
	}
});
