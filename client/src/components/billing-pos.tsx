
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Search, Plus, Minus, X, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Product, type Customer } from "@shared/schema";

interface BillingItem {
  productId?: string;
  productCode: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  pointsPerItem: number;
}

interface BillingPOSProps {
  onSaleComplete?: (saleData: any) => void;
}

export default function BillingPOS({ onSaleComplete }: BillingPOSProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [productCode, setProductCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  // Process sale mutation
  const processSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      return await apiRequest('/api/sales/process', {
        method: 'POST',
        body: JSON.stringify(saleData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Sale processed! ${data.pointsEarned} points awarded.`
      });
      resetBilling();
      onSaleComplete?.(data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process sale",
        variant: "destructive"
      });
    }
  });

  // Lookup product by code
  const lookupProduct = async (code: string) => {
    if (!code.trim()) return;
    
    setLoading(true);
    try {
      const product = await apiRequest(`/api/products/code/${code}`);
      
      // Calculate points per item for this product
      let pointsPerItem = 0;
      if (product.pointCalculationType === 'fixed') {
        pointsPerItem = product.fixedPoints || 0;
      } else if (product.pointCalculationType === 'percentage') {
        const percentageRate = parseFloat(product.percentageRate || "0");
        pointsPerItem = Math.floor((parseFloat(product.price) * percentageRate) / 100);
      } else {
        // Default: 1 point per $10
        pointsPerItem = Math.floor(parseFloat(product.price) / 10);
      }

      const newItem: BillingItem = {
        productId: product.id,
        productCode: code,
        productName: product.name,
        unitPrice: parseFloat(product.price),
        quantity: 1,
        totalPrice: parseFloat(product.price),
        pointsPerItem
      };

      // Check if item already exists, if so, increase quantity
      const existingIndex = billingItems.findIndex(item => item.productCode === code);
      if (existingIndex >= 0) {
        const updatedItems = [...billingItems];
        updatedItems[existingIndex].quantity += 1;
        updatedItems[existingIndex].totalPrice = updatedItems[existingIndex].unitPrice * updatedItems[existingIndex].quantity;
        setBillingItems(updatedItems);
      } else {
        setBillingItems([...billingItems, newItem]);
      }

      setProductCode("");
      toast({
        title: "Product Added",
        description: `${product.name} added to cart`
      });
    } catch (error) {
      toast({
        title: "Product Not Found",
        description: `No product found with code: ${code}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Lookup customer by referral code
  const lookupCustomer = async (code: string) => {
    if (!code.trim()) return;
    
    try {
      const result = await apiRequest(`/api/coupons/verify/${code}`);
      // Get customer details from the verification result
      const customerData = await apiRequest(`/api/customers/${result.referrerId}`);
      setCustomer(customerData);
      toast({
        title: "Customer Found",
        description: `${customerData.name} - ${customerData.points} points`
      });
    } catch (error) {
      toast({
        title: "Customer Not Found",
        description: `No customer found with referral code: ${code}`,
        variant: "destructive"
      });
    }
  };

  const updateQuantity = (index: number, change: number) => {
    const updatedItems = [...billingItems];
    const newQuantity = updatedItems[index].quantity + change;
    
    if (newQuantity <= 0) {
      updatedItems.splice(index, 1);
    } else {
      updatedItems[index].quantity = newQuantity;
      updatedItems[index].totalPrice = updatedItems[index].unitPrice * newQuantity;
    }
    
    setBillingItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = [...billingItems];
    updatedItems.splice(index, 1);
    setBillingItems(updatedItems);
  };

  const getTotalAmount = () => {
    return billingItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getTotalPoints = () => {
    return billingItems.reduce((sum, item) => sum + (item.pointsPerItem * item.quantity), 0);
  };

  const processSale = () => {
    if (billingItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the cart",
        variant: "destructive"
      });
      return;
    }

    const saleData = {
      customerId: customer?.id,
      referralCode: referralCode || undefined,
      totalAmount: getTotalAmount(),
      items: billingItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      paymentMethod: "cash"
    };

    processSaleMutation.mutate(saleData);
  };

  const resetBilling = () => {
    setBillingItems([]);
    setReferralCode("");
    setCustomer(null);
    setProductCode("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Billing POS
        </CardTitle>
        <CardDescription>
          Enter product codes to add items and process sales with automatic point calculation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Code Input */}
        <div className="space-y-2">
          <Label htmlFor="product-code">Product Code</Label>
          <div className="flex gap-2">
            <Input
              id="product-code"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  lookupProduct(productCode);
                }
              }}
              placeholder="Enter product code and press Enter"
              className="flex-1"
            />
            <Button 
              onClick={() => lookupProduct(productCode)}
              disabled={loading || !productCode.trim()}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Referral Code Input */}
        <div className="space-y-2">
          <Label htmlFor="referral-code">Customer Referral Code (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="referral-code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  lookupCustomer(referralCode);
                }
              }}
              placeholder="Enter customer referral code"
              className="flex-1"
            />
            <Button 
              onClick={() => lookupCustomer(referralCode)}
              disabled={!referralCode.trim()}
              variant="outline"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {customer && (
            <div className="p-2 bg-green-50 rounded">
              <span className="text-sm text-green-800">
                Customer: {customer.name} | Current Points: {customer.points}
              </span>
            </div>
          )}
        </div>

        {/* Billing Items */}
        {billingItems.length > 0 && (
          <div className="space-y-3">
            <Label>Items in Cart</Label>
            {billingItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-gray-500">
                    Code: {item.productCode} | ${item.unitPrice.toFixed(2)} each
                  </div>
                  <div className="text-xs text-blue-600">
                    {item.pointsPerItem} points per item
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(index, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(index, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <div className="text-right ml-4">
                    <div className="font-medium">${item.totalPrice.toFixed(2)}</div>
                    <div className="text-xs text-blue-600">
                      {item.pointsPerItem * item.quantity} pts
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeItem(index)}
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        {billingItems.length > 0 && (
          <div className="space-y-2 p-4 bg-gray-50 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold text-lg">${getTotalAmount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 flex items-center gap-1">
                <Calculator className="h-4 w-4" />
                Total Points to Award:
              </span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {getTotalPoints()} points
              </Badge>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={processSale}
            disabled={billingItems.length === 0 || processSaleMutation.isPending}
            className="flex-1"
          >
            {processSaleMutation.isPending ? 'Processing...' : 'Process Sale'}
          </Button>
          <Button
            onClick={resetBilling}
            variant="outline"
            disabled={billingItems.length === 0}
          >
            Clear Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
