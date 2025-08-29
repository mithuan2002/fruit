import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { X, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Product } from "@shared/schema";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCampaignModal({ isOpen, onClose }: CreateCampaignModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rewardPerReferral: 50,
    startDate: "",
    endDate: "",
    goalCount: 100,
    pointCalculationType: "fixed",
    percentageRate: "",
    minimumPurchase: "0",
    maximumPoints: "",
    selectedProducts: [] as string[],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active products for selection
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/active"],
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: typeof formData) => {
      const response = await apiRequest("POST", "/api/campaigns", campaignData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Campaign created successfully.",
      });
      setFormData({
        name: "",
        description: "",
        rewardPerReferral: 50,
        startDate: "",
        endDate: "",
        goalCount: 100,
        pointCalculationType: "fixed",
        percentageRate: "",
        minimumPurchase: "0",
        maximumPoints: "",
        selectedProducts: [],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/active"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign.",
        variant: "destructive",
      });
    },
  });

  // Product selection handlers
  const handleProductToggle = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]
    }));
  };

  const handleSelectAllProducts = () => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.length === products.length 
        ? [] 
        : products.map(p => p.id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast({
        title: "Error",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create New Campaign</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter campaign name"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rewardPerReferral">Reward per Referral</Label>
              <Input
                id="rewardPerReferral"
                type="number"
                value={formData.rewardPerReferral}
                onChange={(e) => setFormData({ ...formData, rewardPerReferral: parseInt(e.target.value) || 0 })}
                placeholder="Enter points value"
                required
              />
            </div>
            <div>
              <Label htmlFor="goalCount">Target Referrals</Label>
              <Input
                id="goalCount"
                type="number"
                value={formData.goalCount}
                onChange={(e) => setFormData({ ...formData, goalCount: parseInt(e.target.value) || 0 })}
                placeholder="Enter goal"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Campaign Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the campaign..."
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Select Products for Campaign</h3>
              <span className="text-sm text-muted-foreground">
                {formData.selectedProducts.length} selected
              </span>
            </div>
            
            {isLoadingProducts ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="text-center py-6">
                  <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    No products available for campaigns.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Go to Products page to add products first, then create campaigns.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={formData.selectedProducts.length === products.length}
                    onCheckedChange={handleSelectAllProducts}
                    data-testid="checkbox-select-all-products"
                  />
                  <Label htmlFor="select-all" className="text-sm">
                    Select all products ({products.length})
                  </Label>
                </div>
                
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                  {products.map((product: Product) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={formData.selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleProductToggle(product.id)}
                        data-testid={`checkbox-product-${product.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={`product-${product.id}`} 
                          className="text-sm font-medium cursor-pointer"
                        >
                          {product.name}
                        </Label>
                        <p className="text-xs text-muted-foreground truncate">
                          {product.productCode && `${product.productCode} • `}
                          ${parseFloat(product.price).toFixed(2)}
                          {product.category && ` • ${product.category}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Point Calculation Rules</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="pointCalculationType">Calculation Type</Label>
                <Select
                  value={formData.pointCalculationType}
                  onValueChange={(value) => setFormData({ ...formData, pointCalculationType: value })}
                >
                  <SelectTrigger data-testid="select-point-calculation-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Points</SelectItem>
                    <SelectItem value="percentage">Percentage of Sale Amount</SelectItem>
                    <SelectItem value="tier">Tier-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.pointCalculationType === "percentage" && (
                <div>
                  <Label htmlFor="percentageRate">Percentage Rate (%)</Label>
                  <Input
                    id="percentageRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    data-testid="input-percentage-rate"
                    value={formData.percentageRate}
                    onChange={(e) => setFormData({ ...formData, percentageRate: e.target.value })}
                    placeholder="e.g., 5 for 5%"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimumPurchase">Minimum Purchase ($)</Label>
                  <Input
                    id="minimumPurchase"
                    type="number"
                    step="0.01"
                    min="0"
                    data-testid="input-minimum-purchase"
                    value={formData.minimumPurchase}
                    onChange={(e) => setFormData({ ...formData, minimumPurchase: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="maximumPoints">Maximum Points per Sale</Label>
                  <Input
                    id="maximumPoints"
                    type="number"
                    min="0"
                    data-testid="input-maximum-points"
                    value={formData.maximumPoints}
                    onChange={(e) => setFormData({ ...formData, maximumPoints: e.target.value })}
                    placeholder="Optional limit"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-blue-700 text-white"
              disabled={createCampaignMutation.isPending}
              data-testid="button-submit-campaign"
            >
              {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
