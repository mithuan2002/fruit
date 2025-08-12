import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import Customers from "@/pages/customers";
import Reports from "@/pages/reports";
import WhatsAppCenter from "@/pages/whatsapp-center";
import WhatsAppSetupGuide from "@/pages/whatsapp-setup-guide";
import DashboardSetupGuide from "@/pages/dashboard-setup-guide";
import CampaignsSetupGuide from "@/pages/campaigns-setup-guide";
import CustomersSetupGuide from "@/pages/customers-setup-guide";
import Auth from "@/pages/auth";
import Onboarding from "@/pages/onboarding";

import Sidebar from "@/components/layout/sidebar";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const isOnboarded = user?.isOnboarded === true;

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

  // Show landing page for root path when not authenticated
  if (!isAuthenticated && location === "/") {
    return <Landing />;
  }

  // Show auth page if not authenticated (except for landing page)
  if (!isAuthenticated) {
    return <Auth />;
  }

  // Show onboarding if authenticated but not onboarded
  if (!isOnboarded) {
    console.log("Showing onboarding for user:", user?.id, "isOnboarded:", user?.isOnboarded);
    return <Onboarding />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Switch>
          <Route path="/landing" component={Landing} />
          <Route path="/home" component={Landing} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/customers" component={Customers} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/whatsapp-center" component={WhatsAppCenter} />
          <Route path="/reports" component={Reports} />
          <Route path="/dashboard-setup-guide" component={DashboardSetupGuide} />
          <Route path="/campaigns-setup-guide" component={CampaignsSetupGuide} />
          <Route path="/customers-setup-guide" component={CustomersSetupGuide} />
          <Route path="/whatsapp-setup-guide" component={WhatsAppSetupGuide} />
          <Route path="/" component={Dashboard} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
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