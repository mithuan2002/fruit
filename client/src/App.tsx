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
  console.log('Router function called, pathname:', window.location.pathname);
  
  // Check if current path is registration or customer app - show without sidebar
  if (window.location.pathname === '/register') {
    return <CustomerRegistration />;
  }
  
  if (window.location.pathname === '/customer-app') {
    return <CustomerApp />;
  }

  // TEMPORARILY SHOW SIMPLE CONTENT FOR DEBUGGING
  return (
    <div style={{ padding: '20px', backgroundColor: 'white' }}>
      <h2 style={{ color: 'blue' }}>DEBUGGING: Router is working</h2>
      <p>Current path: {window.location.pathname}</p>
      <div style={{ marginTop: '20px' }}>
        <Switch>
          <Route path="/" component={() => <div style={{ color: 'green' }}>Dashboard Route Working!</div>} />
          <Route path="/dashboard" component={() => <div style={{ color: 'green' }}>Dashboard Route Working!</div>} />
          <Route path="*">
            <div style={{ color: 'orange' }}>Fallback route - redirecting to dashboard</div>
          </Route>
        </Switch>
      </div>
    </div>
  );
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

  console.log('App render called');

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
        <h1 style={{ padding: '20px', color: 'red' }}>DEBUGGING: App is rendering</h1>
        <Toaster />
        <Router />
      </div>
    </QueryClientProvider>
  );
}

export default App;