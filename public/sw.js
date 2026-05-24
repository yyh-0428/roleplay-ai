const CACHE_NAME = 'huanjing-v2.0.0';
const CDN_CACHE_NAME = 'huanjing-cdn-v2.0.0';

const CDN_URLS = [
  'https://cdn.bootcdn.net/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://cdn.bootcdn.net/ajax/libs/marked/12.0.0/marked.min.js',
  'https://cdn.bootcdn.net/ajax/libs/highlight.js/11.9.0/highlight.min.js',
  'https://cdn.bootcdn.net/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
  'https://cdn.bootcdn.net/ajax/libs/KaTeX/0.16.9/katex.min.css',
  'https://cdn.bootcdn.net/ajax/libs/KaTeX/0.16.9/katex.min.js',
  'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js'
];

// Install: pre-cache CDN resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CDN_CACHE_NAME).then((cache) => {
      return cache.addAll(CDN_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME && name !== CDN_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: CDN resources use cache-first, app files use network-first
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CDN resources: cache-first
  if (CDN_URLS.some((cdn) => url.href.startsWith(cdn.split('?')[0]))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CDN_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // App files: network-first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
