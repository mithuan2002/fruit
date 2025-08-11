import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, QrCode, MessageSquare, Zap, Shield, Users } from "lucide-react";

export default function WhatsAppGuide() {
  const steps = [
    {
      icon: <QrCode className="h-5 w-5" />,
      title: "Connect Your Business WhatsApp",
      description: "Use your business WhatsApp phone to scan the QR code - this becomes the sender for all automated messages",
      status: "required"
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Automated Welcome Messages",
      description: "New customers automatically receive welcome messages with their unique coupon codes",
      status: "automated"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Real-time Notifications",
      description: "Customers get instant WhatsApp notifications for rewards, coupons, and referral updates",
      status: "automated"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Broadcast Messages",
      description: "Send promotional messages to all customers or selected groups instantly",
      status: "manual"
    }
  ];

  const features = [
    "✅ No API keys required - uses WhatsApp Web",
    "✅ Completely automated workflow",
    "✅ Real-time message delivery",
    "✅ Professional business messaging",
    "✅ QR code authentication",
    "✅ Bulk message broadcasting"
  ];

  return (
    <Card data-testid="card-whatsapp-guide">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          WhatsApp Automation Guide
        </CardTitle>
        <CardDescription>
          How the automated WhatsApp messaging works for your business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Setup & Automation Flow</h4>
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3" data-testid={`step-${index}`}>
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-medium">{step.title}</h5>
                  <Badge 
                    variant={step.status === "automated" ? "default" : step.status === "required" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {step.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Key Features</h4>
          <div className="grid grid-cols-1 gap-2">
            {features.map((feature, index) => (
              <p key={index} className="text-xs text-muted-foreground" data-testid={`feature-${index}`}>
                {feature}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-800">How to Register Your Shop WhatsApp</h4>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>1.</strong> Use your business WhatsApp account (the phone number customers will see)</p>
            <p><strong>2.</strong> When you scan the QR code, that WhatsApp account becomes the sender</p>
            <p><strong>3.</strong> All automated messages will appear to come from your business number</p>
            <p><strong>4.</strong> Customers can reply directly to your business WhatsApp</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-amber-600" />
            <h4 className="text-sm font-semibold text-amber-800">Educational Purpose</h4>
          </div>
          <p className="text-xs text-amber-700">
            This system uses WhatsApp Web.js for educational study purposes. For production use, ensure compliance with WhatsApp Business API policies.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2">Automation Triggers</h4>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• New customer added → Welcome message + coupon code</li>
            <li>• Coupon generated → Notification with coupon details</li>
            <li>• Referral completed → Reward notification</li>
            <li>• Manual broadcast → Custom promotional messages</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}