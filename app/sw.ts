import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Workbox precache manifest — injected at build time by vite-plugin-pwa
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// --- Custom caching logic (preserved from original sw.js) ---

const CACHE_FONTS = 'lucky-numbers-fonts-v1';

// Google Fonts: stale-while-revalidate
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  // Cache API only supports http/https
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // Dev environment: skip Vite optimized deps
  if (url.hostname === 'localhost' && url.pathname.includes('/node_modules/')) {
    return;
  }

  // Google Fonts: stale-while-revalidate
  if (
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com'
  ) {
    event.respondWith(staleWhileRevalidate(CACHE_FONTS, request));
    return;
  }

  // Navigation requests: let Workbox precache handle the app shell.
  // If Workbox doesn't have it, fall back to network-first.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
});

async function staleWhileRevalidate(cacheName: string, request: Request): Promise<Response> {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached ?? new Response('', { status: 503 }));
  return cached ?? fetchPromise;
}

async function networkFirstNavigation(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    const rootCached = await caches.match('/');
    if (rootCached) return rootCached;

    return new Response(
      '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>오프라인</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Noto Sans",sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#000;color:#fff;text-align:center;padding:1rem}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#999;font-size:0.875rem}</style></head><body><div><h1>오프라인 상태입니다</h1><p>인터넷 연결을 확인한 후 다시 시도해 주세요.</p></div></body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// Listen for skip-waiting message from the app (SW update flow)
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
