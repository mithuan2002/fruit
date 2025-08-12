
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  BarChart3
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-12">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fruitbox
            </h1>
          </div>
          
          <p className="text-2xl font-semibold text-gray-800 mb-4">
            Affiliate Tool for Retail Stores
          </p>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Turn every customer into a sales person. Automated referral campaigns with WhatsApp integration that actually drive revenue.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-3" onClick={() => window.location.href = '/auth'}>
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
          
          <Badge variant="secondary" className="text-sm px-4 py-2">
            Setup in 10 minutes • No credit card required
          </Badge>
        </div>
      </div>

      {/* Key Features */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Everything You Need to Grow
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Referral System</h3>
              <p className="text-gray-600">
                Automated referral codes, point tracking, and reward management. Your customers become your marketing team.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">WhatsApp Automation</h3>
              <p className="text-gray-600">
                Send personalized messages automatically. Welcome new customers, share referral codes, notify about rewards.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-time Analytics</h3>
              <p className="text-gray-600">
                Track campaign performance, customer activity, and ROI. Make data-driven decisions to optimize growth.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-3">Setup Campaigns</h3>
              <p className="text-gray-600">
                Create referral campaigns with custom rewards. Choose points, discounts, or free products.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-3">Customers Refer</h3>
              <p className="text-gray-600">
                Customers share their unique codes via WhatsApp. New customers get discounts, referrers earn rewards.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-3">Watch Growth</h3>
              <p className="text-gray-600">
                Monitor referrals, track revenue, and see your customer base grow organically through word-of-mouth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Real Results
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">3x</div>
              <p className="text-gray-600">Customer acquisition rate</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">40%</div>
              <p className="text-gray-600">Lower marketing costs</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">85%</div>
              <p className="text-gray-600">Customer retention improvement</p>
            </div>
          </div>
          
          <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-4">ROI Calculator</h3>
              <p className="text-gray-700 mb-4">
                Average store sees <span className="font-bold text-blue-600">₹2.5 return for every ₹1 spent</span> on referral campaigns
              </p>
              <p className="text-sm text-gray-600">
                Based on 500+ retail stores using Fruitbox
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of retail stores already growing with Fruitbox
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3" onClick={() => window.location.href = '/auth'}>
              Start Your Free Trial
              <Zap className="ml-2 w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              No setup fees
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
