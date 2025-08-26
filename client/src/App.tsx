import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  const { isAuthenticated, isLoading, user } = useAuth();

  // Check if current path is registration - show without sidebar
  if (window.location.pathname === '/register') {
    return <CustomerRegistration />;
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
          <Route path="/cashier" component={CashierDashboard} />
          <Route path="/landing" component={Landing} />
          <Route path="*">
            <Redirect to="/dashboard" />
          </Route>
        </Switch>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;