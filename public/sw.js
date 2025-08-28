
const CACHE_NAME = 'fruitbox-pwa-v3';
const STATIC_CACHE = 'fruitbox-static-v3';
const DYNAMIC_CACHE = 'fruitbox-dynamic-v3';

// Essential files for offline functionality
const staticAssets = [
  '/',
  '/register',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png'
];

// Install service worker with better error handling
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      // Cache static assets with individual error handling
      caches.open(STATIC_CACHE).then(cache => {
        return Promise.allSettled(
          staticAssets.map(asset => 
            fetch(asset).then(response => {
              if (response.ok) {
                return cache.put(asset, response);
              }
              console.warn(`Failed to cache ${asset}:`, response.status);
            }).catch(err => {
              console.warn(`Error caching ${asset}:`, err);
            })
          )
        );
      }),
      // Cache manifest separately - don't fail installation if it fails
      caches.open(STATIC_CACHE).then(cache => {
        return fetch('/api/pwa/manifest')
          .then(response => {
            if (response.ok) {
              return cache.put('/api/pwa/manifest', response);
            }
          })
          .catch(err => {
            console.warn('Manifest caching failed:', err);
          });
      }),
      self.skipWaiting()
    ])
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.allSettled(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated successfully');
    }).catch(err => {
      console.error('Service Worker activation failed:', err);
    })
  );
});

// Fetch event with cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with better error handling
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.ok && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            }).catch(err => {
              console.warn('Failed to cache API response:', err);
            });
          }
          return response;
        })
        .catch(err => {
          console.warn('API request failed, trying cache:', request.url);
          // Return cached version if network fails
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return a basic error response if no cache available
            return new Response(JSON.stringify({ error: 'Network unavailable' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
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
