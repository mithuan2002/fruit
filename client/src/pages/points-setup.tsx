
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Target, Gift, Calculator, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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

interface NewProduct {
  name: string;
  productCode: string;
  price: string;
  description?: string;
  category?: string;
}

interface NewCampaign {
  name: string;
  description: string;
  pointsType: 'fixed' | 'percentage';
  pointsValue: number;
  selectedProducts: string[];
  newProducts: NewProduct[];
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

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    name: '',
    description: '',
    pointsType: 'fixed',
    pointsValue: 50,
    selectedProducts: [],
    newProducts: []
  });

  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    productCode: '',
    price: '',
    description: '',
    category: 'General'
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

  // Create new campaign with products
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: NewCampaign) => {
      // First, create any new products
      const createdProducts = [];
      for (const product of campaignData.newProducts) {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...product,
            isActive: true,
            pointCalculationType: 'inherit'
          }),
        });
        if (response.ok) {
          const createdProduct = await response.json();
          createdProducts.push(createdProduct.id);
        }
      }

      // Create the campaign
      const campaignResponse = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignData.name,
          description: campaignData.description,
          pointCalculationType: campaignData.pointsType,
          rewardPerReferral: campaignData.pointsType === 'fixed' ? campaignData.pointsValue : 0,
          percentageRate: campaignData.pointsType === 'percentage' ? campaignData.pointsValue.toString() : null,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          isActive: true
        }),
      });

      if (!campaignResponse.ok) {
        throw new Error("Failed to create campaign");
      }

      return campaignResponse.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Campaign Created",
        description: `Successfully created campaign: ${newCampaign.name}`,
      });

      // Reset form
      setNewCampaign({
        name: '',
        description: '',
        pointsType: 'fixed',
        pointsValue: 50,
        selectedProducts: [],
        newProducts: []
      });

      setIsDialogOpen(false);
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/point-rules"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const saveRuleMutation = useMutation({
    mutationFn: async (ruleData: PointRule) => {
      console.log('Saving rule:', ruleData);

      // For campaign rules, use the campaign API endpoint
      if (ruleData.type === 'campaign' && editingRule) {
        const response = await fetch(`/api/campaigns/${editingRule.targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pointCalculationType: ruleData.pointsType,
            rewardPerReferral: ruleData.pointsType === 'fixed' ? ruleData.pointsValue : 0,
            percentageRate: ruleData.pointsType === 'percentage' ? ruleData.pointsValue.toString() : null
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update campaign');
        }

        return { success: true, message: 'Campaign points updated successfully' };
      }

      // For new rules or product rules, use the point-rules endpoint
      const url = editingRule && ruleData.type === 'product' ? `/api/point-rules/${editingRule.id}` : '/api/point-rules';
      const method = editingRule && ruleData.type === 'product' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingRule ? 'update' : 'create'} point rule`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Point rule saved:', data);
      toast({
        title: "Success",
        description: data.message || `Point rule ${editingRule ? 'updated' : 'created'} successfully`,
      });

      // Refresh the point rules data
      queryClient.invalidateQueries({ queryKey: ["/api/point-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });

      // Reset form
      resetForm();
    },
    onError: (error: Error) => {
      console.error('Failed to save point rule:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPointRuleMutation = useMutation({
    mutationFn: async (ruleData: PointRule) => {
      const response = await fetch("/api/point-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ruleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create point rule");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Points Rule Added",
        description: data.message || `Successfully added points rule for ${formData.targetName}`,
      });

      // Reset form
      setFormData({
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

      setIsDialogOpen(false);
      setEditingRule(null);

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["/api/point-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add points rule",
        variant: "destructive",
      });
    },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.targetName || !formData.pointsValue) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Use the saveRuleMutation for both creation and updating
    saveRuleMutation.mutate(formData);
  };

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCampaign.name || (!newCampaign.selectedProducts.length && !newCampaign.newProducts.length)) {
      toast({
        title: "Missing Information",
        description: "Please provide campaign name and select or add at least one product",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate(newCampaign);
  };

  const editRule = (rule: PointRule) => {
    setEditingRule(rule);
    setFormData({
      ...rule,
      targetId: rule.targetId || rule.id || '',
      type: rule.type
    });
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

  const addNewProduct = () => {
    if (!newProduct.name || !newProduct.productCode || !newProduct.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in product name, code, and price",
        variant: "destructive",
      });
      return;
    }

    setNewCampaign({
      ...newCampaign,
      newProducts: [...newCampaign.newProducts, { ...newProduct }]
    });

    setNewProduct({
      name: '',
      productCode: '',
      price: '',
      description: '',
      category: 'General'
    });
  };

  const removeNewProduct = (index: number) => {
    setNewCampaign({
      ...newCampaign,
      newProducts: newCampaign.newProducts.filter((_, i) => i !== index)
    });
  };

  const toggleProductSelection = (productId: string) => {
    setNewCampaign({
      ...newCampaign,
      selectedProducts: newCampaign.selectedProducts.includes(productId)
        ? newCampaign.selectedProducts.filter(id => id !== productId)
        : [...newCampaign.selectedProducts, productId]
    });
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

        <div className="flex items-center gap-3">
          <Link href="/points-setup-guide">
            <Button variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Setup Guide
            </Button>
          </Link>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingRule(null);
                  setFormData({
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
                  setActiveTab('product');
                }}
                className="flex items-center gap-2"
                data-testid="button-add-points-rule"
              >
                <Plus className="w-4 h-4" />
                Add Points Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle data-testid="dialog-title">
                  {editingRule ? 'Edit Points Rule' : 'Add Points Rule'}
                </DialogTitle>
                <DialogDescription data-testid="dialog-description">
                  Configure how customers earn points for products or campaigns
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value as 'product' | 'campaign');
                setFormData({ ...formData, type: value as 'product' | 'campaign' });
              }}>
                <TabsList className="grid w-full grid-cols-2" data-testid="tabs-type-selector">
                  <TabsTrigger value="product" data-testid="tab-product">Product Points</TabsTrigger>
                  <TabsTrigger value="campaign" data-testid="tab-campaign">Campaign Points</TabsTrigger>
                </TabsList>

                <TabsContent value="product" className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4" data-testid="points-rule-form">
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
                        disabled={saveRuleMutation.isPending || createPointRuleMutation.isPending}
                        data-testid="button-save-rule"
                      >
                        {editingRule ? 'Update' : 'Save'} Rule
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="campaign" className="space-y-4">
                  <form onSubmit={handleCampaignSubmit} className="space-y-6">
                    {/* Campaign Basic Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Campaign Details</h3>
                      
                      <div>
                        <Label htmlFor="campaign-name">Campaign Name *</Label>
                        <Input
                          id="campaign-name"
                          placeholder="e.g., Summer Special Bundle"
                          value={newCampaign.name}
                          onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="campaign-description">Campaign Description</Label>
                        <Textarea
                          id="campaign-description"
                          placeholder="Describe your campaign..."
                          value={newCampaign.description}
                          onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="campaign-points-type">Points Type</Label>
                          <Select
                            value={newCampaign.pointsType}
                            onValueChange={(value: 'fixed' | 'percentage') =>
                              setNewCampaign({ ...newCampaign, pointsType: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed Points</SelectItem>
                              <SelectItem value="percentage">Percentage of Purchase</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="campaign-points-value">
                            {newCampaign.pointsType === 'fixed' ? 'Points Amount' : 'Percentage (%)'}
                          </Label>
                          <Input
                            id="campaign-points-value"
                            type="number"
                            value={newCampaign.pointsValue}
                            onChange={(e) => setNewCampaign({
                              ...newCampaign,
                              pointsValue: parseInt(e.target.value) || 0
                            })}
                            placeholder={newCampaign.pointsType === 'fixed' ? "50" : "10"}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Select Existing Products */}
                    {products.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Select Existing Products</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-4">
                          {products.map((product) => (
                            <div key={product.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`product-${product.id}`}
                                checked={newCampaign.selectedProducts.includes(product.id)}
                                onCheckedChange={() => toggleProductSelection(product.id)}
                              />
                              <Label htmlFor={`product-${product.id}`} className="text-sm">
                                {product.productCode ? `[${product.productCode}] ` : ''}{product.name} - ₹{product.price}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add New Products */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Add New Products</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
                        <div>
                          <Label htmlFor="new-product-name">Product Name</Label>
                          <Input
                            id="new-product-name"
                            placeholder="Product name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="new-product-code">Product Code</Label>
                          <Input
                            id="new-product-code"
                            placeholder="SKU123"
                            value={newProduct.productCode}
                            onChange={(e) => setNewProduct({ ...newProduct, productCode: e.target.value.toUpperCase() })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="new-product-price">Price (₹)</Label>
                          <Input
                            id="new-product-price"
                            placeholder="0.00"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <Button type="button" onClick={addNewProduct} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="new-product-description">Product Description (Optional)</Label>
                        <Input
                          id="new-product-description"
                          placeholder="Product description"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        />
                      </div>

                      {/* Show added products */}
                      {newCampaign.newProducts.length > 0 && (
                        <div className="space-y-2">
                          <Label>New Products Added:</Label>
                          <div className="space-y-2">
                            {newCampaign.newProducts.map((product, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                                <span className="text-sm">
                                  [{product.productCode}] {product.name} - ₹{product.price}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeNewProduct(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createCampaignMutation.isPending}
                      >
                        Create Campaign
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Setup Examples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20" data-testid="card-example-fixed">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800 dark:text-green-300">Fixed Points</h3>
            </div>
            <p className="text-sm text-green-700 dark:text-blue-400">
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
                      onClick={() => {
                        // Add delete functionality here if needed
                      }}
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
