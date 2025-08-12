import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Users, 
  Gift, 
  Settings, 
  CheckCircle,
  ArrowRight,
  Phone,
  Star,
  Zap
} from "lucide-react";

interface WhatsAppMessageProps {
  senderName: string;
  businessName: string;
  message: string;
  timestamp: string;
  type: 'welcome' | 'points' | 'coupon';
}

function WhatsAppMessage({ senderName, businessName, message, timestamp, type }: WhatsAppMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'welcome': return '🎉';
      case 'points': return '🎊';
      case 'coupon': return '🎁';
      default: return '💬';
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-green-50 rounded-2xl p-4 border border-green-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm text-green-800">{businessName}</p>
          <p className="text-xs text-green-600">WhatsApp Business</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-3 mb-2">
        <div className="flex items-start gap-2">
          <span className="text-lg">{getIcon()}</span>
          <p className="text-sm text-gray-800 leading-relaxed">{message}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-right">{timestamp}</p>
    </div>
  );
}

function StepCard({ step, title, description, icon: Icon, isActive = false }: {
  step: number;
  title: string;
  description: string;
  icon: any;
  isActive?: boolean;
}) {
  return (
    <div className={`relative p-6 rounded-lg border-2 transition-all ${
      isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
          isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isActive ? "default" : "secondary"}>Step {step}</Badge>
          </div>
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How WhatsApp Automation Works for Your Business
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Automatically send personalized messages to your customers without any manual work. 
            Set it up once and let it run your referral program automatically.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              Fully Automatic
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Users className="h-4 w-4 mr-2" />
              Customer Friendly
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Star className="h-4 w-4 mr-2" />
              Increases Sales
            </Badge>
          </div>
        </div>
      </div>

      {/* Visual Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            See What Your Customers Receive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Welcome Message */}
            <div className="text-center space-y-4">
              <h4 className="font-semibold text-green-600">When They Join</h4>
              <WhatsAppMessage
                senderName="Customer"
                businessName="Sarah's Boutique"
                message="🎉 Welcome to Sarah's Boutique, John!

Your exclusive referral code: *JOHN123*

Share this code with friends and earn points for every successful referral!

💰 How it works:
• Share your code with friends
• They make a purchase using your code
• You earn reward points!

Start referring and earning today! 🚀"
                timestamp="2:45 PM"
                type="welcome"
              />
            </div>

            {/* Points Earned */}
            <div className="text-center space-y-4">
              <h4 className="font-semibold text-blue-600">When They Earn Points</h4>
              <WhatsAppMessage
                senderName="Customer"
                businessName="Sarah's Boutique"
                message="🎊 Congratulations John!

You've earned *25 points* from a successful referral!

💎 Total Points: 45

Keep sharing your referral code to earn more rewards!

Thank you for being a valued customer! ❤️"
                timestamp="4:20 PM"
                type="points"
              />
            </div>

            {/* Coupon Generated */}
            <div className="text-center space-y-4">
              <h4 className="font-semibold text-purple-600">When They Get Coupons</h4>
              <WhatsAppMessage
                senderName="Customer"
                businessName="Sarah's Boutique"
                message="🎁 New Coupon Generated!

Hi John,

Your new coupon code: *SAVE20OFF*

Use this code for your next purchase and save!

Valid for 100 uses. Don't miss out! 🛍️"
                timestamp="6:15 PM"
                type="coupon"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Simple 4-Step Setup Process
          </CardTitle>
          <p className="text-gray-600">Follow these easy steps to set up WhatsApp automation for your business</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <StepCard
              step={1}
              title="Create Your WATI Account"
              description="Go to wati.io and sign up for a free account. WATI is WhatsApp's official business partner. Choose the plan that fits your business size (starts from $49/month for unlimited messages)."
              icon={Users}
            />

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            <StepCard
              step={2}
              title="Get Your WhatsApp Business Number"
              description="WATI will help you connect your business phone number to WhatsApp Business. This usually takes 1-2 business days for approval. You'll get a green checkmark showing your business is verified."
              icon={Phone}
            />

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            <StepCard
              step={3}
              title="Copy Your WATI API Details"
              description="In your WATI dashboard, go to 'Settings' → 'API Access'. Copy your API Token and Business Phone Number. These are like keys that allow our system to send messages through your WhatsApp."
              icon={Settings}
            />

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            <StepCard
              step={4}
              title="Enter Details in WhatsApp Center"
              description="Come back here and paste your WATI API Token and phone number in the Configuration tab. Click 'Save' and you're done! Your customers will now automatically receive WhatsApp messages."
              icon={CheckCircle}
              isActive={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuration Help */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Gift className="h-6 w-6" />
            What You Need from WATI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">API Token</h4>
                <p className="text-sm text-gray-600">
                  Looks like: <code className="bg-white px-2 py-1 rounded text-xs">wati_abc123xyz789...</code>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Found in WATI Dashboard → Settings → API Access
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">Business Phone Number</h4>
                <p className="text-sm text-gray-600">
                  Format: <code className="bg-white px-2 py-1 rounded text-xs">+919876543210</code>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Your WhatsApp Business verified number
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Important Notes</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Phone numbers must include country code (e.g., +91 for India)</li>
              <li>• WATI approval takes 1-2 business days</li>
              <li>• Test with your own number first before going live</li>
              <li>• Keep your WATI subscription active for messages to work</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Star className="h-6 w-6" />
            What This Does for Your Business
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Automatic Customer Engagement</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Welcome new customers instantly
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Notify about earned rewards
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Send coupon codes immediately
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Increased Sales & Loyalty</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  More referrals through reminders
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Higher customer retention
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Professional business image
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}