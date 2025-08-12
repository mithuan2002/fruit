import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import ActiveCampaigns from "@/components/dashboard/active-campaigns";
import CreateCampaignModal from "@/components/modals/create-campaign-modal";
import CampaignDetailsModal from "@/components/modals/campaign-details-modal";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";
import type { Campaign } from "@shared/schema";

export default function Campaigns() {
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [showCampaignDetailsModal, setShowCampaignDetailsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignDetailsModal(true);
  };

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
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">🚀 Campaigns</h1>
              <p className="text-gray-600 mt-1">Create and manage targeted referral marketing campaigns</p>
            </div>
            <Link href="/campaigns-setup-guide">
              <Button variant="outline" className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Setup Guide
              </Button>
            </Link>
          </div>

          <ActiveCampaigns 
            onCreateCampaign={() => setShowCreateCampaignModal(true)}
            onCampaignClick={handleCampaignClick}
          />
        </div>
      </main>

      <CreateCampaignModal
        isOpen={showCreateCampaignModal}
        onClose={() => setShowCreateCampaignModal(false)}
      />

      <CampaignDetailsModal
        isOpen={showCampaignDetailsModal}
        onClose={() => {
          setShowCampaignDetailsModal(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
      />
    </>
  );
}
