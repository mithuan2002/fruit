import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store, User, Phone, Building } from "lucide-react";

export default function Onboarding() {
  const [formData, setFormData] = useState({
    adminName: "",
    shopName: "",
    whatsappBusinessNumber: "",
    industry: "",
  });
  const { onboard, isOnboarding } = useAuth();
  const { toast } = useToast();

  const industries = [
    { value: "food", label: "Food & Restaurants", emoji: "🍽️" },
    { value: "fashion", label: "Fashion & Apparel", emoji: "👗" },
    { value: "electronics", label: "Electronics & Tech", emoji: "📱" },
    { value: "beauty", label: "Beauty & Cosmetics", emoji: "💄" },
    { value: "services", label: "Services", emoji: "🛠️" },
    { value: "others", label: "Others", emoji: "📦" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onboard(formData);
      toast({
        title: "Welcome to Fruitbox!",
        description: "Your shop details have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error.message || "Failed to save shop details",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="text-white h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to Fruitbox! 🎉
          </CardTitle>
          <CardDescription className="text-lg">
            Let's set up your referral marketing system. Tell us about your business to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="adminName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Your Name
                </Label>
                <Input
                  id="adminName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange("adminName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopName" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Shop/Business Name
                </Label>
                <Input
                  id="shopName"
                  type="text"
                  placeholder="Enter your business name"
                  value={formData.shopName}
                  onChange={(e) => handleInputChange("shopName", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                WhatsApp Business Number
              </Label>
              <Input
                id="whatsappNumber"
                type="tel"
                placeholder="+1234567890"
                value={formData.whatsappBusinessNumber}
                onChange={(e) => handleInputChange("whatsappBusinessNumber", e.target.value)}
                required
              />
              <p className="text-sm text-gray-600">
                This will be used to send automated messages to your customers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => handleInputChange("industry", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry.value} value={industry.value}>
                      <span className="flex items-center gap-2">
                        <span>{industry.emoji}</span>
                        {industry.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">
                We'll customize your experience based on your industry
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Set up personalized referral campaigns for your industry</li>
                <li>• Configure WhatsApp messaging templates</li>
                <li>• Start tracking customer referrals and rewards</li>
                <li>• Access detailed analytics and reports</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isOnboarding}>
              {isOnboarding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up your account...
                </>
              ) : (
                "Complete Setup & Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}