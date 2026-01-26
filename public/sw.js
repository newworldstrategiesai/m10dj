/**
 * Service Worker for karaoke application
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'karaoke-v1.0.0';
const STATIC_CACHE = 'karaoke-static-v1.0.0';
const API_CACHE = 'karaoke-api-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
  // Add critical CSS/JS files here
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/karaoke/queue',
  '/api/karaoke/check-status',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Network first for API calls
  networkFirst: async (request) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Cache successful responses
        const cache = await caches.open(API_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      // Fallback to cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  },

  // Cache first for static assets
  cacheFirst: async (request) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      // Only show offline fallback if browser is actually offline
      // Don't show offline page for network errors when online - let the app handle errors
      if (request.destination === 'document' && !navigator.onLine) {
        const offlineResponse = new Response(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Offline - Karaoke</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  text-align: center;
                  padding: 2rem;
                  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
                  color: white;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .container {
                  max-width: 400px;
                  background: rgba(255, 255, 255, 0.1);
                  padding: 2rem;
                  border-radius: 1rem;
                  backdrop-filter: blur(10px);
                }
                h1 { margin-bottom: 1rem; }
                p { margin-bottom: 2rem; opacity: 0.9; }
                button {
                  background: white;
                  color: #06b6d4;
                  border: none;
                  padding: 0.75rem 1.5rem;
                  border-radius: 0.5rem;
                  font-weight: 600;
                  cursor: pointer;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🎤 You're Offline</h1>
                <p>Check your internet connection and try again. Your karaoke session will be saved.</p>
                <button onclick="window.location.reload()">Try Again</button>
              </div>
            </body>
          </html>
          `,
          {
            headers: { 'Content-Type': 'text/html' }
          }
        );
        return offlineResponse;
      }
      // If online but network request failed, throw error to let the app handle it
      throw error;
    }
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (not same origin)
  if (url.origin !== self.location.origin) return;

  // CRITICAL: Never intercept signin/auth pages - they must always go to network
  // These pages need fresh content and should never be cached or show offline fallback
  if (url.pathname.startsWith('/signin') ||
      url.pathname.startsWith('/signup') ||
      url.pathname.startsWith('/auth/') ||
      url.pathname.startsWith('/api/auth/')) {
    // Let the request pass through to network without service worker interception
    return;
  }

  // Handle API requests with network-first strategy
  if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }

  // Handle karaoke-related pages
  if (url.pathname.includes('/karaoke') ||
      url.pathname.includes('/organizations') ||
      url.pathname === '/') {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
    return;
  }

  // Default cache-first for other requests
  event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'karaoke-offline-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Push notifications for karaoke updates
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'Karaoke update available',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/karaoke'
    },
    actions: [
      {
        action: 'view',
        title: 'View Status'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Karaoke Update', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data.url || '/karaoke')
    );
  }
});

// Periodic cleanup of old cached data
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(cleanupCache());
  }
});

// Cache cleanup function
async function cleanupCache() {
  const cache = await caches.open(API_CACHE);
  const keys = await cache.keys();

  // Remove cache entries older than 1 hour
  const oneHourAgo = Date.now() - (60 * 60 * 1000);

  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const date = response.headers.get('date');
      if (date && new Date(date).getTime() < oneHourAgo) {
        await cache.delete(request);
      }
    }
  }
}

// Sync offline data when back online
async function syncOfflineData() {
  try {
    // Get offline queue from main thread
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_OFFLINE_DATA'
      });
    }
  } catch (error) {
    console.error('Offline sync failed:', error);
  }
}

// Log important events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'LOG_EVENT') {
    console.log('SW Event:', event.data.payload);
  }
});