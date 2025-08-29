import React from "react";
import { Router, Route } from 'wouter';
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
      <div className="min-h-screen bg-background">
        <Router>
            <Route path="/" component={Landing} />
            <Route path="/auth" component={Auth} />
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/customers" component={Customers} />
            <Route path="/campaigns" component={Campaigns} />
            <Route path="/products" component={Products} />
            <Route path="/reports" component={Reports} />
            <Route path="/settings" component={Settings} />
            <Route path="/customer-registration" component={CustomerRegistration} />
            <Route path="/customer/:id" component={CustomerApp} />
            <Route path="/cashier" component={CashierDashboard} />
            <Route path="/coupons" component={Coupons} />
            <Route path="/qr-generator" component={QRGenerator} />
            <Route path="/pos-integration" component={POSIntegration} />
            <Route path="/bill-scanner" component={BillScanner} />
            <Route path="/sales-processing" component={SalesProcessing} />
            <Route path="/bill-verification" component={BillVerification} />
            <Route path="/points-setup" component={PointsSetup} />
            <Route path="/dashboard-setup-guide" component={DashboardSetupGuide} />
            <Route path="/points-setup-guide" component={PointsSetupGuide} />
            <Route path="/customers-setup-guide" component={CustomersSetupGuide} />
            <Route path="/campaigns-setup-guide" component={CampaignsSetupGuide} />
            <Route component={NotFound} />
          </Router>
      </div>
    </QueryClientProvider>
  );
}

export default App;