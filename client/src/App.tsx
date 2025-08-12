import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
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

import Sidebar from "@/components/layout/sidebar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

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

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/customers" component={Customers} />
          <Route path="/reports" component={Reports} />
          <Route path="/whatsapp-center" component={WhatsAppCenter} />
          <Route path="/whatsapp-setup-guide" component={WhatsAppSetupGuide} />
          <Route path="/dashboard-setup-guide" component={DashboardSetupGuide} />
          <Route path="/campaigns-setup-guide" component={CampaignsSetupGuide} />
          <Route path="/customers-setup-guide" component={CustomersSetupGuide} />
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