/**
 * 행운번호 추첨기 Service Worker
 * 오프라인 지원 및 자산 캐싱
 */

const SW_VERSION = 'v1';
const CACHE_HTML = `lucky-numbers-html-${SW_VERSION}`;
const CACHE_STATIC = `lucky-numbers-static-${SW_VERSION}`;
const CACHE_FONTS = `lucky-numbers-fonts-${SW_VERSION}`;

const ALL_CACHES = [CACHE_HTML, CACHE_STATIC, CACHE_FONTS];

// 앱 셸 - 오프라인 시 제공할 기본 페이지
const APP_SHELL = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_HTML)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !ALL_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Cache API only supports http/https — skip chrome-extension://, data:, etc.
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // 개발 환경(localhost): Vite optimized deps는 캐싱하지 않음
  if (
    url.hostname === 'localhost' &&
    url.pathname.includes('/node_modules/')
  ) {
    return; // 브라우저 기본 동작으로 위임
  }

  // Google Fonts: stale-while-revalidate (폰트는 자주 바뀌지 않음)
  if (
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com'
  ) {
    event.respondWith(staleWhileRevalidate(CACHE_FONTS, request));
    return;
  }

  // 정적 자산 (JS/CSS/이미지): cache-first (content hash로 버전 관리)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(CACHE_STATIC, request));
    return;
  }

  // HTML 내비게이션: network-first + 오프라인 폴백
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(CACHE_HTML, request));
    return;
  }

  // 기타: 네트워크 우선
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

async function cacheFirst(cacheName, request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function staleWhileRevalidate(cacheName, request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached ?? fetchPromise;
}

async function networkFirst(cacheName, request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return (
      cached ??
      new Response(
        '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>오프라인</title></head><body><h1>오프라인 상태입니다</h1><p>인터넷 연결을 확인해 주세요.</p></body></html>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    );
  }
}
