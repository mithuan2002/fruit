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
  customer: {
    id: string;
    name: string;
    phoneNumber: string;
    referralCode: string;
  };
  referralCode: string;
  message: string;
  isExistingCustomer: boolean;
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
    onSuccess: (data) => {
      setRegistrationData(data);
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      toast({
        title: data.isExistingCustomer ? "Welcome back!" : "Registration successful!",
        description: data.message,
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

  const onSubmit = async (data: RegistrationForm) => {
    // Clean phone number - remove any non-digits
    const cleanedData = {
      ...data,
      phoneNumber: data.phoneNumber.replace(/[^\d]/g, "")
    };

    // Try to install PWA immediately when form is submitted
    try {
      await installPWA();
      toast({
        title: "📱 App Installing...",
        description: "Fruitbox is being added to your home screen",
        duration: 2000,
      });
    } catch (error) {
      console.log('PWA installation not available or cancelled');
    }

    // Register the customer
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

  const installPWA = async () => {
    // Register service worker first
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA already installed');
      return;
    }

    // Try automatic install prompt
    if ((window as any).deferredPrompt) {
      const deferredPrompt = (window as any).deferredPrompt;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('PWA installed successfully');
      }
      (window as any).deferredPrompt = null;
    } else {
      // PWA install prompt not available
      console.log('PWA install prompt not available');
    }
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

  const handleViewCouponStatus = () => {
    if (!registrationData?.customer?.phoneNumber) {
      toast({
        title: "Error",
        description: "Phone number not found. Please try registering again.",
        variant: "destructive",
      });
      return;
    }

    const phoneNumber = registrationData.customer.phoneNumber;
    
    // Request notification permission for future updates
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // Redirect to tracking page
    window.location.href = `/track?phone=${encodeURIComponent(phoneNumber)}&auto=true`;
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

            {/* Coupon Status and Actions */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <CheckCircle className="text-green-600" size={24} />
                  <span className="font-bold text-green-800 text-lg">Your Coupon is Ready!</span>
                </div>
                <div className="text-center space-y-3">
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 mb-2">Current Status:</p>
                    <div className="flex items-center justify-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-300">
                        Active
                      </Badge>
                      <span className="text-sm text-gray-600">• 0 points earned</span>
                    </div>
                  </div>
                  <p className="text-sm text-green-700">
                    Your coupon is active and ready to use! Track your points, view rewards, and see your usage history.
                  </p>
                </div>
                <Button 
                  onClick={handleViewCouponStatus}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg py-3 mt-4"
                  disabled={registerMutation.isPending}
                >
                  📊 View My Coupon Status & Points
                </Button>
                <p className="text-xs text-green-600 mt-3 text-center">
                  ✨ Real-time updates • Track rewards • View history
                </p>
              </div>

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
          <CardTitle className="text-2xl font-bold">Welcome to Fruitbox</CardTitle>
          <CardDescription className="text-indigo-100">
            Register to get your unique coupon code
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
              {registerMutation.isPending ? "Registering..." : "Get My Coupon Code"}
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