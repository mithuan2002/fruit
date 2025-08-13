
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings as SettingsIcon, User, Phone, Building, Store } from "lucide-react";
import Header from "@/components/layout/header";

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    adminName: "",
    shopName: "",
    whatsappBusinessNumber: "",
    industry: "",
  });

  const industries = [
    { value: "food", label: "Food & Restaurants", emoji: "🍽️" },
    { value: "fashion", label: "Fashion & Apparel", emoji: "👗" },
    { value: "electronics", label: "Electronics & Tech", emoji: "📱" },
    { value: "beauty", label: "Beauty & Cosmetics", emoji: "💄" },
    { value: "services", label: "Services", emoji: "🛠️" },
    { value: "others", label: "Others", emoji: "📦" },
  ];

  // Load user data into form when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        adminName: user.adminName || "",
        shopName: user.shopName || "",
        whatsappBusinessNumber: user.whatsappBusinessNumber || "",
        industry: user.industry || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await updateProfile(formData);
      toast({
        title: "Settings Updated",
        description: "Your shop details have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update shop details",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Header 
        title="Settings" 
        description="Manage your shop details and business information"
      />
      
      <div className="container mx-auto px-6 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <SettingsIcon className="text-white h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Shop Settings
            </CardTitle>
            <CardDescription className="text-lg">
              Update your business information and preferences
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
                <h3 className="font-semibold text-blue-900 mb-2">Note:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Changes to your shop name will appear on all new coupons and communications</li>
                  <li>• Your industry selection affects the dashboard recommendations</li>
                  <li>• WhatsApp number updates will affect automated messaging</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Settings...
                  </>
                ) : (
                  <>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Update Settings
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
