import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import Customers from "@/pages/customers";
import PointsSetup from "@/pages/points-setup";
import Reports from "@/pages/reports";
import POSIntegration from "@/pages/pos-integration";
import CustomerRegistration from "@/pages/customer-registration";
import CustomerApp from "@/pages/customer-app";
import QRGenerator from "@/pages/qr-generator";
import DashboardSetupGuide from "@/pages/dashboard-setup-guide";
import CampaignsSetupGuide from "@/pages/campaigns-setup-guide";
import CustomersSetupGuide from "@/pages/customers-setup-guide";
import PointsSetupGuide from "@/pages/points-setup-guide";
import Auth from "@/pages/auth";
import Onboarding from "@/pages/onboarding";
import Landing from "@/pages/landing";
import Settings from "@/pages/settings";
import BillScanner from "@/pages/bill-scanner";
import CashierDashboard from "@/pages/cashier-dashboard";

import Sidebar from "@/components/layout/sidebar";

function Router() {
  try {
    // Check if current path is registration or customer app - show without sidebar
    if (window.location.pathname === '/register') {
      return <CustomerRegistration />;
    }

    if (window.location.pathname === '/customer-app') {
      return <CustomerApp />;
    }

    // TEMPORARILY DISABLED AUTHENTICATION FOR TESTING
    // Always show the main app with sidebar (bypassing auth checks)
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/campaigns" component={Campaigns} />
            <Route path="/customers" component={Customers} />
            <Route path="/points-setup" component={PointsSetup} />
            <Route path="/reports" component={Reports} />
            <Route path="/pos-integration" component={POSIntegration} />
            <Route path="/qr-generator" component={QRGenerator} />
            <Route path="/settings" component={Settings} />
            <Route path="/dashboard-setup-guide" component={DashboardSetupGuide} />
            <Route path="/campaigns-setup-guide" component={CampaignsSetupGuide} />
            <Route path="/customers-setup-guide" component={CustomersSetupGuide} />
            <Route path="/points-setup-guide" component={PointsSetupGuide} />
            <Route path="/auth" component={Auth} />
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/bill-scanner" component={BillScanner} />
            <Route path="/bill-verification" component={React.lazy(() => import('./pages/bill-verification'))} />
            <Route path="/cashier" component={CashierDashboard} />
            <Route path="/landing" component={Landing} />
            <Route path="*">
              <Redirect to="/dashboard" />
            </Route>
          </Switch>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Router error:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Error in Router</h2>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}

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
      <Router />
    </QueryClientProvider>
  );
}

export default App;