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

// Cache customer data for offline access
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_CUSTOMER_DATA') {
    const customerData = event.data.data;

    // Store customer data in cache
    caches.open(CACHE_NAME).then(cache => {
      const response = new Response(JSON.stringify(customerData));
      cache.put(`/api/customer-data/${customerData.phoneNumber}`, response);
    });

    // Send confirmation back to client
    event.ports[0].postMessage({ success: true });
  }

  // Handle skip waiting message
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Show notification when new rewards are available
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have new rewards waiting!',
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
      tag: 'rewards-notification',
      actions: [
        {
          action: 'view',
          title: 'View Rewards'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Fruitbox Rewards', options)
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow('/track')
    );
  }
});