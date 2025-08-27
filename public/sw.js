const CACHE_NAME = 'fruitbox-pwa-v2';
const STATIC_CACHE = 'fruitbox-static-v2';
const DYNAMIC_CACHE = 'fruitbox-dynamic-v2';

// Essential files for offline functionality
const staticAssets = [
  '/',
  '/register',
  '/track', // Added for the new tracking page
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/api/pwa/manifest'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(staticAssets)),
      self.skipWaiting()
    ])
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event with cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets and pages
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Fetch from network and cache
        return fetch(request).then(response => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(() => {
        // Fallback for offline registration page
        if (request.destination === 'document' && url.pathname === '/register') {
          return caches.match('/register') || caches.match('/');
        }
        // Fallback for offline tracking page
        if (request.destination === 'document' && url.pathname === '/track') {
          return caches.match('/track') || caches.match('/');
        }
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'You have new rewards available!',
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Rewards',
        icon: '/pwa-icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/pwa-icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Fruitbox Rewards', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app when notification is clicked
    event.waitUntil(
      clients.openWindow('/register')
    );
  }
});