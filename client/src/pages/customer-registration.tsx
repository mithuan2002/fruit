import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Copy, Gift, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits")
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface RegistrationResponse {
  id: string;
  name: string;
  phoneNumber: string;
  referralCode: string;
  points: number;
  message: string;
  isExistingCustomer?: boolean;
}

export default function CustomerRegistration() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      phoneNumber: ""
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      const response = await fetch("/api/register-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      return response.json() as Promise<RegistrationResponse>;
    },
    onSuccess: async (data) => {
      // Store customer ID for PWA access
      localStorage.setItem('fruitbox_customer_id', data.id);
      
      // Auto-install PWA
      await attemptPWAInstall();
      
      // Redirect to customer app after a short delay
      setTimeout(() => {
        window.location.href = `/customer-app?customerId=${data.id}`;
      }, 2000);
      
      toast({
        title: data.isExistingCustomer ? "Welcome back!" : "PWA Installing...",
        description: data.isExistingCustomer ? "Redirecting to your rewards..." : "Setting up your rewards app...",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationForm) => {
    // Clean phone number - remove any non-digits
    const cleanedData = {
      ...data,
      phoneNumber: data.phoneNumber.replace(/[^\d]/g, "")
    };
    registerMutation.mutate(cleanedData);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Coupon code copied to clipboard",
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast({
        title: "Copied!",
        description: "Coupon code copied to clipboard",
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications enabled!",
          description: "You'll receive updates about your rewards and offers",
        });
      } else {
        toast({
          title: "Notifications disabled",
          description: "You can enable them later in your browser settings",
          variant: "destructive",
        });
      }
    }
  };

  const attemptPWAInstall = async () => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log("PWA already installed");
      return;
    }

    // Try native install prompt
    if ((window as any).deferredPrompt) {
      try {
        const deferredPrompt = (window as any).deferredPrompt;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast({
            title: "Perfect! 🎉",
            description: "Fruitbox is now on your home screen!",
          });
        } else {
          showManualInstallInstructions();
        }
        (window as any).deferredPrompt = null;
      } catch (error) {
        showManualInstallInstructions();
      }
    } else {
      showManualInstallInstructions();
    }
  };

  const installPWA = async () => {
    await attemptPWAInstall();
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = "";
    if (isIOS) {
      instructions = "Tap the Share button → Add to Home Screen";
    } else if (isAndroid) {
      instructions = "Tap the menu (⋮) → Add to Home screen";
    } else {
      instructions = "Use your browser's 'Add to Home Screen' option";
    }

    toast({
      title: "📱 Pin to Home Screen",
      description: instructions,
      duration: 5000,
    });
  };

  const handleNewRegistration = () => {
    setIsSuccess(false);
    setRegistrationData(null);
    form.reset();
  };

  if (isSuccess && registrationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <CheckCircle size={48} className="text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {registrationData.isExistingCustomer ? "Welcome Back!" : "Success!"}
            </CardTitle>
            <CardDescription className="text-green-100">
              {registrationData.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Label className="text-sm font-medium text-gray-600 block mb-2">
                  Your Unique Coupon Code
                </Label>
                <div className="flex items-center justify-center space-x-2">
                  <Badge 
                    variant="secondary" 
                    className="text-2xl font-mono py-2 px-4 bg-indigo-100 text-indigo-800 border border-indigo-200"
                  >
                    {registrationData.referralCode}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(registrationData.referralCode)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Gift className="text-blue-600" size={20} />
                  <span className="font-semibold text-blue-800">How to Use</span>
                </div>
                <p className="text-sm text-blue-700">
                  Show this code at checkout to earn points and get discounts on your purchases.
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Sparkles className="text-amber-600" size={20} />
                  <span className="font-semibold text-amber-800">Earn More</span>
                </div>
                <p className="text-sm text-amber-700">
                  Refer friends using your code to earn bonus points!
                </p>
              </div>
            </div>

            {/* PWA Installation and Notification Prompts */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-800 text-center">Quick Access</h4>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Sparkles className="text-purple-600" size={20} />
                  <span className="font-semibold text-purple-800">Pin Fruitbox</span>
                </div>
                <p className="text-sm text-purple-700 mb-3 text-center">
                  Add to your home screen for instant access to your rewards - no app store needed!
                </p>
                <Button 
                  onClick={installPWA}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  size="sm"
                >
                  📌 Pin to Home Screen
                </Button>
                <p className="text-xs text-purple-600 mt-2 text-center">
                  Works like an app, but lighter and faster!
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="font-semibold text-green-800">Stay Updated</span>
                </div>
                <p className="text-sm text-green-700 mb-3 text-center">
                  Get notified about new rewards, bonus points, and exclusive offers!
                </p>
                <Button 
                  onClick={requestNotificationPermission}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  🔔 Enable Notifications
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleNewRegistration} 
                variant="outline" 
                className="w-full"
              >
                Register Another Customer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
          <div className="mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Join Fruitbox Rewards</CardTitle>
          <CardDescription className="text-indigo-100">
            Earn points on every purchase • Refer friends for bonus rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                {...form.register("name")}
                data-testid="input-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter your phone number"
                {...form.register("phoneNumber")}
                data-testid="input-phone"
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-sm text-red-600">{form.formState.errors.phoneNumber.message}</p>
              )}
            </div>

            {registerMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {registerMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              disabled={registerMutation.isPending}
              data-testid="button-register"
            >
              {registerMutation.isPending ? "Setting up your rewards app..." : "Submit"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Scan the QR code at checkout to access this form quickly
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}