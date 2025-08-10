import { useState } from "react";
import Header from "@/components/layout/header";
import ActiveCampaigns from "@/components/dashboard/active-campaigns";
import CreateCampaignModal from "@/components/modals/create-campaign-modal";

export default function Campaigns() {
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);

  return (
    <>
      <Header
        title="Campaigns"
        description="Create and manage your referral marketing campaigns."
        createButtonText="Create Campaign"
        onCreateClick={() => setShowCreateCampaignModal(true)}
        showCreateButton={true}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <ActiveCampaigns onCreateCampaign={() => setShowCreateCampaignModal(true)} />
        </div>
      </main>

      <CreateCampaignModal
        isOpen={showCreateCampaignModal}
        onClose={() => setShowCreateCampaignModal(false)}
      />
    </>
  );
}
