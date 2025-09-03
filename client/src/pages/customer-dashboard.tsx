import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Gift, 
  Receipt, 
  Users, 
  Trophy,
  Camera,
  History,
  Bell,
  Settings,
  Star,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Share2,
  Copy,
  Plus
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  points: number;
  totalReferrals: number;
  referralCode: string;
  pointsEarned: number;
  pointsRedeemed: number;
  accountType: string;
  totalSpent: number;
  lastActivity: string;
  createdAt: string;
}

interface BillSubmission {
  id: string;
  billNumber: string | null;
  shopName: string | null;
  totalAmount: number;
  imageUrl: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  pointsAwarded: number;
  adminNotes: string | null;
  createdAt: string;
  campaign: {
    id: string;
    name: string;
  };
}

interface CustomerDashboardProps {
  customerId: string;
}

export default function CustomerDashboard({ customerId }: CustomerDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customer data
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['/api/customer/dashboard', customerId],
    queryFn: async (): Promise<Customer> => {
      const response = await fetch(`/api/customer/dashboard/${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch customer data');
      const data = await response.json();
      return data.customer;
    },
  });

  // Fetch customer's bill submissions
  const { data: billSubmissions, isLoading: billsLoading } = useQuery({
    queryKey: ['/api/customer/bills', customerId],
    queryFn: async (): Promise<BillSubmission[]> => {
      const response = await fetch(`/api/customer/${customerId}/bills`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      return response.json();
    },
  });

  // Fetch active campaigns
  const { data: activeCampaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns/active'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns/active');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
  });

  const copyReferralCode = () => {
    if (customer?.referralCode) {
      navigator.clipboard.writeText(customer.referralCode);
      toast({
        title: "Referral Code Copied!",
        description: "Share this code with friends to earn points when they make purchases.",
      });
    }
  };

  const shareReferralCode = () => {
    if (customer?.referralCode && navigator.share) {
      navigator.share({
        title: `Join ${customer.name}'s referral program`,
        text: `Use my referral code ${customer.referralCode} to get started and earn points!`,
        url: window.location.origin + `/register?referral=${customer.referralCode}`,
      });
    } else {
      copyReferralCode();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'vip': return 'bg-gold-100 text-gold-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const pointsProgress = customer ? Math.min((customer.points / 1000) * 100, 100) : 0;

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Customer Not Found</h3>
            <p className="text-gray-600">Unable to load customer dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt={customer.name} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {customer.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  Welcome back, {customer.name.split(' ')[0]}!
                </h1>
                <p className="text-sm text-gray-500">
                  Member since {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getAccountTypeColor(customer.accountType)}>
                {customer.accountType.toUpperCase()}
              </Badge>
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              My Bills
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Rewards
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Points Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Current Points</p>
                      <p className="text-3xl font-bold">{customer.points.toLocaleString()}</p>
                    </div>
                    <Gift className="h-12 w-12 text-blue-200" />
                  </div>
                  <div className="mt-4">
                    <Progress value={pointsProgress} className="bg-blue-400" />
                    <p className="text-xs text-blue-100 mt-1">
                      {Math.round(pointsProgress)}% to next milestone
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600">Total Earned</p>
                      <p className="text-2xl font-bold text-green-600">
                        {customer.pointsEarned.toLocaleString()}
                      </p>
                    </div>
                    <Trophy className="h-10 w-10 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600">Referrals Made</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {customer.totalReferrals}
                      </p>
                    </div>
                    <Users className="h-10 w-10 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Referral Code Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Your Referral Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Share this code with friends:</p>
                    <p className="text-2xl font-mono font-bold text-blue-600">
                      {customer.referralCode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={copyReferralCode}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button onClick={shareReferralCode}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Earn points when friends use your code to make their first purchase in any campaign!
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setSelectedTab('bills')}
                  >
                    <Camera className="h-6 w-6" />
                    Submit Bill
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setSelectedTab('bills')}
                  >
                    <History className="h-6 w-6" />
                    Bill History
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setSelectedTab('rewards')}
                  >
                    <Gift className="h-6 w-6" />
                    Redeem Points
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => setSelectedTab('referrals')}
                  >
                    <Share2 className="h-6 w-6" />
                    Invite Friends
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Bills</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Submit New Bill
              </Button>
            </div>

            {billsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading your bills...</p>
              </div>
            ) : billSubmissions && billSubmissions.length > 0 ? (
              <div className="grid gap-4">
                {billSubmissions.map((bill) => (
                  <Card key={bill.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Receipt className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {bill.shopName || bill.billNumber || 'Bill Submission'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {bill.campaign.name} • {formatDate(bill.createdAt)}
                            </p>
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(bill.totalAmount)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(bill.verificationStatus)}>
                            {getStatusIcon(bill.verificationStatus)}
                            <span className="ml-1 capitalize">{bill.verificationStatus}</span>
                          </Badge>
                          {bill.verificationStatus === 'approved' && (
                            <p className="text-sm text-green-600 mt-1">
                              +{bill.pointsAwarded} points
                            </p>
                          )}
                        </div>
                      </div>
                      {bill.adminNotes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Admin Note:</strong> {bill.adminNotes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Bills Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start submitting your bills to earn points!
                  </p>
                  <Button>
                    <Camera className="h-4 w-4 mr-2" />
                    Submit Your First Bill
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Referral Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    You've referred {customer.totalReferrals} friends!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Share your referral code to earn points when friends make purchases
                  </p>
                  <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-sm text-gray-600 mb-2">Your referral code:</p>
                    <p className="text-3xl font-mono font-bold text-blue-600 mb-4">
                      {customer.referralCode}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={copyReferralCode}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                      <Button onClick={shareReferralCode}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Available Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Rewards Coming Soon!</h3>
                  <p className="text-gray-600">
                    We're working on exciting rewards you can redeem with your points.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}