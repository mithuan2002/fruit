import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Smartphone, 
  Users, 
  Gift, 
  Settings, 
  CheckCircle, 
  ArrowRight,
  Phone,
  Key,
  Building2,
  Star,
  Clock,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";

export default function WhatsAppSetupGuide() {
  return (
    <>
      <Header
        title="WhatsApp Setup Guide"
        description="Simple setup instructions for your referral marketing system"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              WhatsApp Marketing Made Simple
            </h1>
            <p className="text-lg text-gray-600">
              Automatically send messages to your customers using Interakt when they shop and refer friends
            </p>
          </div>

          {/* How It Works Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="h-6 w-6 text-yellow-500" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Customer Signs Up</h3>
                  <p className="text-sm text-gray-600">
                    When you add a new customer, they automatically get a welcome message with their unique referral code
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Friends Use Code</h3>
                  <p className="text-sm text-gray-600">
                    When someone uses their referral code to buy, your customer automatically gets points and a WhatsApp message
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Redeem Rewards</h3>
                  <p className="text-sm text-gray-600">
                    When customers redeem points, they get a confirmation message. Everything happens automatically!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Why WhatsApp Marketing Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">98% Open Rate</h4>
                    <p className="text-sm text-gray-600">Almost everyone reads WhatsApp messages immediately</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Automatic Messages</h4>
                    <p className="text-sm text-gray-600">No manual work - messages send themselves</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">More Referrals</h4>
                    <p className="text-sm text-gray-600">Customers share more when they get instant updates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Personal Touch</h4>
                    <p className="text-sm text-gray-600">Messages include customer names and personalized content</p>
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
                Simple Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Setup takes only 10 minutes!</strong> You need an Interakt account (WhatsApp Business API provider) to send messages.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Create an Interakt Account</h3>
                    <p className="text-gray-600 mb-3">
                      Visit <a href="https://www.interakt.ai" target="_blank" className="text-blue-600 underline">interakt.ai</a> and sign up for an account. 
                      Interakt is a WhatsApp Business API provider that lets you send automated messages.
                    </p>
                    <Badge variant="outline">Free trial available</Badge>
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
                  <div>
                    <h3 className="font-semibold mb-2">Connect Your WhatsApp Business Number</h3>
                    <p className="text-gray-600 mb-3">
                      In Interakt, connect your existing WhatsApp Business number or create a new one. 
                      This is the number customers will see messages from.
                    </p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Use your shop's WhatsApp Business number</span>
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
                  <div>
                    <h3 className="font-semibold mb-2">Get Your API Key</h3>
                    <p className="text-gray-600 mb-3">
                      In your Interakt dashboard, go to Settings → API Keys and copy your API key. 
                      This is like a password that lets Fruitbox send messages through Interakt.
                    </p>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Keep this key safe and private</span>
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
                  <div>
                    <h3 className="font-semibold mb-2">Configure Fruitbox</h3>
                    <p className="text-gray-600 mb-3">
                      Go to the WhatsApp Center in Fruitbox and enter:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Your Interakt API Key
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Your WhatsApp Business phone number
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Your business name
                      </li>
                    </ul>
                  </div>
                </div>

              </div>

              <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">That's it! You're ready to go!</span>
                </div>
                <p className="text-sm text-green-700">
                  Your customers will now automatically receive WhatsApp messages when they join, 
                  earn points, or redeem rewards. No more manual messaging needed!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ready to Get Started?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/whatsapp-center">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure WhatsApp Now
                  </Button>
                </Link>
                <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                  <a href="https://www.interakt.ai" target="_blank" rel="noopener noreferrer">
                    <Building2 className="mr-2 h-4 w-4" />
                    Sign Up for Interakt
                  </a>
                </Button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Need help?</strong> Contact Interakt support or your Fruitbox administrator for assistance with setup.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Message Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                What Your Customers Will See
              </CardTitle>
              <p className="text-sm text-gray-600">
                Here's how WhatsApp messages will look when sent to your customers
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Welcome Message Example */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Welcome Message (New Customer)</h4>
                  <div className="max-w-sm mx-auto">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">YS</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Your Shop</p>
                          <p className="text-xs text-gray-500">via WhatsApp Business</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          🎉 Welcome to Your Shop, Sarah!
                          <br /><br />
                          Your referral code: <strong className="bg-yellow-100 px-1 rounded">SARAH2024</strong>
                          <br /><br />
                          Share this code with friends and earn 100 points for each successful referral!
                          <br /><br />
                          Thank you for joining us! 🙏
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          12:45 PM ✓✓
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coupon Message Example */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Coupon Generated Message</h4>
                  <div className="max-w-sm mx-auto">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">YS</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Your Shop</p>
                          <p className="text-xs text-gray-500">via WhatsApp Business</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          🎁 Great news, Sarah!
                          <br /><br />
                          You've earned a reward! Use this coupon code:
                          <br />
                          <span className="bg-orange-100 px-2 py-1 rounded font-bold text-lg">SAVE20</span>
                          <br /><br />
                          💰 Get 20% off your next purchase
                          <br />
                          ⏰ Valid until Dec 31, 2024
                          <br /><br />
                          Visit us today and save! 🛍️
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          2:30 PM ✓✓
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Points Earned Message */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Points Earned Message</h4>
                  <div className="max-w-sm mx-auto">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">YS</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Your Shop</p>
                          <p className="text-xs text-gray-500">via WhatsApp Business</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          🌟 Congratulations, Sarah!
                          <br /><br />
                          You've earned <strong>100 points</strong> for referring Mike to our store!
                          <br /><br />
                          💎 Total points: 250
                          <br />
                          🎯 Next reward at: 500 points
                          <br /><br />
                          Keep referring friends to earn more rewards! 🚀
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          4:15 PM ✓✓
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Key Benefits:</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Automatic messages - no manual work needed
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Professional WhatsApp Business appearance
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Instant delivery to customers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Encourages more referrals and repeat business
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  );
}