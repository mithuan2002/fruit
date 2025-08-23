import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if user is authenticated but hasn't completed onboarding
  if (isAuthenticated && user && user.isOnboarded !== true) {
    return <Onboarding />;
  }

  // If authenticated, show the main app with sidebar
  if (isAuthenticated) {
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
            <Route path="*">
              <Redirect to="/dashboard" />
            </Route>
          </Switch>
        </div>
      </div>
    );
  }

  // If not authenticated, show public routes (landing page, auth, customer registration, and onboarding)
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/register" component={CustomerRegistration} />
      <Route path="/auth" component={Auth} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/bill-scanner" component={BillScanner} />
      <Route path="/cashier" component={CashierDashboard} />
      <Route component={Landing} />
    </Switch>
  );
}

function App() {
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