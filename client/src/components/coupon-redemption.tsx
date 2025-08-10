
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Gift, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CouponRedemption() {
  const [redemptionForm, setRedemptionForm] = useState({
    couponCode: "",
    customerId: "",
    referredCustomerName: "",
    referredCustomerPhone: "",
    saleAmount: 0,
    pointsToAssign: 0,
  });
  const [step, setStep] = useState<"enter-code" | "verify-details" | "billing" | "success">("enter-code");
  const [referralData, setReferralData] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Verify coupon code and get referrer details
  const verifyCouponMutation = useMutation({
    mutationFn: async (couponCode: string) => {
      const response = await apiRequest("GET", `/api/coupons/verify/${couponCode}`);
      return response.json();
    },
    onSuccess: (data) => {
      setReferralData(data);
      setRedemptionForm(prev => ({ 
        ...prev, 
        customerId: data.referrerId,
        couponCode: data.code 
      }));
      setStep("verify-details");
    },
    onError: (error: any) => {
      toast({
        title: "Invalid Code",
        description: error.message || "Please enter a valid coupon code.",
        variant: "destructive",
      });
    },
  });

  const redeemCouponMutation = useMutation({
    mutationFn: async (data: typeof redemptionForm) => {
      const response = await apiRequest("POST", `/api/coupons/${data.couponCode}/redeem`, {
        customerId: data.customerId,
        referredCustomerName: data.referredCustomerName,
        referredCustomerPhone: data.referredCustomerPhone,
        saleAmount: data.saleAmount,
        pointsToAssign: data.pointsToAssign,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Referral Processed!",
        description: `${data.pointsEarned} points awarded to referrer. Total points: ${data.totalPoints}`,
      });
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process referral.",
        variant: "destructive",
      });
    },
  });

  const handleCodeVerification = () => {
    if (redemptionForm.couponCode.length >= 6) {
      verifyCouponMutation.mutate(redemptionForm.couponCode);
    } else {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid coupon code.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyDetails = () => {
    if (!redemptionForm.referredCustomerName || !redemptionForm.referredCustomerPhone) {
      toast({
        title: "Missing Information",
        description: "Please provide referred customer details.",
        variant: "destructive",
      });
      return;
    }
    setStep("billing");
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (redemptionForm.saleAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid sale amount.",
        variant: "destructive",
      });
      return;
    }
    redeemCouponMutation.mutate(redemptionForm);
  };

  const resetForm = () => {
    setRedemptionForm({
      couponCode: "",
      customerId: "",
      referredCustomerName: "",
      referredCustomerPhone: "",
      saleAmount: 0,
      pointsToAssign: 0,
    });
    setStep("enter-code");
    setReferralData(null);
  };

  // Calculate points based on sale amount (1 point per $10 spent)
  const calculatePoints = (amount: number) => {
    return Math.floor(amount / 10);
  };

  return (
    <Card className="border border-gray-200 max-w-md mx-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Process Referral Sale</h3>
        <p className="text-sm text-gray-500">Enter coupon code to identify referrer and process sale</p>
      </div>
      
      <CardContent className="p-6">
        {step === "enter-code" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="couponCode">Coupon Code</Label>
              <Input
                id="couponCode"
                type="text"
                value={redemptionForm.couponCode}
                onChange={(e) => setRedemptionForm({ ...redemptionForm, couponCode: e.target.value.toUpperCase() })}
                placeholder="Enter coupon code"
                className="font-mono"
              />
            </div>
            <Button 
              onClick={handleCodeVerification}
              className="w-full bg-primary hover:bg-blue-700 text-white"
              disabled={!redemptionForm.couponCode || verifyCouponMutation.isPending}
            >
              {verifyCouponMutation.isPending ? "Verifying..." : "Verify Code"}
            </Button>
          </div>
        )}

        {step === "verify-details" && referralData && (
          <div className="space-y-4">
            {/* Referrer Information */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Referrer Identified</span>
              </div>
              <div className="text-sm text-green-700">
                <p><strong>{referralData.referrerName}</strong></p>
                <p>{referralData.referrerPhone}</p>
                <p>Current Points: {referralData.referrerCurrentPoints}</p>
              </div>
            </div>

            {/* New Customer Details */}
            <div>
              <Label htmlFor="referredName">New Customer Name</Label>
              <Input
                id="referredName"
                type="text"
                value={redemptionForm.referredCustomerName}
                onChange={(e) => setRedemptionForm({ ...redemptionForm, referredCustomerName: e.target.value })}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <Label htmlFor="referredPhone">New Customer Phone</Label>
              <Input
                id="referredPhone"
                type="tel"
                value={redemptionForm.referredCustomerPhone}
                onChange={(e) => setRedemptionForm({ ...redemptionForm, referredCustomerPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>

            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={() => setStep("enter-code")} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleVerifyDetails}
                className="flex-1 bg-primary hover:bg-blue-700 text-white"
              >
                Next: Enter Sale Amount
              </Button>
            </div>
          </div>
        )}

        {step === "billing" && referralData && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            {/* Sale Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Transaction Details</h4>
              <div className="text-sm text-blue-700">
                <p>Customer: <strong>{redemptionForm.referredCustomerName}</strong></p>
                <p>Referrer: <strong>{referralData.referrerName}</strong></p>
                <p>Coupon Code: <strong className="font-mono">{redemptionForm.couponCode}</strong></p>
              </div>
            </div>

            <div>
              <Label htmlFor="saleAmount">Sale Amount ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="saleAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={redemptionForm.saleAmount}
                  onChange={(e) => {
                    const amount = Number(e.target.value);
                    const points = calculatePoints(amount);
                    setRedemptionForm({ 
                      ...redemptionForm, 
                      saleAmount: amount,
                      pointsToAssign: points 
                    });
                  }}
                  placeholder="0.00"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Points will be calculated automatically (1 point per $10)</p>
            </div>

            <div>
              <Label htmlFor="pointsToAssign">Points to Award</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="pointsToAssign"
                  type="number"
                  min="0"
                  value={redemptionForm.pointsToAssign}
                  onChange={(e) => setRedemptionForm({ ...redemptionForm, pointsToAssign: Number(e.target.value) })}
                  className="flex-1"
                />
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {redemptionForm.pointsToAssign} points
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">Calculated based on sale amount (adjustable)</p>
            </div>

            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={() => setStep("verify-details")} className="flex-1">
                Back
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={redeemCouponMutation.isPending}
              >
                {redeemCouponMutation.isPending ? "Processing..." : "Complete Sale & Award Points"}
              </Button>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Sale Processed Successfully!</h3>
              <p className="text-sm text-gray-500">Points have been awarded to the referrer.</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm"><strong>Sale Amount:</strong> ${redemptionForm.saleAmount}</p>
                <p className="text-sm"><strong>Points Awarded:</strong> {redemptionForm.pointsToAssign}</p>
              </div>
            </div>
            <Button onClick={resetForm} className="w-full">
              Process Another Sale
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
