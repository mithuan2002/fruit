
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Megaphone, 
  Users, 
  Gift, 
  Target, 
  Settings, 
  CheckCircle, 
  ArrowRight,
  Clock,
  DollarSign,
  Zap,
  Star,
  Heart,
  Eye,
  Calendar,
  TrendingUp,
  Award,
  Percent
} from "lucide-react";
import { Link } from "wouter";

export default function CampaignsSetupGuide() {
  return (
    <>
      <Header
        title="Campaigns Setup Guide"
        description="Complete guide: How it works + Simple setup instructions"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Megaphone className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Campaigns Setup Guide
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Create targeted referral campaigns with custom rewards to boost customer engagement and drive sales
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Setup takes 10 minutes
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Unlimited campaigns
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Auto-tracking
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="h-6 w-6 text-yellow-500" />
                How Campaigns Work
              </CardTitle>
              <p className="text-gray-600">
                Campaigns are targeted referral programs with specific goals, timeframes, and rewards that motivate customers to refer more friends.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Set Campaign Goals</h3>
                  <p className="text-sm text-gray-600">
                    Define what you want to achieve: increase sales during festival season, launch new products, or reward loyal customers
                  </p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Create Special Rewards</h3>
                  <p className="text-sm text-gray-600">
                    Offer higher points, bonus rewards, or exclusive discounts for referrals made during this campaign period
                  </p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Track Performance</h3>
                  <p className="text-sm text-gray-600">
                    Monitor how many customers join, referrals generated, and revenue impact in real-time campaign analytics
                  </p>
                </div>
              </div>

              <Alert className="mb-4">
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <strong>The Result:</strong> Campaigns create urgency and excitement, leading to 3x more referrals compared to basic referral programs during campaign periods.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Time-Limited Offers</h4>
                    <p className="text-sm text-gray-600">Create urgency with start and end dates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Enhanced Rewards</h4>
                    <p className="text-sm text-gray-600">Offer special bonuses during campaigns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Targeted Messaging</h4>
                    <p className="text-sm text-gray-600">Custom WhatsApp messages for campaign participants</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Performance Analytics</h4>
                    <p className="text-sm text-gray-600">Detailed insights into campaign effectiveness</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Examples */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Real Campaign Examples
              </CardTitle>
              <p className="text-sm text-gray-600">
                See how different types of campaigns can boost your business
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                
                {/* Festival Campaign */}
                <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Gift className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-900">Diwali Special Campaign</h4>
                      <p className="text-sm text-orange-700">Oct 15 - Nov 15, 2024</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-300">Active</Badge>
                  </div>
                  <div className="bg-white rounded p-3 border border-orange-200">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Goal:</strong> Increase sales during festival season by 50%
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Reward:</strong> Double points (200 instead of 100) for each successful referral
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Results:</strong> 45 participants, 89 referrals, ₹1,25,000 additional revenue
                    </p>
                  </div>
                </div>

                {/* Product Launch Campaign */}
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">New Product Launch</h4>
                      <p className="text-sm text-blue-700">Dec 1 - Dec 31, 2024</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">Upcoming</Badge>
                  </div>
                  <div className="bg-white rounded p-3 border border-blue-200">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Goal:</strong> Get 100 customers to try our new organic tea collection
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Reward:</strong> Free sample box + 150 points for referrers, 20% off for referred customers
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Target:</strong> 100 participants, 200 referrals expected
                    </p>
                  </div>
                </div>

                {/* VIP Customer Campaign */}
                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Award className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-900">VIP Customer Exclusive</h4>
                      <p className="text-sm text-purple-700">Ongoing for top 20 customers</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-300">VIP Only</Badge>
                  </div>
                  <div className="bg-white rounded p-3 border border-purple-200">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Goal:</strong> Reward and retain highest-value customers
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Reward:</strong> 300 points per referral + exclusive VIP discounts
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Benefits:</strong> Early access to new products, special events invitations
                    </p>
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
                Create your first campaign and start driving more referrals with targeted incentives
              </p>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Setup takes only 10 minutes!</strong> You can create multiple campaigns and run them simultaneously for different customer segments.
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
                    <h3 className="font-semibold mb-2 text-lg">Define Your Campaign Goal</h3>
                    <p className="text-gray-600 mb-3">
                      Decide what you want to achieve: boost sales for a specific period, launch a new product, or reward loyal customers.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Clear goals help you design better rewards and measure success. Popular goals include increasing sales by X%, 
                        getting Y new customers, or launching new products successfully.
                      </p>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p><strong>Example goals:</strong></p>
                        <p>• Increase Diwali sales by 50%</p>
                        <p>• Get 100 customers to try new product line</p>
                        <p>• Reward top 20 customers with exclusive benefits</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Goal-focused</Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Measurable results</Badge>
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
                    <h3 className="font-semibold mb-2 text-lg">Set Campaign Timeline</h3>
                    <p className="text-gray-600 mb-3">
                      Choose start and end dates for your campaign. Time-limited offers create urgency and drive more immediate action.
                    </p>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-green-800 mb-2">
                        Limited-time campaigns perform 3x better than open-ended programs. Customers act faster when they know 
                        the special rewards won't last forever.
                      </p>
                      <div className="space-y-1 text-sm text-green-800">
                        <p><strong>Recommended durations:</strong></p>
                        <p>• Festival campaigns: 3-4 weeks</p>
                        <p>• Product launches: 2-6 weeks</p>
                        <p>• Flash campaigns: 1-2 weeks</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Creates urgency and drives action</span>
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
                    <h3 className="font-semibold mb-2 text-lg">Design Special Rewards</h3>
                    <p className="text-gray-600 mb-3">
                      Create attractive incentives that make customers excited to participate. Higher rewards during campaigns drive more referrals.
                    </p>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-yellow-800 mb-2">
                        Campaign rewards should be significantly better than regular referral rewards to motivate participation. 
                        The increased cost is offset by higher sales volume and customer acquisition.
                      </p>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="bg-white rounded p-2 border border-yellow-200">
                          <p className="text-xs text-yellow-700 font-medium">Regular Rewards</p>
                          <p className="text-sm text-gray-700">100 points per referral</p>
                        </div>
                        <div className="bg-white rounded p-2 border border-yellow-200">
                          <p className="text-xs text-yellow-700 font-medium">Campaign Rewards</p>
                          <p className="text-sm text-gray-700">200 points + bonus gift</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Gift className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Enhanced rewards drive 3x more referrals</span>
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
                    <h3 className="font-semibold mb-2 text-lg">Launch and Promote</h3>
                    <p className="text-gray-600 mb-3">
                      Create your campaign in the system and tell your customers about it through WhatsApp messages, social media, or in-store announcements.
                    </p>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-purple-800 mb-3">
                        Once you create the campaign, customers can join by participating in the referral program. The system automatically 
                        tracks their progress and applies campaign rewards instead of regular ones.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-purple-800">
                          <ArrowRight className="h-3 w-3" />
                          <strong>WhatsApp Broadcast:</strong> Send campaign announcement to all customers
                        </div>
                        <div className="flex items-center gap-2 text-sm text-purple-800">
                          <ArrowRight className="h-3 w-3" />
                          <strong>Auto-tracking:</strong> System applies campaign rewards automatically
                        </div>
                        <div className="flex items-center gap-2 text-sm text-purple-800">
                          <ArrowRight className="h-3 w-3" />
                          <strong>Real-time Analytics:</strong> Monitor progress throughout campaign
                        </div>
                      </div>
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
                    <h3 className="font-semibold mb-2 text-lg">Monitor and Optimize</h3>
                    <p className="text-gray-600 mb-3">
                      Track campaign performance in real-time and make adjustments if needed. View detailed analytics to understand what works best.
                    </p>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h4 className="font-medium text-indigo-900 mb-2">How This Works:</h4>
                      <p className="text-sm text-indigo-800 mb-2">
                        The campaign dashboard shows participant count, referrals generated, conversion rates, and revenue impact. 
                        Use this data to optimize future campaigns.
                      </p>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="bg-white rounded p-2 border border-indigo-200">
                          <p className="text-xs text-indigo-700 font-medium">Key Metrics</p>
                          <p className="text-sm text-gray-700">Participants, referrals, revenue</p>
                        </div>
                        <div className="bg-white rounded p-2 border border-indigo-200">
                          <p className="text-xs text-indigo-700 font-medium">Optimization</p>
                          <p className="text-sm text-gray-700">Adjust rewards, extend dates</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800 mb-3">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-semibold text-lg">Campaign Ready!</span>
                </div>
                <p className="text-green-700 mb-3">
                  Your campaign is now live and customers can start participating! Monitor the analytics to see 
                  how it performs and optimize for better results.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Heart className="h-4 w-4" />
                  <span>Campaigns typically generate 3-5x more referrals than regular programs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ready to Create Your First Campaign?</CardTitle>
              <p className="text-gray-600">Start driving more referrals with targeted campaigns</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/campaigns">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </Link>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Pro Tip:</strong> Start with a short 1-2 week campaign to test what rewards work best for your customers, then create longer campaigns!
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  );
}
