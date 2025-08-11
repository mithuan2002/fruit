import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Smartphone, Wifi, WifiOff, RefreshCw, Settings, LogOut, MessageSquare } from "lucide-react";
import Header from "@/components/layout/header";
import type { WhatsappStatus } from "@shared/schema";

export default function WhatsAppSimple() {
  const { data: status, isLoading, refetch } = useQuery<WhatsappStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 5000,
  });

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setLastUpdated(new Date());
  }, [status]);

  const registerMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; businessName: string }) => {
      const response = await apiRequest("POST", "/api/whatsapp/register", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "WhatsApp Registered!",
        description: "Your business WhatsApp number has been registered successfully.",
      });
      setShowRegisterForm(false);
      setPhoneNumber("");
      setBusinessName("");
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to register WhatsApp number",
      });
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/unregister", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "WhatsApp Unregistered",
        description: "Your business WhatsApp has been unregistered.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unregister WhatsApp",
      });
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Phone Number Required",
        description: "Please enter your business WhatsApp number",
      });
      return;
    }
    registerMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      businessName: businessName.trim() || "Your Shop"
    });
  };

  const handleUnregister = () => {
    unregisterMutation.mutate();
  };

  return (
    <>
      <Header
        title="WhatsApp Center"
        description="Register your business WhatsApp number for automated messaging."
        showCreateButton={false}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Card data-testid="card-whatsapp-connection">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Business WhatsApp Registration</span>
              </CardTitle>
              <CardDescription>
                Register your business WhatsApp number to send automated messages to customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">WhatsApp Business</div>
                    <div className="text-xs text-muted-foreground">
                      Automated messaging system
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={status?.connected ? "default" : "secondary"}
                    className={`text-xs flex items-center space-x-1 ${status?.connected ? "bg-green-500" : "bg-gray-400"}`}
                    data-testid="badge-connection-status"
                  >
                    {status?.connected ? (
                      <Wifi className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                    <span>{status?.connected ? 'Connected' : 'Not Connected'}</span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    data-testid="button-refresh-status"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Debug info */}
                <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                  Debug: connected={status?.connected ? 'true' : 'false'}, showForm={showRegisterForm ? 'true' : 'false'}
                </div>
                
                {!status?.connected && !showRegisterForm && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800 mb-2">
                      <strong>Setup Required:</strong> Register your business WhatsApp number
                    </p>
                    <Button 
                      onClick={() => setShowRegisterForm(true)}
                      className="mt-2"
                      size="sm"
                      data-testid="button-setup-whatsapp"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Setup WhatsApp
                    </Button>
                  </div>
                )}

                {/* Always show this for debugging */}
                {(!status?.connected || showRegisterForm) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-3">Register Your Business WhatsApp</h4>
                    <form onSubmit={handleRegister} className="space-y-3">
                      <div>
                        <Label htmlFor="phone" className="text-xs text-blue-700">Business Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="text-sm"
                          data-testid="input-phone-number"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          Enter your actual business WhatsApp number. This will be the sender for all automated messages.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="business" className="text-xs text-blue-700">Business Name (optional)</Label>
                        <Input
                          id="business"
                          type="text"
                          placeholder="Your Shop Name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="text-sm"
                          data-testid="input-business-name"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          size="sm" 
                          disabled={registerMutation.isPending}
                          data-testid="button-register"
                        >
                          {registerMutation.isPending ? "Registering..." : "Register My WhatsApp"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowRegisterForm(false)}
                          data-testid="button-cancel-register"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                )}



                {status?.connected && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-800 font-medium">
                          Ready for automation!
                        </p>
                        <p className="text-xs text-green-700">
                          Registered: {status.businessNumber} ({status.businessName})
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Your business WhatsApp will be used as the sender for all automated messages.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUnregister}
                        disabled={unregisterMutation.isPending}
                        data-testid="button-unregister"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Unregister
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>

              {status?.connected && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">How It Works</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• When you add new customers, they automatically receive welcome messages</p>
                    <p>• Messages include referral codes and coupon information</p>
                    <p>• All messages appear to come from your registered business number</p>
                    <p>• Customers can reply directly to your WhatsApp</p>
                    <p>• This system is designed for educational study purposes</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}