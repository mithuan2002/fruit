import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Settings, Play, QrCode, RefreshCw, Smartphone } from "lucide-react";
import Header from "@/components/layout/header";
import type { WhatsappStatus } from "@shared/schema";

export default function WatiCenter() {
  const { data: status, isLoading, refetch } = useQuery<WhatsappStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 5000, // Check every 5 seconds
  });

  const [isInitializing, setIsInitializing] = useState(false);
  const [showQRInstructions, setShowQRInstructions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/initialize", {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setShowQRInstructions(true);
        toast({
          title: "WhatsApp Web Opened!",
          description: "Please scan the QR code with your phone (+919600267509)",
        });
        // Start checking for connection
        checkConnection();
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: error.message || "Failed to open WhatsApp Web",
      });
      setIsInitializing(false);
    },
  });

  const checkConnection = async () => {
    setIsInitializing(true);
    try {
      const response = await apiRequest("POST", "/api/whatsapp/wait-connection", {});
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Connected!",
          description: "WhatsApp Web is now ready to send messages",
        });
        setShowQRInstructions(false);
        queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Please try scanning the QR code again",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleInitialize = () => {
    setIsInitializing(true);
    initializeMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Web Center</h1>
          <p className="mt-2 text-gray-600">
            Automated WhatsApp messaging using your business phone (+919600267509)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connection Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Connection Status
                </CardTitle>
                <CardDescription>
                  WhatsApp Web automation status for your demo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant={status?.connected ? "default" : "secondary"}>
                    {status?.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Business Number</span>
                  <span className="font-mono text-sm">{status?.businessNumber}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Business Name</span>
                  <span>{status?.businessName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Automation Type</span>
                  <Badge variant="outline">WhatsApp Web + Puppeteer</Badge>
                </div>

                {!status?.connected && (
                  <div className="pt-4">
                    <Button
                      onClick={handleInitialize}
                      disabled={isInitializing}
                      className="w-full"
                    >
                      {isInitializing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Opening WhatsApp Web...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start WhatsApp Web
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code Instructions */}
            {showQRInstructions && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <QrCode className="h-5 w-5" />
                    Scan QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-blue-800">
                    <p><strong>Step 1:</strong> A browser window opened with WhatsApp Web</p>
                    <p><strong>Step 2:</strong> Open WhatsApp on your phone (+919600267509)</p>
                    <p><strong>Step 3:</strong> Go to Settings → Linked Devices</p>
                    <p><strong>Step 4:</strong> Tap "Link a Device" and scan the QR code</p>
                    <p><strong>Step 5:</strong> Wait for connection confirmation</p>
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={checkConnection}
                      disabled={isInitializing}
                      variant="outline"
                      className="w-full"
                    >
                      {isInitializing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Checking Connection...
                        </>
                      ) : (
                        "I've Scanned the QR Code"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Demo Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Demo Features
                </CardTitle>
                <CardDescription>
                  What happens when you add customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="font-medium text-green-800">✅ Automated Welcome Messages</h4>
                  <p className="text-sm text-green-700 mt-1">
                    New customers automatically receive WhatsApp welcome messages with their referral codes
                  </p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-800">🎊 Points Notifications</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Customers get notified when they earn or redeem points
                  </p>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <h4 className="font-medium text-purple-800">📢 Broadcast Messages</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Send promotional messages to all customers instantly
                  </p>
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-800">
                    <strong>Demo Note:</strong> This uses WhatsApp Web automation via Puppeteer.
                    Messages are sent from your actual WhatsApp account (+919600267509).
                    Perfect for demonstrations without API verification delays!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}