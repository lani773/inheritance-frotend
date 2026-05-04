/**
 * INHERITANCE CHOIR — Service Worker
 * Enables offline mode, background sync, and push notifications.
 * Strategy: Network-first for API, Cache-first for static assets.
 */

const CACHE_NAME       = 'choir-v1';
const STATIC_CACHE     = 'choir-static-v1';
const API_CACHE        = 'choir-api-v1';

// Static assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install ────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ───────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Remove old caches
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(k => ![CACHE_NAME, STATIC_CACHE, API_CACHE].includes(k))
            .map(k => caches.delete(k))
        )
      ),
    ])
  );
});

// ── Fetch Strategy ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip WebSocket
  if (event.request.url.startsWith('ws')) return;

  // API calls → Network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  // Static assets → Cache first, fall back to network
  event.respondWith(cacheFirst(event.request, STATIC_CACHE));
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline — return cached version
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return offline JSON for API
    return new Response(JSON.stringify({
      success: false,
      offline: true,
      message: 'You are offline. Data shown may be outdated.',
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    });
  }
}

async function cacheFirst(request, cacheName) {
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
    // Return offline page for navigation
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    return new Response('Offline', { status: 503 });
  }
}

// ── Skip waiting on message ────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Push Notifications ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title   = data.title   || 'Inheritance Choir';
  const body    = data.message || 'You have a new notification';
  const options = {
    body,
    icon:  '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag:   data.id || 'choir-notif',
    data:  { url: data.actionUrl || '/dashboard' },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Background Sync ────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-contributions') {
    event.waitUntil(syncOfflineData('choir_pending_contributions', '/api/v1/contributions'));
  }
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncOfflineData('choir_pending_attendance', '/api/v1/attendance/bulk'));
  }
});

async function syncOfflineData(storageKey, endpoint) {
  const pending = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (!pending.length) return;
  const sent = [];
  for (const item of pending) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      sent.push(item.id);
    } catch {}
  }
  const remaining = pending.filter(p => !sent.includes(p.id));
  localStorage.setItem(storageKey, JSON.stringify(remaining));
}
