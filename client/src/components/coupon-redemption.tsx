
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ShoppingCart, Package, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Customer, Product } from "@shared/schema";

interface ReferralData {
  code: string;
  referrerId: string;
  referrerName: string;
  referrerPhone: string;
  points: number;
}

interface ProductItem {
  productCode: string;
  productName: string;
  quantity: number;
  pointsPerItem: number;
  totalPoints: number;
}

type Step = "enter-code" | "add-products" | "confirm-sale";

export default function CouponRedemption() {
  const [step, setStep] = useState<Step>("enter-code");
  const [couponCode, setCouponCode] = useState("");
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [currentProduct, setCurrentProduct] = useState({
    productCode: "",
    quantity: 1
  });
  const [saleAmount, setSaleAmount] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: availableProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Verify coupon code
  const verifyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("GET", `/api/coupons/verify/${code}`);
      return response.json();
    },
    onSuccess: (data) => {
      setReferralData(data);
      setStep("add-products");
    },
    onError: (error: any) => {
      toast({
        title: "Invalid Code",
        description: error.message || "Coupon code not found.",
        variant: "destructive",
      });
    },
  });

  // Process final sale
  const processSaleMutation = useMutation({
    mutationFn: async () => {
      if (!referralData) throw new Error("No referral data");
      
      const totalPoints = products.reduce((sum, p) => sum + p.totalPoints, 0);
      
      const response = await apiRequest("POST", `/api/coupons/${couponCode}/redeem`, {
        customerId: referralData.referrerId,
        saleAmount: saleAmount,
        pointsToAssign: totalPoints,
        products: products
      });
      return response.json();
    },
    onSuccess: (data) => {
      const totalPoints = products.reduce((sum, p) => sum + p.totalPoints, 0);
      toast({
        title: "Sale Processed!",
        description: `${totalPoints} points awarded to ${referralData?.referrerName}`,
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process sale.",
        variant: "destructive",
      });
    },
  });

  const handleVerifyCoupon = () => {
    if (couponCode.length >= 6) {
      verifyCouponMutation.mutate(couponCode);
    } else {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid coupon code.",
        variant: "destructive",
      });
    }
  };

  const handleAddProduct = () => {
    if (!currentProduct.productCode.trim()) {
      toast({
        title: "Missing Product Code",
        description: "Please enter a product code.",
        variant: "destructive",
      });
      return;
    }

    // Find product in available products
    const product = availableProducts.find(p => p.productCode === currentProduct.productCode.trim());
    
    if (!product) {
      toast({
        title: "Product Not Found",
        description: "Product code not found. Please check the code and try again.",
        variant: "destructive",
      });
      return;
    }

    const pointsPerItem = product.fixedPoints || 0;
    const totalPoints = pointsPerItem * currentProduct.quantity;

    const newProduct: ProductItem = {
      productCode: currentProduct.productCode,
      productName: product.name,
      quantity: currentProduct.quantity,
      pointsPerItem: pointsPerItem,
      totalPoints: totalPoints
    };

    setProducts([...products, newProduct]);
    setCurrentProduct({ productCode: "", quantity: 1 });

    toast({
      title: "Product Added",
      description: `${newProduct.productName} added with ${totalPoints} points`,
    });
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProcessSale = () => {
    if (products.length === 0) {
      toast({
        title: "No Products",
        description: "Please add at least one product.",
        variant: "destructive",
      });
      return;
    }

    if (saleAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid sale amount.",
        variant: "destructive",
      });
      return;
    }

    processSaleMutation.mutate();
  };

  const resetForm = () => {
    setCouponCode("");
    setReferralData(null);
    setProducts([]);
    setCurrentProduct({ productCode: "", quantity: 1 });
    setSaleAmount(0);
    setStep("enter-code");
  };

  const totalPoints = products.reduce((sum, p) => sum + p.totalPoints, 0);

  return (
    <Card className="border border-gray-200 max-w-md mx-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Process Referral Sale</h3>
        <p className="text-sm text-gray-500">Enter coupon code and add products to process sale</p>
      </div>

      <CardContent className="p-6">
        {step === "enter-code" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="couponCode">Coupon Code</Label>
              <Input
                id="couponCode"
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                className="uppercase"
              />
            </div>
            <Button 
              onClick={handleVerifyCoupon}
              className="w-full"
              disabled={verifyCouponMutation.isPending}
            >
              {verifyCouponMutation.isPending ? "Verifying..." : "Verify Code"}
            </Button>
          </div>
        )}

        {step === "add-products" && referralData && (
          <div className="space-y-4">
            {/* Referrer Info */}
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Referrer Found</span>
              </div>
              <p className="text-sm text-green-800">{referralData.referrerName}</p>
              <p className="text-xs text-green-700">{referralData.referrerPhone}</p>
            </div>

            <Separator />

            {/* Add Product Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <Label className="font-medium">Add Product</Label>
              </div>
              
              <div>
                <Label htmlFor="productCode">Product Code</Label>
                <Input
                  id="productCode"
                  type="text"
                  value={currentProduct.productCode}
                  onChange={(e) => setCurrentProduct({
                    ...currentProduct,
                    productCode: e.target.value.toUpperCase()
                  })}
                  placeholder="Enter product code"
                  className="uppercase"
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={currentProduct.quantity}
                  onChange={(e) => setCurrentProduct({
                    ...currentProduct,
                    quantity: parseInt(e.target.value) || 1
                  })}
                />
              </div>

              <Button 
                onClick={handleAddProduct}
                variant="outline"
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {/* Added Products */}
            {products.length > 0 && (
              <div className="space-y-2">
                <Label className="font-medium">Added Products</Label>
                {products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product.productName}</p>
                      <p className="text-xs text-gray-600">
                        Qty: {product.quantity} × {product.pointsPerItem} pts = {product.totalPoints} pts
                      </p>
                    </div>
                    <Button
                      onClick={() => removeProduct(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Total Points</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-900">
                    {totalPoints} points
                  </Badge>
                </div>
              </div>
            )}

            {/* Sale Amount */}
            <div>
              <Label htmlFor="saleAmount">Sale Amount ($)</Label>
              <Input
                id="saleAmount"
                type="number"
                step="0.01"
                min="0"
                value={saleAmount}
                onChange={(e) => setSaleAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={resetForm}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleProcessSale}
                className="flex-1"
                disabled={processSaleMutation.isPending || products.length === 0}
              >
                {processSaleMutation.isPending ? "Processing..." : "Process Sale"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
