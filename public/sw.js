
const CACHE_NAME = 'fruitbox-pwa-v4';
const STATIC_CACHE = 'fruitbox-static-v4';
const DYNAMIC_CACHE = 'fruitbox-dynamic-v4';

// Essential files for offline functionality
const staticAssets = [
  '/',
  '/register',
  '/customer-app',
  '/bill-scanner',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png'
];

// Install service worker with cache cleanup
self.addEventListener('install', (event) => {
  console.log('Service Worker installing v4...');
  event.waitUntil(
    Promise.all([
      // Clear old caches first
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Cache new static assets
      caches.open(STATIC_CACHE).then(cache => {
        return Promise.allSettled(
          staticAssets.map(asset => 
            fetch(asset, { cache: 'no-cache' }).then(response => {
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
      self.skipWaiting()
    ])
  );
});

// Activate service worker and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating v4...');
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Cleaning up old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch strategy with cache-first for static, network-first for dynamic
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - always go to network first for fresh data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then(response => {
          // Cache successful API responses temporarily
          if (response.ok && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets and pages - network first to get latest content
  event.respondWith(
    fetch(request, { cache: 'no-cache' })
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(request);
      })
  );
});

// Handle skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker skipping waiting...');
    self.skipWaiting();
  }
});

// Background sync for offline bill submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-bills') {
    console.log('Background sync triggered for bills');
    event.waitUntil(syncPendingBills());
  }
});

async function syncPendingBills() {
  try {
    // Get pending bills from IndexedDB or localStorage
    const pendingBills = JSON.parse(localStorage.getItem('pendingBills') || '[]');
    
    for (const bill of pendingBills) {
      try {
        const response = await fetch('/api/bills/submit-for-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bill)
        });
        
        if (response.ok) {
          // Remove from pending list
          const updatedPending = pendingBills.filter(b => b.id !== bill.id);
          localStorage.setItem('pendingBills', JSON.stringify(updatedPending));
          console.log('Synced pending bill:', bill.id);
        }
      } catch (error) {
        console.error('Failed to sync bill:', bill.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
