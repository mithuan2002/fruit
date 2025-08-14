import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Target, Gift, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Product, type Campaign } from "@shared/schema";

interface PointRule {
  id?: string;
  type: 'product' | 'campaign';
  targetId: string;
  targetName: string;
  productCode?: string;
  pointsType: 'fixed' | 'percentage';
  pointsValue: number;
  minQuantity?: number;
  description?: string;
  isActive: boolean;
}

export default function PointsSetupPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PointRule | null>(null);
  const [activeTab, setActiveTab] = useState<'product' | 'campaign'>('product');
  
  const [formData, setFormData] = useState<PointRule>({
    type: 'product',
    targetId: '',
    targetName: '',
    productCode: '',
    pointsType: 'fixed',
    pointsValue: 10,
    minQuantity: 1,
    description: '',
    isActive: true
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  // Mock point rules data - in a real app this would come from the database
  const { data: pointRules = [] } = useQuery<PointRule[]>({
    queryKey: ["/api/point-rules"],
    queryFn: () => {
      // For demo, return mock data based on existing products and campaigns
      const mockRules: PointRule[] = [];
      
      // Add some example product rules
      products.slice(0, 3).forEach((product, index) => {
        mockRules.push({
          id: `product-${product.id}`,
          type: 'product',
          targetId: product.id,
          targetName: product.name,
          pointsType: index % 2 === 0 ? 'fixed' : 'percentage',
          pointsValue: index % 2 === 0 ? 10 : 5,
          minQuantity: 1,
          description: `Points rule for ${product.name}`,
          isActive: true
        });
      });

      // Add some example campaign rules
      campaigns.slice(0, 2).forEach((campaign, index) => {
        mockRules.push({
          id: `campaign-${campaign.id}`,
          type: 'campaign',
          targetId: campaign.id,
          targetName: campaign.name,
          pointsType: 'fixed',
          pointsValue: 50,
          description: `Points rule for ${campaign.name}`,
          isActive: true
        });
      });

      return mockRules;
    }
  });

  const saveRuleMutation = useMutation({
    mutationFn: async (data: PointRule) => {
      // For now, we'll update the corresponding product or campaign
      if (data.type === 'product') {
        return await fetch(`/api/products/${data.targetId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            pointCalculationType: data.pointsType,
            fixedPoints: data.pointsType === 'fixed' ? data.pointsValue : null,
            percentageRate: data.pointsType === 'percentage' ? data.pointsValue.toString() : null,
            minimumQuantity: data.minQuantity || 1
          })
        }).then(r => r.json());
      } else {
        return await fetch(`/api/campaigns/${data.targetId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            pointCalculationType: data.pointsType,
            rewardPerReferral: data.pointsType === 'fixed' ? data.pointsValue : 0,
            percentageRate: data.pointsType === 'percentage' ? data.pointsValue.toString() : null
          })
        }).then(r => r.json());
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Points rule saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/point-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save points rule",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      type: activeTab,
      targetId: '',
      targetName: '',
      productCode: '',
      pointsType: 'fixed',
      pointsValue: 10,
      minQuantity: 1,
      description: '',
      isActive: true
    });
    setEditingRule(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.targetName) {
      toast({
        title: "Error",
        description: "Please enter a product name or select a product/campaign",
        variant: "destructive"
      });
      return;
    }

    // Ensure targetId is set for manual entries
    if (!formData.targetId && formData.targetName) {
      setFormData({ ...formData, targetId: 'manual-product' });
    }

    saveRuleMutation.mutate({
      ...formData,
      targetId: formData.targetId || 'manual-product'
    });
  };

  const editRule = (rule: PointRule) => {
    setFormData(rule);
    setEditingRule(rule);
    setActiveTab(rule.type);
    setIsDialogOpen(true);
  };

  const onTargetSelect = (targetId: string) => {
    const target = formData.type === 'product' 
      ? products.find(p => p.id === targetId)
      : campaigns.find(c => c.id === targetId);
    
    if (target) {
      const productCode = formData.type === 'product' ? (target as any).productCode : undefined;
      setFormData({
        ...formData,
        targetId,
        targetName: target.name,
        productCode: productCode || '',
        description: `Points rule for ${target.name}${productCode ? ` (${productCode})` : ''}`
      });
    }
  };

  const getPointsDisplay = (rule: PointRule) => {
    if (rule.pointsType === 'fixed') {
      return `${rule.pointsValue} points`;
    } else {
      return `${rule.pointsValue}% of purchase`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" data-testid="points-setup-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Points Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-300" data-testid="page-description">
            Set up and manage points rewards for products and campaigns in one simple interface
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setActiveTab('product')} 
              className="flex items-center gap-2"
              data-testid="button-add-points-rule"
            >
              <Plus className="w-4 h-4" />
              Add Points Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">
                {editingRule ? 'Edit Points Rule' : 'Add Points Rule'}
              </DialogTitle>
              <DialogDescription data-testid="dialog-description">
                Configure how customers earn points for products or campaigns
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="points-rule-form">
              <Tabs value={formData.type} onValueChange={(value) => {
                setFormData({ ...formData, type: value as 'product' | 'campaign' });
                setActiveTab(value as 'product' | 'campaign');
              }}>
                <TabsList className="grid w-full grid-cols-2" data-testid="tabs-type-selector">
                  <TabsTrigger value="product" data-testid="tab-product">Product Points</TabsTrigger>
                  <TabsTrigger value="campaign" data-testid="tab-campaign">Campaign Points</TabsTrigger>
                </TabsList>
                
                <TabsContent value="product" className="space-y-4">
                  <div>
                    <Label htmlFor="product-code">Product Code</Label>
                    <Input
                      id="product-code"
                      placeholder="Enter product code (e.g., SKU123)"
                      value={formData.productCode || ''}
                      onChange={(e) => {
                        const code = e.target.value;
                        setFormData({ ...formData, productCode: code });
                        
                        // Auto-find product by code
                        if (code.trim()) {
                          const product = products.find(p => p.productCode === code.trim());
                          if (product) {
                            setFormData({
                              ...formData,
                              productCode: code,
                              targetId: product.id,
                              targetName: product.name,
                              description: `Points rule for ${product.name} (${product.productCode})`
                            });
                          }
                        }
                      }}
                      data-testid="input-product-code"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="product-name">Product Name *</Label>
                    <Input
                      id="product-name"
                      placeholder="Enter product name"
                      value={formData.targetName || ''}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({ 
                          ...formData, 
                          targetName: name,
                          targetId: name ? 'manual-product' : '',
                          description: `Points rule for ${name}${formData.productCode ? ` (${formData.productCode})` : ''}`
                        });
                      }}
                      data-testid="input-product-name"
                    />
                  </div>
                  
                  {products.length > 0 && (
                    <div>
                      <Label htmlFor="product-select">Or Select from Existing Products</Label>
                      <Select value={formData.targetId === 'manual-product' ? '' : formData.targetId} onValueChange={onTargetSelect}>
                        <SelectTrigger data-testid="select-product">
                          <SelectValue placeholder="Choose from existing products" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id} data-testid={`option-product-${product.id}`}>
                              {product.productCode ? `[${product.productCode}] ` : ''}{product.name} - ${product.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {formData.targetId && formData.targetName && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <span className="font-medium">Selected:</span>
                        {formData.productCode && (
                          <span className="bg-green-100 px-2 py-1 rounded text-sm">
                            {formData.productCode}
                          </span>
                        )}
                        <span>{formData.targetName}</span>
                        {formData.targetId === 'manual-product' && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Manual Entry</span>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="campaign" className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-select">Select Campaign</Label>
                    <Select value={formData.targetId} onValueChange={onTargetSelect}>
                      <SelectTrigger data-testid="select-campaign">
                        <SelectValue placeholder="Choose a campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id} data-testid={`option-campaign-${campaign.id}`}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label htmlFor="points-type">Points Type</Label>
                <Select 
                  value={formData.pointsType} 
                  onValueChange={(value: 'fixed' | 'percentage') => 
                    setFormData({ ...formData, pointsType: value })
                  }
                >
                  <SelectTrigger data-testid="select-points-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed" data-testid="option-fixed">Fixed Points</SelectItem>
                    <SelectItem value="percentage" data-testid="option-percentage">Percentage of Purchase</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="points-value">
                  {formData.pointsType === 'fixed' ? 'Points Amount' : 'Percentage (%)'}
                </Label>
                <Input
                  id="points-value"
                  type="number"
                  value={formData.pointsValue}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    pointsValue: parseInt(e.target.value) || 0 
                  })}
                  placeholder={formData.pointsType === 'fixed' ? "10" : "5"}
                  data-testid="input-points-value"
                />
              </div>

              {formData.type === 'product' && (
                <div>
                  <Label htmlFor="min-quantity">Minimum Quantity</Label>
                  <Input
                    id="min-quantity"
                    type="number"
                    value={formData.minQuantity || 1}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      minQuantity: parseInt(e.target.value) || 1 
                    })}
                    min="1"
                    data-testid="input-min-quantity"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Christmas offer: refer to buy two hoodies and get 1 free"
                  className="resize-none"
                  rows={2}
                  data-testid="input-description"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saveRuleMutation.isPending}
                  data-testid="button-save-rule"
                >
                  {saveRuleMutation.isPending ? 'Saving...' : (editingRule ? 'Update' : 'Save')} Rule
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Setup Examples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20" data-testid="card-example-fixed">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800 dark:text-green-300">Fixed Points</h3>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">
              Give exactly 10 points for each product purchased
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20" data-testid="card-example-percentage">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">Percentage Points</h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Give 5% of purchase value as points (e.g., $20 = 1 point)
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20" data-testid="card-example-campaign">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-800 dark:text-purple-300">Campaign Special</h3>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-400">
              Special campaign: "Buy 2 hoodies, get 1 free" = 100 points
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Points Rules */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white" data-testid="current-rules-title">
          Current Points Rules
        </h2>
        
        {pointRules.length === 0 ? (
          <Card data-testid="card-no-rules">
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No points rules configured
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Add points rules to start rewarding customers for purchases and referrals
              </p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-rule">
                <Plus className="w-4 h-4 mr-2" />
                Add Points Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pointRules.map((rule) => (
              <Card 
                key={rule.id} 
                className={rule.isActive ? '' : 'opacity-60'} 
                data-testid={`card-rule-${rule.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base" data-testid={`text-rule-name-${rule.id}`}>
                        {rule.targetName}
                      </CardTitle>
                      <CardDescription data-testid={`text-rule-type-${rule.id}`}>
                        {rule.type === 'product' ? 'Product Rule' : 'Campaign Rule'}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={rule.type === 'product' ? 'default' : 'secondary'}
                      data-testid={`badge-type-${rule.id}`}
                    >
                      {rule.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Points:</span>
                      <span 
                        className="font-semibold text-green-600" 
                        data-testid={`text-points-display-${rule.id}`}
                      >
                        {getPointsDisplay(rule)}
                      </span>
                    </div>
                    
                    {rule.minQuantity && rule.minQuantity > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Min Qty:</span>
                        <span data-testid={`text-min-qty-${rule.id}`}>
                          {rule.minQuantity}
                        </span>
                      </div>
                    )}
                    
                    {rule.description && (
                      <p 
                        className="text-xs text-gray-500 dark:text-gray-400 mt-2" 
                        data-testid={`text-description-${rule.id}`}
                      >
                        {rule.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => editRule(rule)}
                      data-testid={`button-edit-${rule.id}`}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-${rule.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}