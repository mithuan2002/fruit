import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Settings, LogOut, Key, Phone, User } from "lucide-react";
import Header from "@/components/layout/header";
import type { WhatsappStatus } from "@shared/schema";

export default function WatiCenter() {
  const { data: status, isLoading, refetch } = useQuery<WhatsappStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 10000, // Check every 10 seconds
  });

  const [apiToken, setApiToken] = useState("");
  const [businessPhoneNumber, setBusinessPhoneNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showConfigForm, setShowConfigForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Show config form if not configured
  useEffect(() => {
    if (status && !status.configured) {
      setShowConfigForm(true);
    }
  }, [status]);

  const configureMutation = useMutation({
    mutationFn: async (data: { apiToken: string; businessPhoneNumber: string; businessName: string }) => {
      const response = await apiRequest("POST", "/api/whatsapp/configure", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "WATI Configured!",
        description: "Your WATI WhatsApp integration is now ready to send messages.",
      });
      setShowConfigForm(false);
      setApiToken("");
      setBusinessPhoneNumber("");
      setBusinessName("");
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Configuration Failed",
        description: error.message || "Failed to configure WATI integration",
      });
    },
  });

  const clearConfigMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/unregister", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Cleared",
        description: "WATI integration has been disconnected.",
      });
      setShowConfigForm(true);
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear WATI configuration",
      });
    },
  });

  const handleConfigure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiToken.trim() || !businessPhoneNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: "Please enter both API token and business phone number",
      });
      return;
    }
    configureMutation.mutate({
      apiToken: apiToken.trim(),
      businessPhoneNumber: businessPhoneNumber.trim(),
      businessName: businessName.trim() || "Your Shop"
    });
  };

  const handleClearConfig = () => {
    clearConfigMutation.mutate();
  };

  return (
    <>
      <Header
        title="WATI WhatsApp Center"
        description="Configure WATI integration for automated WhatsApp messaging."
        showCreateButton={false}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Status Card */}
            <Card data-testid="card-wati-status">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>WATI Integration Status</span>
                </CardTitle>
                <CardDescription>
                  Connect your WATI account to send automated WhatsApp messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div>
                      <div className="text-sm font-medium">Status</div>
                      <Badge 
                        variant={status?.configured ? "default" : "secondary"}
                        className={`text-xs ${status?.configured ? "bg-green-500" : "bg-gray-400"}`}
                        data-testid="badge-wati-status"
                      >
                        {isLoading ? 'Checking...' : status?.configured ? 'Connected' : 'Not Configured'}
                      </Badge>
                    </div>
                  </div>
                  {status?.configured && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Business Number</div>
                      <div className="text-sm font-medium">{status.businessNumber}</div>
                      <div className="text-xs text-muted-foreground">{status.businessName}</div>
                    </div>
                  )}
                </div>

                {/* Configuration Form */}
                {(!status?.configured || showConfigForm) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-3">Configure WATI Integration</h4>
                    <form onSubmit={handleConfigure} className="space-y-4">
                      <div>
                        <Label htmlFor="apiToken" className="text-xs text-blue-700">WATI API Token</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="apiToken"
                            type="password"
                            placeholder="Your WATI API access token"
                            value={apiToken}
                            onChange={(e) => setApiToken(e.target.value)}
                            className="text-sm pl-10"
                            data-testid="input-api-token"
                          />
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          Get your API token from WATI dashboard → Settings → API
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="businessPhone" className="text-xs text-blue-700">Your WhatsApp Business Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="businessPhone"
                            type="tel"
                            placeholder="+919876543210"
                            value={businessPhoneNumber}
                            onChange={(e) => setBusinessPhoneNumber(e.target.value)}
                            className="text-sm pl-10"
                            data-testid="input-business-phone"
                          />
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          Your registered WhatsApp Business number (same as in WATI)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="businessName" className="text-xs text-blue-700">Business Name (optional)</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="businessName"
                            type="text"
                            placeholder="Your Shop Name"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="text-sm pl-10"
                            data-testid="input-business-name"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          size="sm" 
                          disabled={configureMutation.isPending}
                          data-testid="button-configure"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {configureMutation.isPending ? "Configuring..." : "Configure WATI"}
                        </Button>
                        {status?.configured && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowConfigForm(false)}
                            data-testid="button-cancel-config"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </div>
                )}

                {/* Connected Status */}
                {status?.configured && !showConfigForm && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-800 font-medium">
                          ✅ WATI Connected & Ready!
                        </p>
                        <p className="text-xs text-green-700">
                          Business: {status.businessNumber} ({status.businessName})
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Automatic messages will be sent for new customers, points earned, and redemptions.
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowConfigForm(true)}
                          data-testid="button-edit-config"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearConfig}
                          disabled={clearConfigMutation.isPending}
                          data-testid="button-clear-config"
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card data-testid="card-how-it-works">
              <CardHeader>
                <CardTitle className="text-lg">How Automated Messaging Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">1</div>
                    <div>
                      <h4 className="font-medium text-sm">New Customer Welcome</h4>
                      <p className="text-xs text-muted-foreground">When you add a new customer, they automatically receive a welcome message with their referral code.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-semibold text-green-600">2</div>
                    <div>
                      <h4 className="font-medium text-sm">Points Earned Notification</h4>
                      <p className="text-xs text-muted-foreground">When customers earn points from referrals, they get notified automatically.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-semibold text-purple-600">3</div>
                    <div>
                      <h4 className="font-medium text-sm">Points Redemption Confirmation</h4>
                      <p className="text-xs text-muted-foreground">When points are redeemed, customers receive confirmation messages.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> You need a WATI account and WhatsApp Business API access to use this feature. 
                    All messages will be sent from your registered business WhatsApp number.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}