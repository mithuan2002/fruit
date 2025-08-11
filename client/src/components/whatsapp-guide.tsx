import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, QrCode, MessageSquare, Zap, Shield, Users } from "lucide-react";

export default function WhatsAppGuide() {
  const steps = [
    {
      icon: <QrCode className="h-5 w-5" />,
      title: "Connect WhatsApp Business",
      description: "Scan the QR code from your server console with WhatsApp to link your business account",
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
            <Shield className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-800">Security & Compliance</h4>
          </div>
          <p className="text-xs text-blue-700">
            This system uses WhatsApp Web.js for educational purposes. For production use, ensure compliance with WhatsApp Business API policies and your local regulations.
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