
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Plus, Minus, X, Calculator } from "lucide-react";
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
  const [couponCode, setCouponCode] = useState("");
  const [productCode, setProductCode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  // Process sale mutation
  const processSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const response = await apiRequest('POST', '/api/sales/process', saleData);
      return await response.json();
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

  // Lookup customer by coupon code
  const lookupCustomer = async (code: string) => {
    if (!code.trim()) return;
    
    try {
      const verifyResponse = await apiRequest('GET', `/api/coupons/verify/${code}`);
      const result = await verifyResponse.json();
      
      const customerResponse = await apiRequest('GET', `/api/customers/${result.referrerId}`);
      const customerData = await customerResponse.json();
      
      setCustomer(customerData);
      toast({
        title: "Customer Found",
        description: `${customerData.name} - ${customerData.points} points`
      });
    } catch (error) {
      toast({
        title: "Customer Not Found",
        description: `No customer found with coupon code: ${code}`,
        variant: "destructive"
      });
    }
  };

  // Add product by code with quantity
  const addProduct = async () => {
    if (!productCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product code",
        variant: "destructive"
      });
      return;
    }

    if (quantity < 1) {
      toast({
        title: "Error",
        description: "Quantity must be at least 1",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const productResponse = await apiRequest('GET', `/api/products/code/${productCode}`);
      const product = await productResponse.json();
      
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
        productCode: productCode,
        productName: product.name,
        unitPrice: parseFloat(product.price),
        quantity: quantity,
        totalPrice: parseFloat(product.price) * quantity,
        pointsPerItem
      };

      // Check if item already exists, if so, increase quantity
      const existingIndex = billingItems.findIndex(item => item.productCode === productCode);
      if (existingIndex >= 0) {
        const updatedItems = [...billingItems];
        updatedItems[existingIndex].quantity += quantity;
        updatedItems[existingIndex].totalPrice = updatedItems[existingIndex].unitPrice * updatedItems[existingIndex].quantity;
        setBillingItems(updatedItems);
      } else {
        setBillingItems([...billingItems, newItem]);
      }

      setProductCode("");
      setQuantity(1);
      toast({
        title: "Product Added",
        description: `${product.name} (${quantity}) added to cart`
      });
    } catch (error) {
      toast({
        title: "Product Not Found",
        description: `No product found with code: ${productCode}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      referralCode: couponCode || undefined,
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
    setCouponCode("");
    setCustomer(null);
    setProductCode("");
    setQuantity(1);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Point of Sale
        </CardTitle>
        <CardDescription>
          Add customer coupon code and product codes to process sales with automatic point calculation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Coupon Code Input */}
        <div className="space-y-2">
          <Label htmlFor="coupon-code">Customer Coupon Code (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="coupon-code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  lookupCustomer(couponCode);
                }
              }}
              placeholder="Enter customer coupon code"
              className="flex-1"
            />
            <Button 
              onClick={() => lookupCustomer(couponCode)}
              disabled={!couponCode.trim()}
              variant="outline"
            >
              Find Customer
            </Button>
          </div>
          {customer && (
            <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
              <span className="text-sm text-green-800 font-medium">
                Customer: {customer.name} | Current Points: {customer.points}
              </span>
            </div>
          )}
        </div>

        {/* Product Code and Quantity Input */}
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="product-code">Product Code</Label>
              <Input
                id="product-code"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addProduct();
                  }
                }}
                placeholder="Enter product code"
                className="flex-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1"
              />
            </div>
          </div>
          <Button 
            onClick={addProduct}
            disabled={loading || !productCode.trim()}
            className="w-full"
          >
            {loading ? 'Adding...' : 'Add Product to Cart'}
          </Button>
        </div>

        {/* Billing Items */}
        {billingItems.length > 0 && (
          <div className="space-y-3">
            <Label>Items in Cart</Label>
            {billingItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                <div className="flex-1">
                  <div className="font-medium text-lg">{item.productName}</div>
                  <div className="text-sm text-gray-500">
                    Code: {item.productCode} | ${item.unitPrice.toFixed(2)} each
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    {item.pointsPerItem} points per item
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(index, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-12 text-center font-medium text-lg">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(index, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <div className="text-right ml-6">
                    <div className="font-bold text-lg">${item.totalPrice.toFixed(2)}</div>
                    <div className="text-sm text-blue-600 font-medium">
                      {item.pointsPerItem * item.quantity} pts total
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeItem(index)}
                    className="ml-3 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        {billingItems.length > 0 && (
          <div className="space-y-3 p-6 bg-blue-50 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-xl">Total Amount:</span>
              <span className="font-bold text-2xl text-green-600">${getTotalAmount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700 flex items-center gap-2 font-semibold">
                <Calculator className="h-5 w-5" />
                Total Points to Award:
              </span>
              <Badge variant="secondary" className="bg-blue-600 text-white text-lg px-4 py-2">
                {getTotalPoints()} points
              </Badge>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={processSale}
            disabled={billingItems.length === 0 || processSaleMutation.isPending}
            className="flex-1 h-12 text-lg font-semibold"
          >
            {processSaleMutation.isPending ? 'Processing Sale...' : 'Complete Sale'}
          </Button>
          <Button
            onClick={resetBilling}
            variant="outline"
            disabled={billingItems.length === 0}
            className="h-12 px-6"
          >
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
