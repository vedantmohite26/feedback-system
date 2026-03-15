const CACHE_NAME = 'acme-portal-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/admin.html',
  '/active-polls.html',
  '/submit-issue.html',
  '/my-issues.html',
  '/profile.html',
  '/admin-polls.html',
  '/poll-results.html',
  '/issue-detail.html',
  '/css/neumorphism.css',
  '/js/firebase-config.js',
  '/js/sidebar-cache.js',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Let browser handle external APIs (Firebase, Google Auth, Cloudinary)
  if (url.hostname.includes('googleapis.com') && url.pathname.includes('/identitytoolkit')) return;
  if (url.hostname.includes('firestore.googleapis.com')) return;
  if (url.hostname.includes('cloudfunctions.net')) return;
  if (url.hostname.includes('cloudinary')) return;
  if (url.hostname === 'cdn.tailwindcss.com') return;

  // Cache-first for fonts (they never change)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for local assets
  // Serve cached version instantly, update cache in background
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached); // If network fails and no cache, return undefined

      return cached || networkFetch;
    })
  );
});
