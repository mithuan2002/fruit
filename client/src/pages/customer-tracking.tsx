import { useState, useEffect } from "react"; // Added useEffect import
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Trophy, 
  Gift, 
  CreditCard, 
  History, 
  TrendingUp, 
  Star,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const trackingSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits")
});

type TrackingForm = z.infer<typeof trackingSchema>;

interface CustomerData {
  id: string;
  name: string;
  phoneNumber: string;
  points: number;
  pointsEarned: number;
  pointsRedeemed: number;
  totalReferrals: number;
  referralCode: string;
  isActive: boolean;
  createdAt: string;
}

interface PointsHistory {
  id: string;
  type: string;
  points: number;
  description: string;
  createdAt: string;
}

interface CouponUsage {
  id: string;
  code: string;
  pointsUsed: number;
  discountAmount: string;
  usedAt: string;
  status: string;
}

export default function CustomerTracking() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const { toast } = useToast();

  // Get phone number from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const phoneFromUrl = urlParams.get('phone') || '';
  const autoLoad = urlParams.get('auto') === 'true';

  const form = useForm<TrackingForm>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      phoneNumber: phoneFromUrl
    }
  });

  // Function to fetch customer data (moved from mutationFn for reuse)
  const fetchCustomerData = async (data: TrackingForm) => {
    const cleanPhone = data.phoneNumber.replace(/[^\d]/g, "");
    const response = await fetch(`/api/customers/phone/${cleanPhone}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Customer not found");
    }
    return response.json() as Promise<CustomerData>;
  };

  const trackMutation = useMutation({
    mutationFn: fetchCustomerData, // Use the extracted function
    onSuccess: (data) => {
      setCustomerData(data);
      setIsTracking(true);
      toast({
        title: "Success!",
        description: `Welcome back, ${data.name}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Customer not found",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-fetch data if phone number is provided in URL
  useEffect(() => {
    if (phoneFromUrl && (autoLoad || phoneFromUrl.length >= 10)) {
      form.setValue('phoneNumber', phoneFromUrl);
      // Small delay to ensure form is ready
      const timer = setTimeout(() => {
        trackMutation.mutate({ phoneNumber: phoneFromUrl });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [phoneFromUrl, autoLoad, form, trackMutation]);

  const { data: pointsHistory } = useQuery({
    queryKey: [`/api/customers/${customerData?.id}/points-history`],
    enabled: !!customerData?.id,
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerData.id}/points-history`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const { data: couponUsage } = useQuery({
    queryKey: [`/api/customers/${customerData?.id}/coupon-usage`],
    enabled: !!customerData?.id,
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerData.id}/coupon-usage`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const onSubmit = (data: TrackingForm) => {
    trackMutation.mutate(data);
  };

  const resetTracking = () => {
    setIsTracking(false);
    setCustomerData(null);
    form.reset();
  };

  const pointsProgress = customerData ? Math.min((customerData.points / 1000) * 100, 100) : 0;

  if (isTracking && customerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={resetTracking}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Search
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>

          {/* Customer Info Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{customerData.name}</CardTitle>
                    <CardDescription className="text-indigo-100">
                      Member since {new Date(customerData.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {customerData.referralCode}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{customerData.points}</div>
                  <div className="text-sm text-indigo-100">Available Points</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{customerData.pointsEarned}</div>
                  <div className="text-sm text-indigo-100">Total Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{customerData.pointsRedeemed}</div>
                  <div className="text-sm text-indigo-100">Points Redeemed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{customerData.totalReferrals}</div>
                  <div className="text-sm text-indigo-100">Referrals Made</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-indigo-100">Progress to next reward tier</span>
                  <span className="text-sm text-indigo-100">{customerData.points}/1000 points</span>
                </div>
                <Progress value={pointsProgress} className="h-2 bg-white/20" />
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different views */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp size={16} />
                Overview
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History size={16} />
                Points History
              </TabsTrigger>
              <TabsTrigger value="coupons" className="flex items-center gap-2">
                <Gift size={16} />
                Coupon Usage
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex items-center gap-2">
                <Trophy size={16} />
                Rewards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Activity Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status</span>
                      <Badge variant={customerData.isActive ? "default" : "secondary"}>
                        {customerData.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Points Efficiency</span>
                      <span className="font-semibold">
                        {customerData.pointsEarned > 0 
                          ? Math.round((customerData.pointsRedeemed / customerData.pointsEarned) * 100)
                          : 0}% Redeemed
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Referral Success</span>
                      <span className="font-semibold">{customerData.totalReferrals} friends</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                      Your Referral Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-mono font-bold text-indigo-600 mb-2">
                        {customerData.referralCode}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Share this code with friends to earn bonus points!
                      </p>
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(customerData.referralCode);
                          toast({ title: "Copied!", description: "Referral code copied to clipboard" });
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Copy Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Points History</CardTitle>
                  <CardDescription>Track all your points earnings and redemptions</CardDescription>
                </CardHeader>
                <CardContent>
                  {pointsHistory?.length > 0 ? (
                    <div className="space-y-4">
                      {pointsHistory.map((transaction: PointsHistory) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              transaction.type === 'earned' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {transaction.type === 'earned' ? '+' : '-'}
                            </div>
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className={`font-bold ${
                            transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'earned' ? '+' : '-'}{Math.abs(transaction.points)} pts
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No points history available yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coupons" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Coupon Usage History</CardTitle>
                  <CardDescription>View all your coupon redemptions and discounts</CardDescription>
                </CardHeader>
                <CardContent>
                  {couponUsage?.length > 0 ? (
                    <div className="space-y-4">
                      {couponUsage.map((coupon: CouponUsage) => (
                        <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                              <Gift size={16} />
                            </div>
                            <div>
                              <div className="font-medium">Coupon: {coupon.code}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(coupon.usedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-purple-600">₹{coupon.discountAmount} saved</div>
                            <div className="text-sm text-gray-500">{coupon.pointsUsed} points used</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No coupons redeemed yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Rewards</CardTitle>
                  <CardDescription>Redeem your points for exciting rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">10% Discount</h4>
                        <Badge variant="outline">500 points</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Get 10% off your next purchase</p>
                      <Button 
                        size="sm" 
                        disabled={customerData.points < 500}
                        className="w-full"
                      >
                        {customerData.points >= 500 ? 'Redeem Now' : 'Need More Points'}
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">20% Discount</h4>
                        <Badge variant="outline">1000 points</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Get 20% off your next purchase</p>
                      <Button 
                        size="sm" 
                        disabled={customerData.points < 1000}
                        className="w-full"
                      >
                        {customerData.points >= 1000 ? 'Redeem Now' : 'Need More Points'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <User size={24} />
            Track My Activity
          </CardTitle>
          <CardDescription className="text-purple-100">
            Enter your phone number to view your points and rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter your phone number"
                {...form.register("phoneNumber")}
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-sm text-red-600">{form.formState.errors.phoneNumber.message}</p>
              )}
            </div>

            {trackMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {trackMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              disabled={trackMutation.isPending}
            >
              {trackMutation.isPending ? "Searching..." : "Track My Activity"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Enter the phone number you used during registration
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}