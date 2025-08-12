
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  Users, 
  Gift, 
  TrendingUp, 
  Settings, 
  CheckCircle, 
  ArrowRight,
  Target,
  Clock,
  DollarSign,
  Zap,
  Star,
  Heart,
  Eye,
  Activity,
  Award
} from "lucide-react";
import { Link } from "wouter";

export default function DashboardSetupGuide() {
  return (
    <>
      <Header
        title="Dashboard Setup Guide"
        description="Complete guide: How it works + Simple setup instructions"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Setup Guide
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Monitor your referral program performance and process customer rewards in real-time
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Setup takes 5 minutes
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Real-time analytics
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Instant insights
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="h-6 w-6 text-yellow-500" />
                How the Dashboard Works
              </CardTitle>
              <p className="text-gray-600">
                Your control center for monitoring referral performance, processing rewards, and getting instant insights into your business growth.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Live Analytics</h3>
                  <p className="text-sm text-gray-600">
                    See total customers, active referrals, rewards distributed, and conversion rates update in real-time
                  </p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Process Rewards</h3>
                  <p className="text-sm text-gray-600">
                    Quickly redeem customer points for rewards and generate coupon codes with a simple interface
                  </p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Top Performers</h3>
                  <p className="text-sm text-gray-600">
                    Identify your best customers who bring the most referrals and reward them accordingly
                  </p>
                </div>
              </div>

              <Alert className="mb-4">
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <strong>The Result:</strong> You get a complete view of your referral program's health and can make quick decisions to reward customers and boost growth.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Real-Time Updates</h4>
                    <p className="text-sm text-gray-600">All metrics update automatically as customers engage</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Quick Actions</h4>
                    <p className="text-sm text-gray-600">Process rewards and redeem points with one click</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Performance Insights</h4>
                    <p className="text-sm text-gray-600">See which customers and campaigns perform best</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Growth Tracking</h4>
                    <p className="text-sm text-gray-600">Monitor how your referral program drives business growth</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Preview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                What You'll See on Your Dashboard
              </CardTitle>
              <p className="text-sm text-gray-600">
                Here's how your dashboard will look and what each section shows
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Stats Cards Preview */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Key Metrics (Top Section)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">156</p>
                          <p className="text-sm text-blue-700">Total Customers</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-green-600">23</p>
                          <p className="text-sm text-green-700">Active Referrals</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-purple-600">₹12,500</p>
                          <p className="text-sm text-purple-700">Rewards Given</p>
                        </div>
                        <Gift className="h-8 w-8 text-purple-500" />
                      </div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-orange-600">14.7%</p>
                          <p className="text-sm text-orange-700">Conversion Rate</p>
                        </div>
                        <Target className="h-8 w-8 text-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coupon Redemption Preview */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Quick Coupon Redemption</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Gift className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Process Reward Redemption</p>
                          <p className="text-sm text-gray-600">Enter customer phone number and points to redeem</p>
                        </div>
                      </div>
                      <div className="bg-white rounded border p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600">Phone Number</label>
                            <div className="bg-gray-50 rounded px-2 py-1 text-sm">+91 98765 43210</div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Points to Redeem</label>
                            <div className="bg-gray-50 rounded px-2 py-1 text-sm">500 points</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="bg-blue-50 text-blue-700 rounded px-2 py-1 text-sm">
                            ✓ Generated coupon: SAVE20 (20% off)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Performers Preview */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Top Performing Customers</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white rounded p-3 border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-bold text-yellow-700">
                            1
                          </div>
                          <div>
                            <p className="font-medium">Sarah Johnson</p>
                            <p className="text-sm text-gray-600">+91 98765 43210</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">12 referrals</p>
                          <p className="text-sm text-gray-600">1,200 points</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded p-3 border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-700">
                            2
                          </div>
                          <div>
                            <p className="font-medium">Mike Chen</p>
                            <p className="text-sm text-gray-600">+91 87654 32109</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">8 referrals</p>
                          <p className="text-sm text-gray-600">800 points</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Setup Instructions
              </CardTitle>
              <p className="text-gray-600">
                Get your dashboard ready to monitor and manage your referral program effectively
              </p>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Setup takes only 5 minutes!</strong> The dashboard works automatically once you add customers and start processing referrals.
                </AlertDescription>
              </Alert>

              <div className="space-y-8">
                
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-lg">Add Your First Customers</h3>
                    <p className="text-gray-600 mb-3">
                      Start by adding customers to your system. Each customer gets a unique referral code and begins earning points.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-blue-800">
                        As soon as you add customers, your dashboard metrics start updating. The "Total Customers" count increases, 
                        and you'll see their referral activity appear in real-time. Each customer gets their own tracking profile.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Auto-updates</Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Real-time tracking</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-lg">Process Your First Referral</h3>
                    <p className="text-gray-600 mb-3">
                      When someone uses a referral code to make a purchase, process it through your dashboard to award points.
                    </p>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-green-800 mb-2">
                        Use the "Process Referral" feature to enter sale details and assign points. The dashboard immediately updates 
                        showing increased "Active Referrals" and "Rewards Distributed" numbers.
                      </p>
                      <p className="text-sm text-green-800">
                        <strong>Tip:</strong> If WhatsApp is set up, customers automatically get notified when they earn points.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Activity className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Instant metric updates</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-lg">Redeem Customer Points</h3>
                    <p className="text-gray-600 mb-3">
                      Use the Coupon Redemption section to convert customer points into discount coupons they can use for purchases.
                    </p>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-yellow-800 mb-2">
                        Enter a customer's phone number and the points they want to redeem. The system automatically generates 
                        a unique coupon code and deducts points from their account.
                      </p>
                      <p className="text-sm text-yellow-800">
                        <strong>Automatic:</strong> The customer gets a WhatsApp message with their new coupon code (if WhatsApp is configured).
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Gift className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Instant coupon generation</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-lg">Monitor Performance</h3>
                    <p className="text-gray-600 mb-3">
                      Check the Top Performers section to see which customers are bringing the most referrals and reward them accordingly.
                    </p>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-purple-800 mb-3">
                        The dashboard automatically ranks customers by referral count and points earned. This helps you identify 
                        your most valuable customers and create special rewards for them.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-purple-800">
                          <ArrowRight className="h-3 w-3" />
                          <strong>Conversion Rate:</strong> Shows how effective your referral program is
                        </div>
                        <div className="flex items-center gap-2 text-sm text-purple-800">
                          <ArrowRight className="h-3 w-3" />
                          <strong>Top Performers:</strong> Automatically updated list of best referrers
                        </div>
                        <div className="flex items-center gap-2 text-sm text-purple-800">
                          <ArrowRight className="h-3 w-3" />
                          <strong>Growth Tracking:</strong> See how your customer base grows over time
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800 mb-3">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-semibold text-lg">Dashboard Ready!</span>
                </div>
                <p className="text-green-700 mb-3">
                  Your dashboard is now your command center for monitoring referral performance, processing rewards, 
                  and growing your business through customer referrals.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Heart className="h-4 w-4" />
                  <span>All metrics update automatically as your business grows</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ready to Start?</CardTitle>
              <p className="text-gray-600">Access your dashboard and start managing your referral program</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/customers">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Users className="mr-2 h-4 w-4" />
                    Add First Customer
                  </Button>
                </Link>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Pro Tip:</strong> Add a few customers first, then process some referrals to see how the dashboard comes alive with real data!
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  );
}
