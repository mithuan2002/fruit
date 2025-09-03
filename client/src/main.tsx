import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

// Enhanced service worker registration for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      // Handle PWA install prompt
      let deferredPrompt: any;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        (window as any).deferredPrompt = deferredPrompt;
      });

      // Check if app is already installed
      window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        localStorage.setItem('pwa-installed', 'true');
      });

    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  });

  // Handle offline/online status
  window.addEventListener('online', () => {
    document.body.classList.remove('offline');
  });

  window.addEventListener('offline', () => {
    document.body.classList.add('offline');
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);