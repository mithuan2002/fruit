import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Landing from '@/pages/landing';
import Dashboard from '@/pages/dashboard';
import Customers from '@/pages/customers';
import Campaigns from '@/pages/campaigns';
import Products from '@/pages/products';
import Reports from '@/pages/reports';
import Settings from '@/pages/settings';
import Auth from '@/pages/auth';
import Onboarding from '@/pages/onboarding';
import CustomerRegistration from '@/pages/customer-registration';
import CustomerApp from '@/pages/customer-app';
import NotFound from '@/pages/not-found';
import CashierDashboard from '@/pages/cashier-dashboard';
import Coupons from '@/pages/coupons';
import QRGenerator from '@/pages/qr-generator';
import POSIntegration from '@/pages/pos-integration';
import BillScanner from '@/pages/bill-scanner';
import SalesProcessing from '@/pages/sales-processing';
import BillVerification from '@/pages/bill-verification';
import PointsSetup from '@/pages/points-setup';
import DashboardSetupGuide from '@/pages/dashboard-setup-guide';
import PointsSetupGuide from '@/pages/points-setup-guide';
import CustomersSetupGuide from '@/pages/customers-setup-guide';
import CampaignsSetupGuide from '@/pages/campaigns-setup-guide';
import { useEffect } from 'react';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    console.log('App component mounted');

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      console.log('PWA install prompt available');
    };

    // Handle PWA app installation
    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
      (window as any).deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('New service worker version available');
          });
        })
        .catch((registrationError) => {
          console.error('Service Worker registration failed:', registrationError);
        });
    }

    // Add manifest link to head if not present
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/api/pwa/manifest';
      document.head.appendChild(manifestLink);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/products" element={<Products />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/customer-registration" element={<CustomerRegistration />} />
            <Route path="/customer/:id" element={<CustomerApp />} />
            <Route path="/cashier" element={<CashierDashboard />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/qr-generator" element={<QRGenerator />} />
            <Route path="/pos-integration" element={<POSIntegration />} />
            <Route path="/bill-scanner" element={<BillScanner />} />
            <Route path="/sales-processing" element={<SalesProcessing />} />
            <Route path="/bill-verification" element={<BillVerification />} />
            <Route path="/points-setup" element={<PointsSetup />} />
            <Route path="/dashboard-setup-guide" element={<DashboardSetupGuide />} />
            <Route path="/points-setup-guide" element={<PointsSetupGuide />} />
            <Route path="/customers-setup-guide" element={<CustomersSetupGuide />} />
            <Route path="/campaigns-setup-guide" element={<CampaignsSetupGuide />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;