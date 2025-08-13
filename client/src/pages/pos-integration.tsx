import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Store, Zap, RefreshCw, Plus, CheckCircle, AlertCircle, Users } from "lucide-react";
import Header from "@/components/layout/header";

interface POSIntegration {
  name: string;
  connected: boolean;
}

export default function POSIntegrationPage() {
  const [selectedPOS, setSelectedPOS] = useState<string>("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for existing integrations
  const { data: integrations = [], isLoading } = useQuery<POSIntegration[]>({
    queryKey: ["/api/pos/integrations"],
  });

  // Add integration mutation
  const addIntegrationMutation = useMutation({
    mutationFn: async (data: { type: string; config: Record<string, string> }) => {
      return apiRequest("/api/pos/integrations", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "POS integration added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/integrations"] });
      setIsDialogOpen(false);
      setConfig({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add POS integration",
        variant: "destructive",
      });
    },
  });

  // Sync customers mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/pos/sync", "POST");
    },
    onSuccess: (data: any) => {
      toast({
        title: "Sync Complete!",
        description: `Imported ${data.imported} customers, skipped ${data.skipped} existing customers`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync customers",
        variant: "destructive",
      });
    },
  });

  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleAddIntegration = () => {
    if (!selectedPOS) {
      toast({
        title: "Error",
        description: "Please select a POS system",
        variant: "destructive",
      });
      return;
    }

    addIntegrationMutation.mutate({
      type: selectedPOS,
      config
    });
  };

  const renderConfigForm = () => {
    switch (selectedPOS) {
      case 'square':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter Square API Key"
                value={config.apiKey || ""}
                onChange={(e) => handleConfigChange("apiKey", e.target.value)}
                data-testid="input-square-api-key"
              />
            </div>
            <div>
              <Label htmlFor="environment">Environment</Label>
              <Select value={config.environment || "sandbox"} onValueChange={(value) => handleConfigChange("environment", value)}>
                <SelectTrigger data-testid="select-square-environment">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'shopify':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="shopUrl">Shop URL</Label>
              <Input
                id="shopUrl"
                placeholder="your-shop.myshopify.com"
                value={config.shopUrl || ""}
                onChange={(e) => handleConfigChange("shopUrl", e.target.value)}
                data-testid="input-shopify-url"
              />
            </div>
            <div>
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Enter Shopify Access Token"
                value={config.accessToken || ""}
                onChange={(e) => handleConfigChange("accessToken", e.target.value)}
                data-testid="input-shopify-token"
              />
            </div>
          </div>
        );
      case 'generic':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiUrl">API URL</Label>
              <Input
                id="apiUrl"
                placeholder="https://your-pos-api.com"
                value={config.apiUrl || ""}
                onChange={(e) => handleConfigChange("apiUrl", e.target.value)}
                data-testid="input-generic-url"
              />
            </div>
            <div>
              <Label htmlFor="authHeader">Authorization Header</Label>
              <Input
                id="authHeader"
                type="password"
                placeholder="Bearer your-token"
                value={config.authorization || ""}
                onChange={(e) => handleConfigChange("authorization", e.target.value)}
                data-testid="input-generic-auth"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">POS Integration</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your Point of Sale system to automatically sync customer data and streamline your referral program.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Connected POS Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading integrations...</span>
                </div>
              ) : integrations.length > 0 ? (
                <div className="grid gap-4">
                  {integrations.map((integration) => (
                    <div key={integration.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Store className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-sm text-gray-500">POS System</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={integration.connected ? "default" : "secondary"}>
                          {integration.connected ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Connected
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Disconnected
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {/* Sync Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => syncMutation.mutate()}
                      disabled={syncMutation.isPending}
                      size="lg"
                      data-testid="button-sync-customers"
                    >
                      {syncMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Users className="h-4 w-4 mr-2" />
                      )}
                      {syncMutation.isPending ? "Syncing..." : "Sync Customers Now"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No POS Systems Connected</h3>
                  <p className="text-gray-500 mb-4">Connect your first POS system to start syncing customers automatically.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add New Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add POS Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="supported" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="supported">Popular POS Systems</TabsTrigger>
                  <TabsTrigger value="benefits">Benefits</TabsTrigger>
                </TabsList>
                
                <TabsContent value="supported" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                      { id: 'square', name: 'Square', desc: 'Square Point of Sale' },
                      { id: 'shopify', name: 'Shopify POS', desc: 'Shopify Point of Sale' },
                      { id: 'generic', name: 'Custom API', desc: 'Any POS with REST API' }
                    ].map((pos) => (
                      <Card key={pos.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4 text-center">
                          <Store className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                          <h3 className="font-semibold mb-1">{pos.name}</h3>
                          <p className="text-sm text-gray-500 mb-3">{pos.desc}</p>
                          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedPOS(pos.id)}
                                data-testid={`button-connect-${pos.id}`}
                              >
                                Connect
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Connect {pos.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {renderConfigForm()}
                                <div className="flex justify-end gap-2 pt-4">
                                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleAddIntegration}
                                    disabled={addIntegrationMutation.isPending}
                                    data-testid="button-add-integration"
                                  >
                                    {addIntegrationMutation.isPending ? (
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Plus className="h-4 w-4 mr-2" />
                                    )}
                                    {addIntegrationMutation.isPending ? "Connecting..." : "Add Integration"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="benefits" className="mt-6">
                  <div className="grid gap-4">
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Automatic Customer Sync:</strong> New customers from your POS are automatically added to your referral program with unique referral codes.
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <Users className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Real-time Updates:</strong> Customer data stays synchronized between your POS and referral system through webhooks.
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>WhatsApp Integration:</strong> New customers automatically receive welcome messages with their referral codes via WhatsApp.
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}