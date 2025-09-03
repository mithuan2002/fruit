import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

// Enhanced service worker registration for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Register service worker for PWA functionality
      if (true) {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', registration.scope);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                console.log('New service worker content available');
              }
            });
          }
        });

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Service Worker is ready');
      }

      // Handle PWA install prompt (works with or without SW)
      let deferredPrompt: any;
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('beforeinstallprompt event fired');
        e.preventDefault();
        deferredPrompt = e;
        (window as any).deferredPrompt = deferredPrompt;
        
        // Show install prompt after a delay
        setTimeout(() => {
          const event = new CustomEvent('pwa-installable');
          window.dispatchEvent(event);
        }, 2000);
      });

      // Check if app is already installed
      window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        localStorage.setItem('pwa-installed', 'true');
        (window as any).deferredPrompt = null;
      });

    } catch (error) {
      console.warn('Service Worker registration failed:', error.message);
    }
  });

  // Handle offline/online status
  window.addEventListener('online', () => {
    document.body.classList.remove('offline');
    console.log('App is online');
  });

  window.addEventListener('offline', () => {
    document.body.classList.add('offline');
    console.log('App is offline');
  });
} else {
  console.log('Service Worker not supported');
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);