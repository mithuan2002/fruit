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
  });
  const [step, setStep] = useState<"enter-code" | "verify-details" | "success">("enter-code");
  const [couponDetails, setCouponDetails] = useState<any>(null);

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
    // In a real implementation, you would verify the coupon code here
    // For demo purposes, we'll simulate this
    if (redemptionForm.couponCode.length >= 6) {
      setCouponDetails({
        code: redemptionForm.couponCode,
        value: 50,
        referrerName: "John Smith",
        referrerPhone: "+1 (555) 123-4567",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redemptionForm.referredCustomerName || !redemptionForm.referredCustomerPhone) {
      toast({
        title: "Missing Information",
        description: "Please provide referred customer details.",
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
    });
    setStep("enter-code");
    setCouponDetails(null);
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

        {step === "verify-details" && couponDetails && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Referrer Information */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Referrer Identified</span>
              </div>
              <div className="text-sm text-green-700">
                <p><strong>{couponDetails.referrerName}</strong></p>
                <p>{couponDetails.referrerPhone}</p>
                <Badge className="mt-1 bg-green-100 text-green-800">
                  Will earn {couponDetails.value} points
                </Badge>
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
                type="submit" 
                className="flex-1 bg-primary hover:bg-blue-700 text-white"
                disabled={redeemCouponMutation.isPending}
              >
                {redeemCouponMutation.isPending ? "Processing..." : "Process Referral"}
              </Button>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Gift className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">Referral Processed!</h4>
              <p className="text-sm text-gray-500">Points awarded and SMS sent to referrer</p>
            </div>
            <Button onClick={resetForm} className="w-full bg-primary hover:bg-blue-700 text-white">
              Process Another Referral
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}