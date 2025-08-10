import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Plus, MoreHorizontal } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Campaign } from "@shared/schema";

interface ActiveCampaignsProps {
  onCreateCampaign: () => void;
  onCampaignClick?: (campaign: Campaign) => void;
}

export default function ActiveCampaigns({ onCreateCampaign, onCampaignClick }: ActiveCampaignsProps) {
  const { data: campaigns, isLoading, refetch } = useQuery({
    queryKey: ["/api/campaigns/active"],
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Active Campaigns</h3>
          <Button variant="ghost" className="text-primary hover:text-blue-700 text-sm font-medium">
            View All
          </Button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {campaigns?.length > 0 ? (
          campaigns.map((campaign: Campaign) => {
            const progress = campaign.goalCount > 0 ? (campaign.referralsCount / campaign.goalCount) * 100 : 0;
            const isActive = new Date(campaign.endDate) > new Date();
            
            return (
              <div key={campaign.id} className="p-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => onCampaignClick?.(campaign)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                      <Badge 
                        variant={isActive ? "default" : "secondary"} 
                        className={`ml-2 ${isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {isActive ? "Active" : "Upcoming"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Ends {new Date(campaign.endDate).toLocaleDateString()}</span>
                      <span className="mx-2">•</span>
                      <span>{campaign.participantCount} participants</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{campaign.referralsCount} referrals</div>
                      <div className="text-xs text-gray-500">Goal: {campaign.goalCount}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCampaignClick?.(campaign);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-900 font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="mt-2" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No active campaigns found.</p>
          </div>
        )}
      </div>
      <div className="px-6 py-3 bg-gray-50 text-center">
        <Button 
          variant="ghost" 
          onClick={onCreateCampaign}
          className="text-primary hover:text-blue-700 text-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Campaign
        </Button>
      </div>
    </Card>
  );
}
