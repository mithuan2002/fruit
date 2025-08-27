import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Gift, Star, Clock, Phone, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomerData {
  customer: {
    id: string;
    name: string;
    phoneNumber: string;
    points: number;
    pointsRedeemed: number;
    totalPurchases: number;
    referralCode: string;
    createdAt: string;
  };
  transactions: any[];
  totalPointsEarned: number;
}

export default function CustomerApp() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get customer ID from URL params or localStorage
  const getCustomerId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const customerIdFromUrl = urlParams.get('customerId');
    
    if (customerIdFromUrl) {
      localStorage.setItem('fruitbox_customer_id', customerIdFromUrl);
      return customerIdFromUrl;
    }
    
    return localStorage.getItem('fruitbox_customer_id');
  };

  const fetchCustomerData = async () => {
    const customerId = getCustomerId();
    
    if (!customerId) {
      setError("Customer ID not found. Please register first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/customer/dashboard/${customerId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load customer data");
      }
      
      const data = await response.json();
      setCustomerData(data);
      setError(null);
    } catch (error) {
      setError("Unable to load your rewards data. Please try again.");
      console.error("Failed to fetch customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
    
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(fetchCustomerData, 30000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Coupon code copied to clipboard",
      });
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast({
        title: "Copied!",
        description: "Coupon code copied to clipboard",
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications enabled!",
          description: "You'll receive updates about your rewards",
        });
      }
    }
  };

  // If no customer found, show registration prompt
  if (!loading && !customerData && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">Welcome to Fruitbox!</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-6">
              To access your rewards, please register first by scanning the QR code at the store.
            </p>
            <Button 
              onClick={() => window.location.href = '/register'}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              Register Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your rewards...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customerData) {
    return null;
  }

  const { customer } = customerData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Rewards</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomerData}
            disabled={loading}
            className="mb-4"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Customer Info Card */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="h-5 w-5" />
                <span className="text-lg font-semibold">Hello, {customer.name}!</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm opacity-90">
                <Phone className="h-4 w-4" />
                <span>{customer.phoneNumber}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coupon Code Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
              <Gift className="h-5 w-5" />
              Your Coupon Code
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                <Badge 
                  variant="secondary" 
                  className="text-3xl font-mono py-3 px-6 bg-indigo-100 text-indigo-800 border border-indigo-200"
                >
                  {customer.referralCode}
                </Badge>
              </div>
              
              <Button
                onClick={() => copyToClipboard(customer.referralCode)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Coupon Code
              </Button>
              
              <p className="text-sm text-gray-600">
                Show this code at checkout to earn points!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Points Summary */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
              <Star className="h-5 w-5" />
              Your Points
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{customer.points}</div>
                <div className="text-sm text-green-700">Available Points</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{customerData.totalPointsEarned}</div>
                <div className="text-sm text-blue-700">Total Earned</div>
              </div>
            </div>
            
            {customer.pointsRedeemed > 0 && (
              <div className="mt-4 text-center bg-purple-50 p-3 rounded-lg">
                <div className="text-lg font-semibold text-purple-600">{customer.pointsRedeemed}</div>
                <div className="text-sm text-purple-700">Points Redeemed</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchase History */}
        {customer.totalPurchases > 0 && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
                <Clock className="h-5 w-5" />
                Purchase History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-2">{customer.totalPurchases}</div>
                <div className="text-sm text-amber-700">Total Purchases</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enable Notifications */}
        {'Notification' in window && Notification.permission !== 'granted' && (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="font-semibold text-gray-800">Stay Updated!</h3>
                <p className="text-sm text-gray-600">
                  Get notified about new rewards and bonus points
                </p>
                <Button 
                  onClick={requestNotificationPermission}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  🔔 Enable Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 py-4">
          <p>Member since {new Date(customer.createdAt).toLocaleDateString()}</p>
          <p className="mt-2">Thank you for choosing Fruitbox!</p>
        </div>
      </div>
    </div>
  );
}