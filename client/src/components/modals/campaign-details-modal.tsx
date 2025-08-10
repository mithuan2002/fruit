
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, Target, Gift, Edit2, Send } from "lucide-react";
import type { Campaign } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface CampaignDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
}

export default function CampaignDetailsModal({ 
  isOpen, 
  onClose, 
  campaign 
}: CampaignDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    rewardPerReferral: 0,
    startDate: "",
    endDate: "",
    goalCount: 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form data when campaign changes
  React.useEffect(() => {
    if (campaign) {
      setEditFormData({
        name: campaign.name,
        description: campaign.description || "",
        rewardPerReferral: campaign.rewardPerReferral,
        startDate: new Date(campaign.startDate).toISOString().split('T')[0],
        endDate: new Date(campaign.endDate).toISOString().split('T')[0],
        goalCount: campaign.goalCount,
      });
      setCustomMessage(`We've put new offers for this season and on referring/buying you can get rewards/points! Use your referral code: [COUPON_CODE]`);
    }
  }, [campaign]);

  const updateCampaignMutation = useMutation({
    mutationFn: async (updates: typeof editFormData) => {
      const response = await apiRequest("PUT", `/api/campaigns/${campaign?.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Campaign updated successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/active"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign.",
        variant: "destructive",
      });
    },
  });

  const sendCampaignMessagesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/campaigns/${campaign?.id}/send-messages`, {
        message: customMessage
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Campaign messages sent to all customers.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send messages.",
        variant: "destructive",
      });
    },
  });

  if (!campaign) return null;

  const progress = campaign.goalCount > 0 ? (campaign.referralsCount / campaign.goalCount) * 100 : 0;
  const isActive = new Date(campaign.endDate) > new Date();

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCampaignMutation.mutate(editFormData);
  };

  const handleSendMessages = () => {
    sendCampaignMessagesMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {campaign.name}
              <Badge 
                variant={isActive ? "default" : "secondary"}
                className={isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
              >
                {isActive ? "Active" : "Ended"}
              </Badge>
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editName">Campaign Name</Label>
              <Input
                id="editName"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editStartDate">Start Date</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={editFormData.startDate}
                  onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editEndDate">End Date</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editReward">Reward per Referral</Label>
                <Input
                  id="editReward"
                  type="number"
                  value={editFormData.rewardPerReferral}
                  onChange={(e) => setEditFormData({ ...editFormData, rewardPerReferral: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editGoal">Target Referrals</Label>
                <Input
                  id="editGoal"
                  type="number"
                  value={editFormData.goalCount}
                  onChange={(e) => setEditFormData({ ...editFormData, goalCount: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateCampaignMutation.isPending}
              >
                {updateCampaignMutation.isPending ? "Updating..." : "Update Campaign"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Campaign Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Participants</p>
                      <p className="text-lg font-semibold">{campaign.participantCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Referrals</p>
                      <p className="text-lg font-semibold">{campaign.referralsCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Gift className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-500">Reward</p>
                      <p className="text-lg font-semibold">{campaign.rewardPerReferral}pts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-500">Days Left</p>
                      <p className="text-lg font-semibold">
                        {isActive 
                          ? Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                          : 0
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Campaign Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{campaign.referralsCount} referrals</span>
                <span>Goal: {campaign.goalCount}</span>
              </div>
            </div>

            {/* Description */}
            {campaign.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{campaign.description}</p>
              </div>
            )}

            {/* Custom Message Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Send Campaign Message</h4>
              <p className="text-sm text-gray-500 mb-3">
                Send a custom message to all customers about this campaign. Use [COUPON_CODE] to include their referral code.
              </p>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your campaign message..."
                rows={3}
                className="mb-3"
              />
              <Button 
                onClick={handleSendMessages}
                disabled={sendCampaignMessagesMutation.isPending || !customMessage.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendCampaignMessagesMutation.isPending ? "Sending..." : "Send to All Customers"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
