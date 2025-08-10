import { useState } from "react";
import Header from "@/components/layout/header";
import StatsGrid from "@/components/dashboard/stats-grid";
import ActiveCampaigns from "@/components/dashboard/active-campaigns";
import QuickActions from "@/components/dashboard/quick-actions";
import CouponManagement from "@/components/dashboard/coupon-management";
import TopPerformers from "@/components/dashboard/top-performers";
import CreateCampaignModal from "@/components/modals/create-campaign-modal";

export default function Dashboard() {
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);

  return (
    <>
      <Header
        title="Dashboard"
        description="Welcome back! Here's what's happening with your referral campaigns."
        onCreateClick={() => setShowCreateCampaignModal(true)}
        createButtonText="New Campaign"
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <StatsGrid />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActiveCampaigns onCreateCampaign={() => setShowCreateCampaignModal(true)} />
            </div>
            <div className="space-y-6">
              <QuickActions />
            </div>
          </div>

          <CouponManagement />
          <TopPerformers />
        </div>
      </main>

      <CreateCampaignModal
        isOpen={showCreateCampaignModal}
        onClose={() => setShowCreateCampaignModal(false)}
      />
    </>
  );
}
