import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Smartphone, Wifi, WifiOff, RefreshCw, Settings, LogOut } from "lucide-react";

export default function WhatsAppConnection() {
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 5000, // Check status every 5 seconds
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
    <Card data-testid="card-whatsapp-connection">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            WhatsApp Connection
          </CardTitle>
          <CardDescription>
            Monitor your WhatsApp Business account connection status
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          data-testid="button-refresh-status"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {status?.connected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge 
                  variant={status?.connected ? "default" : "destructive"}
                  data-testid="badge-connection-status"
                >
                  {isLoading ? "Checking..." : status?.connected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              {status?.businessNumber && (
                <p className="text-xs text-muted-foreground" data-testid="text-business-number">
                  Business Number: {status.businessNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
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

          {!status?.connected && showRegisterForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">Register Business WhatsApp</h4>
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
                    {registerMutation.isPending ? "Registering..." : "Register"}
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
      </CardContent>
    </Card>
  );
}