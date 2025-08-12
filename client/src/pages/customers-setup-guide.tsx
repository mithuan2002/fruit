
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  UserPlus, 
  Gift, 
  Phone, 
  Settings, 
  CheckCircle, 
  ArrowRight,
  Clock,
  DollarSign,
  Zap,
  Star,
  Heart,
  Eye,
  Copy,
  Award,
  TrendingUp,
  Search,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";

export default function CustomersSetupGuide() {
  return (
    <>
      <Header
        title="Customers Setup Guide"
        description="Complete guide: How it works + Simple setup instructions"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Customers Setup Guide
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Add customers, track their referrals, manage points, and build lasting relationships
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Setup takes 5 minutes
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Auto referral codes
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Instant tracking
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="h-6 w-6 text-yellow-500" />
                How Customer Management Works
              </CardTitle>
              <p className="text-gray-600">
                Your customer database is the heart of your referral program. Every customer becomes a potential advocate for your business.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Add Customers</h3>
                  <p className="text-sm text-gray-600">
                    Enter customer name and phone number. They automatically get a unique referral code and start earning points
                  </p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Track Activity</h3>
                  <p className="text-sm text-gray-600">
                    Monitor points earned, referrals made, and rewards redeemed. See who your top performers are
                  </p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Manage Rewards</h3>
                  <p className="text-sm text-gray-600">
                    View customer points, redeem rewards, and build stronger relationships through personalized service
                  </p>
                </div>
              </div>

              <Alert className="mb-4">
                <Heart className="h-4 w-4" />
                <AlertDescription>
                  <strong>The Result:</strong> You build a database of engaged customers who actively promote your business and bring new customers regularly.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Auto Referral Codes</h4>
                    <p className="text-sm text-gray-600">Unique codes generated automatically for each customer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Points Tracking</h4>
                    <p className="text-sm text-gray-600">Real-time tracking of earned and redeemed points</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Performance Insights</h4>
                    <p className="text-sm text-gray-600">See top referrers and reward high performers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Easy Search</h4>
                    <p className="text-sm text-gray-600">Find customers quickly by name or phone number</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Profile Preview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                What Customer Profiles Look Like
              </CardTitle>
              <p className="text-sm text-gray-600">
                See how customer information is organized and what insights you get
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                
                {/* Customer Card Example */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Customer Profile Card</h4>
                  <div className="max-w-lg mx-auto">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Sarah Johnson</h3>
                          <div className="flex items-center text-gray-600 mt-1">
                            <Phone className="h-4 w-4 mr-2" />
                            <span className="text-sm">+91 98765 43210</span>
                          </div>
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700 border-blue-200">
                              SARAH2024
                            </Badge>
                            <Button size="sm" variant="ghost" className="p-1">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">750</div>
                            <div className="text-xs text-gray-500">Points</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">12</div>
                            <div className="text-xs text-gray-500">Referrals</div>
                          </div>
                          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Star className="h-3 w-3 mr-1" />
                            Top Referrer
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed View Example */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Detailed Customer View</h4>
                  <div className="max-w-lg mx-auto">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-medium mb-3">Sarah Johnson</h5>
                          <p className="text-sm text-gray-600 mb-3">+91 98765 43210</p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="text-xl font-bold text-green-600">1,200</div>
                              <div className="text-sm text-green-700">Points Earned</div>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                              <div className="text-xl font-bold text-red-600">450</div>
                              <div className="text-sm text-red-700">Points Redeemed</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="text-xl font-bold text-blue-600">750</div>
                              <div className="text-sm text-blue-700">Current Balance</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <div className="text-xl font-bold text-purple-600">12</div>
                              <div className="text-sm text-purple-700">Total Referrals</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Example */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Quick Search Feature</h4>
                  <div className="max-w-lg mx-auto">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search customers by name or phone..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white"
                          value="sarah"
                          readOnly
                        />
                      </div>
                      <div className="bg-white rounded border p-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Sarah Johnson</p>
                            <p className="text-sm text-gray-600">+91 98765 43210</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">750 points</p>
                            <p className="text-xs text-gray-500">12 referrals</p>
                          </div>
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
                Build your customer database and start tracking referrals and rewards
              </p>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Setup takes only 5 minutes!</strong> Add your first customers and they immediately get referral codes and can start earning points.
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
                      Start by adding customers you already have. Enter their name and phone number - that's all you need to get started.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Each customer automatically gets a unique referral code based on their name and current year (like SARAH2024). 
                        They can share this code with friends to earn points.
                      </p>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p><strong>What happens automatically:</strong></p>
                        <p>• Unique referral code generated</p>
                        <p>• Points balance starts at 0</p>
                        <p>• Welcome WhatsApp message sent (if configured)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Auto referral codes</Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Instant setup</Badge>
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
                    <h3 className="font-semibold mb-2 text-lg">Share Referral Codes</h3>
                    <p className="text-gray-600 mb-3">
                      Tell your customers about their referral codes. They can share these with friends to earn points when friends make purchases.
                    </p>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-green-800 mb-2">
                        You can copy any customer's referral code with one click and share it with them via WhatsApp, SMS, or in person. 
                        When someone uses that code to buy something, the customer earns points automatically.
                      </p>
                      <div className="bg-white rounded p-3 border border-green-200 mt-2">
                        <p className="text-sm text-gray-700 mb-1"><strong>Example message to customer:</strong></p>
                        <p className="text-sm text-gray-600 italic">
                          "Hi Sarah! Your referral code is SARAH2024. Share it with friends and earn 100 points for each purchase they make!"
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Copy className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">One-click copy and share</span>
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
                    <h3 className="font-semibold mb-2 text-lg">Process Referrals and Awards Points</h3>
                    <p className="text-gray-600 mb-3">
                      When someone uses a referral code to make a purchase, process it through the dashboard to award points to the referrer.
                    </p>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-yellow-800 mb-2">
                        Go to Dashboard → Process Referral, enter the referral code and sale amount. The system automatically:
                      </p>
                      <div className="space-y-1 text-sm text-yellow-800">
                        <p>• Awards points to the customer who made the referral</p>
                        <p>• Updates their total referral count</p>
                        <p>• Sends them a WhatsApp message about points earned</p>
                        <p>• Updates all dashboard metrics in real-time</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Zap className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Automatic point calculation and awarding</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-lg">Track Customer Performance</h3>
                    <p className="text-gray-600 mb-3">
                      Monitor which customers are your top performers and reward them with special offers or recognition.
                    </p>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-purple-800 mb-2">
                        The customer list automatically shows you who has the most referrals and points. Use this information to:
                      </p>
                      <div className="space-y-1 text-sm text-purple-800">
                        <p>• Identify your best brand ambassadors</p>
                        <p>• Offer them special VIP treatment or exclusive deals</p>
                        <p>• Create targeted campaigns for high performers</p>
                        <p>• Build stronger relationships with valuable customers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <BarChart3 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Automatic performance ranking</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      5
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-lg">Manage Points and Rewards</h3>
                    <p className="text-gray-600 mb-3">
                      Help customers redeem their points for discounts, free products, or other rewards you offer.
                    </p>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h4 className="font-medium text-indigo-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-indigo-800 mb-2">
                        When customers want to redeem points, use the Dashboard → Coupon Redemption feature. Enter their phone number 
                        and points to redeem, and the system automatically generates a discount coupon.
                      </p>
                      <div className="bg-white rounded p-3 border border-indigo-200 mt-2">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="font-medium text-indigo-900">Points Balance:</p>
                            <p className="text-gray-700">Always up-to-date</p>
                          </div>
                          <div>
                            <p className="font-medium text-indigo-900">Coupon Generation:</p>
                            <p className="text-gray-700">Automatic & unique</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800 mb-3">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-semibold text-lg">Customer System Ready!</span>
                </div>
                <p className="text-green-700 mb-3">
                  Your customer database is now the foundation of your referral program. Every customer becomes 
                  a potential source of new business through their referrals.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Heart className="h-4 w-4" />
                  <span>Happy customers with points to earn and redeem become your best marketers</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ready to Add Your First Customers?</CardTitle>
              <p className="text-gray-600">Start building your referral program with your existing customers</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/customers">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Users className="mr-2 h-4 w-4" />
                    Add Customers
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Dashboard
                  </Button>
                </Link>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Pro Tip:</strong> Start by adding 5-10 of your most loyal customers first. They're most likely to actively use their referral codes!
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  );
}
