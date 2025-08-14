import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Award, 
  Settings, 
  TrendingUp, 
  Gift, 
  Target, 
  CheckCircle, 
  ArrowRight,
  Clock,
  Zap,
  Star,
  Plus,
  DollarSign,
  Users,
  ShoppingCart,
  Calendar,
  BarChart3,
  Activity,
  MessageSquare
} from "lucide-react";
import { Link } from "wouter";

export default function PointsSetupGuide() {
  return (
    <>
      <Header
        title="Points Setup Guide"
        description="Complete guide: How points work + Simple setup instructions"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Points System Setup Guide
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Create flexible point rules for products and campaigns to reward customers and drive sales
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Setup takes 10 minutes
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Flexible rules
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Instant rewards
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="h-6 w-6 text-yellow-500" />
                How the Points System Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Settings className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Set Point Rules</h3>
                  <p className="text-sm text-gray-600">
                    Create rules for specific products or campaigns with custom point values
                  </p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Customers Buy</h3>
                  <p className="text-sm text-gray-600">
                    When customers purchase products, points are automatically awarded based on your rules
                  </p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Automatic Rewards</h3>
                  <p className="text-sm text-gray-600">
                    Points accumulate and customers get WhatsApp notifications about their earnings
                  </p>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Smart System:</strong> Your points system works automatically once set up. 
                  Customers earn points when they purchase products that match your rules, and the system 
                  handles all tracking and notifications.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Types of Point Rules */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Types of Point Rules You Can Create
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-900">Product-Based Rules</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Set points for specific products. Perfect for promoting certain items.
                    </p>
                    <div className="mt-2 space-y-1">
                      <Badge variant="outline" className="mr-2">Example: T-shirt = 50 points</Badge>
                      <Badge variant="outline" className="mr-2">Example: Sneakers = 100 points</Badge>
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-900">Category Rules</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Apply points to entire product categories for broader rewards.
                    </p>
                    <div className="mt-2 space-y-1">
                      <Badge variant="outline" className="mr-2">Example: All Electronics = 25 points</Badge>
                      <Badge variant="outline" className="mr-2">Example: Fashion Items = 15 points</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-purple-900">Campaign Rules</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Create special campaign rules for limited-time offers and promotions.
                    </p>
                    <div className="mt-2 space-y-1">
                      <Badge variant="outline" className="mr-2">Example: Christmas Sale = 200 points</Badge>
                      <Badge variant="outline" className="mr-2">Example: Buy 2 Get 1 = 150 points</Badge>
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-orange-900">Complex Campaign Rules</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Advanced rules for sophisticated promotional campaigns.
                    </p>
                    <div className="mt-2 space-y-1">
                      <Badge variant="outline" className="mr-2">Example: Refer 2 friends + buy = 500 points</Badge>
                      <Badge variant="outline" className="mr-2">Example: Holiday bundle = 300 points</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step-by-Step Setup */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Step-by-Step Setup Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Add Your Products First</h4>
                    <p className="text-gray-600 mb-3">
                      Before creating point rules, make sure you have added your products to the system. 
                      Each product needs a unique product code.
                    </p>
                    <Link href="/products">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Go to Products
                      </Button>
                    </Link>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Create Point Rules</h4>
                    <p className="text-gray-600 mb-3">
                      Set up point rules for your products or campaigns. You can create multiple rules 
                      with different point values and conditions.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Choose rule type (Product or Campaign)
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Select products or create campaign description
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Set point value customers will earn
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Add any special conditions (optional)
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Test Your Rules</h4>
                    <p className="text-gray-600 mb-3">
                      Process a test sale through the dashboard to make sure your point rules work correctly. 
                      Check that points are awarded as expected.
                    </p>
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Test on Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-semibold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Monitor Performance</h4>
                    <p className="text-gray-600 mb-3">
                      Track how your point rules are performing. See which products generate the most 
                      points and adjust rules as needed.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Activity className="h-4 w-4 text-blue-500" />
                        View point earning trends
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4 text-green-500" />
                        Monitor customer engagement
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                        Check WhatsApp notification delivery
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Best Practices for Point Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">✓ Do This</h4>
                    <ul className="space-y-2 text-sm text-green-800">
                      <li>• Start with simple product-based rules</li>
                      <li>• Set point values that motivate customers</li>
                      <li>• Test rules with small purchases first</li>
                      <li>• Create special campaign rules for holidays</li>
                      <li>• Review and adjust rules monthly</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2">✗ Avoid This</h4>
                    <ul className="space-y-2 text-sm text-red-800">
                      <li>• Setting points too low (customers won't care)</li>
                      <li>• Creating too many complex rules initially</li>
                      <li>• Forgetting to test rules before launching</li>
                      <li>• Not monitoring rule performance</li>
                      <li>• Changing rules too frequently</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Examples */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-500" />
                Real Campaign Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-4 bg-gradient-to-r from-red-50 to-green-50">
                  <h4 className="font-semibold text-red-900 mb-2">🎄 Christmas Campaign Example</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    "Christmas offer: refer to buy two hoodies and get 1 free"
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Rule Setup:</strong>
                      <ul className="mt-1 space-y-1 text-gray-600">
                        <li>• Rule Type: Campaign</li>
                        <li>• Products: Hoodies (select all hoodie products)</li>
                        <li>• Points: 300 points</li>
                        <li>• Condition: Must purchase 2 hoodies</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Customer Experience:</strong>
                      <ul className="mt-1 space-y-1 text-gray-600">
                        <li>• Customer buys 2 hoodies using referral code</li>
                        <li>• System awards 300 points automatically</li>
                        <li>• WhatsApp notification sent about point earnings</li>
                        <li>• Points can be redeemed for free third hoodie</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                  <h4 className="font-semibold text-blue-900 mb-2">👟 Sneaker Launch Campaign</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    "New sneaker launch: Early buyers get double points"
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Rule Setup:</strong>
                      <ul className="mt-1 space-y-1 text-gray-600">
                        <li>• Rule Type: Campaign</li>
                        <li>• Products: New Sneaker Model</li>
                        <li>• Points: 200 points (double normal)</li>
                        <li>• Duration: First 30 days</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Business Impact:</strong>
                      <ul className="mt-1 space-y-1 text-gray-600">
                        <li>• Drives early adoption of new products</li>
                        <li>• Creates urgency with limited-time offer</li>
                        <li>• Rewards loyal customers first</li>
                        <li>• Generates word-of-mouth marketing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Ready to Set Up Your Points System?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/points-setup" className="flex-1">
                  <Button className="w-full" size="lg">
                    <Award className="h-5 w-5 mr-2" />
                    Create Point Rules
                  </Button>
                </Link>
                <Link href="/products" className="flex-1">
                  <Button variant="outline" className="w-full" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Products First
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Need Help?</strong> The points system is designed to be flexible and powerful. 
              Start with simple product rules, then gradually add campaign rules as you get comfortable. 
              You can always modify or delete rules later.
            </AlertDescription>
          </Alert>

        </div>
      </main>
    </>
  );
}