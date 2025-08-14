import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Calculator, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type ProcessSale, type Product, type Campaign, type Customer } from "@shared/schema";

interface SaleItem {
  productId?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PointPreview {
  totalPoints: number;
  itemPoints: Array<{
    productId?: string;
    productName: string;
    points: number;
    calculation: string;
  }>;
  appliedRules: string[];
}

export default function SalesProcessingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [saleData, setSaleData] = useState<{
    customerId?: string;
    referralCode?: string;
    campaignId?: string;
    items: SaleItem[];
    posTransactionId?: string;
    paymentMethod?: string;
  }>({
    items: []
  });
  
  const [currentItem, setCurrentItem] = useState<SaleItem>({
    productName: "",
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0
  });
  
  const [pointsPreview, setPointsPreview] = useState<PointPreview | null>(null);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/active"],
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns/active"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const previewPointsMutation = useMutation({
    mutationFn: async (data: ProcessSale) => {
      const response = await apiRequest("POST", "/api/sales/preview-points", data);
      return await response.json() as PointPreview;
    },
    onSuccess: (data: PointPreview) => {
      setPointsPreview(data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to preview points calculation",
        variant: "destructive"
      });
    }
  });

  const processSaleMutation = useMutation({
    mutationFn: async (data: ProcessSale) => {
      const response = await apiRequest("POST", "/api/sales/process", data);
      return await response.json();
    },
    onSuccess: (response: any) => {
      toast({
        title: "Success",
        description: `Sale processed successfully! ${response.pointCalculation?.totalPoints || 0} points awarded.`
      });
      
      // Reset form
      setSaleData({ items: [] });
      setPointsPreview(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process sale",
        variant: "destructive"
      });
    }
  });

  const addItem = () => {
    if (!currentItem.productName || currentItem.quantity <= 0 || currentItem.unitPrice < 0) {
      toast({
        title: "Error",
        description: "Please fill in all item details",
        variant: "destructive"
      });
      return;
    }

    setSaleData(prev => ({
      ...prev,
      items: [...prev.items, { ...currentItem }]
    }));

    setCurrentItem({
      productName: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    });
    setPointsPreview(null);
  };

  const removeItem = (index: number) => {
    setSaleData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    setPointsPreview(null);
  };

  const updateItemPrice = () => {
    setCurrentItem(prev => ({
      ...prev,
      totalPrice: prev.quantity * prev.unitPrice
    }));
  };

  const calculateTotalAmount = () => {
    return saleData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handlePreviewPoints = () => {
    const totalAmount = calculateTotalAmount();
    
    if (saleData.items.length === 0 || totalAmount <= 0) {
      toast({
        title: "Error",
        description: "Please add items to the sale first",
        variant: "destructive"
      });
      return;
    }

    const previewData: ProcessSale = {
      ...saleData,
      totalAmount,
      items: saleData.items
    };

    previewPointsMutation.mutate(previewData);
  };

  const handleProcessSale = () => {
    const totalAmount = calculateTotalAmount();
    
    if (saleData.items.length === 0 || totalAmount <= 0) {
      toast({
        title: "Error",
        description: "Please add items to the sale first",
        variant: "destructive"
      });
      return;
    }

    const processData: ProcessSale = {
      ...saleData,
      totalAmount,
      items: saleData.items
    };

    processSaleMutation.mutate(processData);
  };

  const selectProduct = (productId: string) => {
    if (productId === "manual") {
      setCurrentItem(prev => ({
        ...prev,
        productId: undefined,
        productName: "",
        productSku: undefined,
        unitPrice: 0,
        totalPrice: 0
      }));
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (product) {
      setCurrentItem(prev => ({
        ...prev,
        productId: product.id,
        productName: product.name,
        productSku: product.sku || undefined,
        unitPrice: parseFloat(product.price),
        totalPrice: prev.quantity * parseFloat(product.price)
      }));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-2 mb-6">
        <ShoppingCart className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Sales Processing</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sale Details */}
        <Card>
          <CardHeader>
            <CardTitle>Sale Details</CardTitle>
            <CardDescription>
              Configure customer and campaign information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customer">Customer (Optional)</Label>
              <Select
                value={saleData.customerId || "none"}
                onValueChange={(value) => setSaleData(prev => ({ ...prev, customerId: value === "none" ? undefined : value }))}
              >
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No customer selected</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phoneNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <Input
                id="referralCode"
                data-testid="input-referral-code"
                value={saleData.referralCode || ""}
                onChange={(e) => setSaleData(prev => ({ ...prev, referralCode: e.target.value || undefined }))}
                placeholder="Enter referral code"
              />
            </div>

            <div>
              <Label htmlFor="campaign">Campaign (Optional)</Label>
              <Select
                value={saleData.campaignId || "none"}
                onValueChange={(value) => setSaleData(prev => ({ ...prev, campaignId: value === "none" ? undefined : value }))}
              >
                <SelectTrigger data-testid="select-campaign">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No campaign selected</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="posTransactionId">POS Transaction ID</Label>
                <Input
                  id="posTransactionId"
                  data-testid="input-pos-transaction-id"
                  value={saleData.posTransactionId || ""}
                  onChange={(e) => setSaleData(prev => ({ ...prev, posTransactionId: e.target.value || undefined }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={saleData.paymentMethod || "none"}
                  onValueChange={(value) => setSaleData(prev => ({ ...prev, paymentMethod: value === "none" ? undefined : value }))}
                >
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="digital">Digital Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Item */}
        <Card>
          <CardHeader>
            <CardTitle>Add Item</CardTitle>
            <CardDescription>
              Add products to the sale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="product">Select Product (Optional)</Label>
              <Select
                value={currentItem.productId || "manual"}
                onValueChange={selectProduct}
              >
                <SelectTrigger data-testid="select-product">
                  <SelectValue placeholder="Choose from products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual entry</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ${parseFloat(product.price).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                data-testid="input-product-name"
                value={currentItem.productName}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  data-testid="input-quantity"
                  value={currentItem.quantity}
                  onChange={(e) => {
                    const quantity = parseInt(e.target.value) || 1;
                    setCurrentItem(prev => ({ 
                      ...prev, 
                      quantity,
                      totalPrice: quantity * prev.unitPrice 
                    }));
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  data-testid="input-unit-price"
                  value={currentItem.unitPrice}
                  onChange={(e) => {
                    const unitPrice = parseFloat(e.target.value) || 0;
                    setCurrentItem(prev => ({ 
                      ...prev, 
                      unitPrice,
                      totalPrice: prev.quantity * unitPrice 
                    }));
                  }}
                  onBlur={updateItemPrice}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="totalPrice">Total Price</Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                data-testid="input-total-price"
                value={currentItem.totalPrice.toFixed(2)}
                readOnly
                className="bg-muted"
              />
            </div>

            <Button 
              onClick={addItem} 
              className="w-full"
              data-testid="button-add-item"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sale Items */}
      {saleData.items.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sale Items ({saleData.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {saleData.items.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  data-testid={`sale-item-${index}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} × ${item.unitPrice.toFixed(2)} = ${item.totalPrice.toFixed(2)}
                      {item.productSku && ` • SKU: ${item.productSku}`}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => removeItem(index)}
                    data-testid={`button-remove-item-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="my-4" />
            
            <div className="flex items-center justify-between text-lg font-medium">
              <span>Total Amount:</span>
              <span data-testid="total-amount">${calculateTotalAmount().toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Points Preview */}
      {pointsPreview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="w-5 h-5" />
              <span>Points Calculation Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-lg">
                <span>Total Points to Award:</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {pointsPreview.totalPoints} points
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Item-by-item breakdown:</h4>
                {pointsPreview.itemPoints.map((item, index) => (
                  <div key={index} className="text-sm bg-muted p-2 rounded">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-muted-foreground">
                      {item.points} points • {item.calculation}
                    </div>
                  </div>
                ))}
              </div>

              {pointsPreview.appliedRules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Applied Rules:</h4>
                  <ul className="text-sm space-y-1">
                    {pointsPreview.appliedRules.map((rule, index) => (
                      <li key={index} className="text-muted-foreground">• {rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {saleData.items.length > 0 && (
        <div className="flex justify-end space-x-4 mt-6">
          <Button 
            variant="outline" 
            onClick={handlePreviewPoints}
            disabled={previewPointsMutation.isPending}
            data-testid="button-preview-points"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Preview Points
          </Button>
          <Button 
            onClick={handleProcessSale}
            disabled={processSaleMutation.isPending}
            data-testid="button-process-sale"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Process Sale
          </Button>
        </div>
      )}
    </div>
  );
}