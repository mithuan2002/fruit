import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import Customers from "@/pages/customers";
import PointsSetupPage from "@/pages/points-setup"; // Renamed from PointsSetup
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
  const [location] = useLocation();
  
  // Check if current path is registration or customer app - show without sidebar
  if (location === '/register') {
    return <CustomerRegistration />;
  }

  if (location === '/customer-app') {
    return <CustomerApp />;
  }

  // Main app with sidebar
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/customers" component={Customers} />
          <Route path="/points-setup" component={PointsSetupPage} />
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
          <Route path="/cashier" component={CashierDashboard} />
          <Route path="/landing" component={Landing} />
          <Route component={Dashboard} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    console.log('App component mounted');

    // Only register service worker in production
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
        })
        .catch((registrationError) => {
          console.log('Service Worker registration skipped in development');
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;