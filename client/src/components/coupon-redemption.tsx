import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Gift } from "lucide-react";
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
  const [step, setStep] = useState<"enter-code" | "verify-details" | "assign-points" | "success">("enter-code");
  const [referralData, setReferralData] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const redeemCouponMutation = useMutation({
    mutationFn: async (data: typeof redemptionForm) => {
      const response = await apiRequest("POST", `/api/coupons/${data.couponCode}/redeem`, {
        customerId: data.customerId,
        referredCustomerName: data.referredCustomerName,
        referredCustomerPhone: data.referredCustomerPhone,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Referral Processed!",
        description: `${data.pointsEarned} points awarded to referrer. Total points: ${data.totalPoints}`,
      });
      setStep("success" as any);
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
    // In a real implementation, you would verify the coupon code here
    // For demo purposes, we'll simulate this
    if (redemptionForm.couponCode.length >= 6) {
      setReferralData({
        code: redemptionForm.couponCode,
        referrerName: "John Smith",
        referrerPhone: "+1 (555) 123-4567",
        referrerCurrentPoints: 150,
        defaultPointsPerReferral: 50,
      });
      setStep("verify-details");
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
    setStep("assign-points");
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (redemptionForm.pointsToAssign <= 0) {
      toast({
        title: "Invalid Points",
        description: "Please assign points based on the sale amount.",
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

  return (
    <Card className="border border-gray-200 max-w-md mx-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Process Referral</h3>
        <p className="text-sm text-gray-500">Enter coupon code to identify referrer and award points</p>
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
              disabled={!redemptionForm.couponCode}
            >
              Verify Code
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
                Next: Assign Points
              </Button>
            </div>
          </div>
        )}

        {step === "assign-points" && referralData && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            {/* Sale Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Transaction Details</h4>
              <div className="text-sm text-blue-700">
                <p>Customer: <strong>{redemptionForm.referredCustomerName}</strong></p>
                <p>Referrer: <strong>{referralData.referrerName}</strong></p>
              </div>
            </div>

            <div>
              <Label htmlFor="saleAmount">Sale Amount ($)</Label>
              <Input
                id="saleAmount"
                type="number"
                min="0"
                step="0.01"
                value={redemptionForm.saleAmount}
                onChange={(e) => {
                  const amount = Number(e.target.value);
                  const points = Math.floor(amount / 10); // 1 point per $10 spent
                  setRedemptionForm({ 
                    ...redemptionForm, 
                    saleAmount: amount,
                    pointsToAssign: points 
                  });
                }}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Points will be calculated automatically</p>
            </div>

            <div>
              <Label htmlFor="pointsToAssign">Points to Assign</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="pointsToAssign"
                  type="number"
                  min="0"
                  value={redemptionForm.pointsToAssign}
                  onChange={(e) => setRedemptionForm({ ...redemptionForm, pointsToAssign: Number(e.target.value) })}
                  className="flex-1"
                />
                <p className="text-sm text-gray-500">points</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Adjust based on sale amount and store policy</p>
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
                {redeemCouponMutation.isPending ? "Processing..." : "Award Points"}
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
              <h3 className="text-lg font-medium text-gray-900">Referral Processed Successfully!</h3>
              <p className="text-sm text-gray-500">Points have been awarded to the referrer.</p>
            </div>
            <Button onClick={resetForm} className="w-full">
              Process Another Referral
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}