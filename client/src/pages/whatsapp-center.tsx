import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Settings, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  BarChart3,
  RefreshCw,
  Phone,
  Key,
  Building2,
  Zap,
  Upload,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InteraktConfig {
  apiKey: string;
  apiUrl: string;
  phoneNumber: string;
  businessName: string;
}

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  points: number;
}

export default function WhatsAppCenter() {
  const [config, setConfig] = useState<InteraktConfig>({
    apiKey: '',
    apiUrl: 'https://api.interakt.ai/v1',
    phoneNumber: '',
    businessName: ''
  });
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current configuration
  const { data: currentConfig, isLoading: configLoading } = useQuery({
    queryKey: ["/api/interakt/config"],
  });

  // Get customers for broadcasting
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Get message stats
  const { data: messageStats } = useQuery({
    queryKey: ["/api/interakt/stats"],
  });

  // Configure Interakt
  const configureInterakt = useMutation({
    mutationFn: async (configData: InteraktConfig) => {
      const response = await apiRequest("POST", "/api/interakt/configure", configData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Interakt WhatsApp service has been configured successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interakt/config"] });
    },
    onError: () => {
      toast({
        title: "Configuration Failed",
        description: "Failed to configure Interakt service. Please check your credentials.",
        variant: "destructive",
      });
    },
  });

  // Send test message
  const sendTestMessage = useMutation({
    mutationFn: async ({ phoneNumber, message }: { phoneNumber: string; message: string }) => {
      const response = await apiRequest("POST", "/api/interakt/send-test", {
        phoneNumber,
        message
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Message Sent",
        description: "Test message has been sent successfully.",
      });
      setTestMessage('');
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send test message. Please check your configuration.",
        variant: "destructive",
      });
    },
  });

  // Send broadcast message
  const sendBroadcast = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/interakt/broadcast", {
        message
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Broadcast Sent",
        description: `Message sent to ${data.sent} customers successfully.`,
      });
      setBroadcastMessage('');
      queryClient.invalidateQueries({ queryKey: ["/api/interakt/stats"] });
    },
    onError: () => {
      toast({
        title: "Broadcast Failed",
        description: "Failed to send broadcast message.",
        variant: "destructive",
      });
    },
  });

  // Sync contacts with Interakt
  const syncContacts = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/interakt/sync-contacts");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Contacts Synced",
        description: `Successfully synced ${data.synced} contacts to Interakt.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] }); // Invalidate customers to reflect sync status if needed
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync contacts with Interakt. Please check your configuration and try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    configureInterakt.mutate(config);
  };

  const handleTestMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber || !testMessage) return;
    sendTestMessage.mutate({ phoneNumber: testPhoneNumber, message: testMessage });
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    sendBroadcast.mutate(broadcastMessage);
  };

  const isConfigured = (currentConfig as any)?.apiKey && (currentConfig as any)?.phoneNumber;

  return (
    <>
      <Header
        title="WhatsApp Center"
        description="Manage WhatsApp automation with Interakt integration"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">🚀 WhatsApp Center</h1>
              <p className="text-gray-600 mt-1">Manage automated WhatsApp messaging for your customers</p>
            </div>
            <Link href="/whatsapp-setup-guide">
              <Button variant="outline" className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 border-green-600 hover:border-green-700 shadow-lg">
                <MessageSquare className="h-4 w-4" />
                Setup Guide
              </Button>
            </Link>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Service Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {isConfigured ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-semibold text-green-600">Connected</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-semibold text-amber-600">Not Configured</span>
                        </>
                      )}
                    </div>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold">{customers.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Messages Sent</p>
                    <p className="text-2xl font-bold">{(messageStats as any)?.totalSent || 0}</p>
                  </div>
                  <Send className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{(messageStats as any)?.successRate || 0}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="automation" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="broadcasting">Broadcasting</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Automation Section */}
            <TabsContent value="automation">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Automation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Zap className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Automation Active</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          New customers automatically get added to Interakt contacts and receive welcome messages with e-coupons
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Auto-configured
                          </Badge>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            E-coupon included
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <Button 
                            onClick={() => syncContacts.mutate()} 
                            disabled={syncContacts.isPending}
                            variant="outline"
                            size="sm"
                            className="bg-white"
                          >
                            {syncContacts.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Sync Existing Customers
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-gray-500 mt-1">
                            Add all existing customers to Interakt contacts
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="configuration">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Interakt Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleConfigSubmit} className="space-y-4">
                    <Alert>
                      <Key className="h-4 w-4" />
                      <AlertDescription>
                        Enter your Interakt API credentials to enable WhatsApp messaging. 
                        You can find these in your Interakt dashboard under Settings → API Keys.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          placeholder="Enter your Interakt API key"
                          value={config.apiKey}
                          onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="apiUrl">API URL</Label>
                        <Input
                          id="apiUrl"
                          placeholder="https://api.interakt.ai/v1"
                          value={config.apiUrl}
                          onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Business Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          placeholder="+919xxxxxxxxx"
                          value={config.phoneNumber}
                          onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          placeholder="Your Business Name"
                          value={config.businessName}
                          onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={configureInterakt.isPending}
                      className="w-full md:w-auto"
                    >
                      {configureInterakt.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Configuring...
                        </>
                      ) : (
                        <>
                          <Settings className="mr-2 h-4 w-4" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                  </form>

                  {isConfigured && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Configuration Active</span>
                      </div>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Business: {(currentConfig as any)?.businessName}</p>
                        <p>Phone: {(currentConfig as any)?.phoneNumber}</p>
                        <p>API URL: {(currentConfig as any)?.apiUrl}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Test Messaging
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTestMessage} className="space-y-4">
                    <Alert>
                      <MessageSquare className="h-4 w-4" />
                      <AlertDescription>
                        Send a test message to verify your Interakt configuration is working correctly.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="testPhone">Test Phone Number</Label>
                        <Input
                          id="testPhone"
                          placeholder="+919xxxxxxxxx"
                          value={testPhoneNumber}
                          onChange={(e) => setTestPhoneNumber(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="testMessage">Test Message</Label>
                        <Textarea
                          id="testMessage"
                          placeholder="Enter your test message..."
                          value={testMessage}
                          onChange={(e) => setTestMessage(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={sendTestMessage.isPending || !isConfigured}
                    >
                      {sendTestMessage.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Test Message
                        </>
                      )}
                    </Button>

                    {!isConfigured && (
                      <p className="text-sm text-muted-foreground">
                        Please configure Interakt first to enable testing.
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Broadcasting Tab */}
            <TabsContent value="broadcasting">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Broadcast Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBroadcast} className="space-y-4">
                    <Alert>
                      <Send className="h-4 w-4" />
                      <AlertDescription>
                        Send a message to all {customers.length} customers. Use this feature responsibly 
                        to avoid being marked as spam.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="broadcastMessage">Broadcast Message</Label>
                      <Textarea
                        id="broadcastMessage"
                        placeholder="Enter your broadcast message..."
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        rows={6}
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Message length: {broadcastMessage.length} characters
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        This message will be sent to {customers.length} customers
                      </div>
                      <Button 
                        type="submit" 
                        disabled={sendBroadcast.isPending || !isConfigured || customers.length === 0}
                      >
                        {sendBroadcast.isPending ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Broadcasting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Broadcast
                          </>
                        )}
                      </Button>
                    </div>

                    {(!isConfigured || customers.length === 0) && (
                      <p className="text-sm text-muted-foreground">
                        {!isConfigured ? 'Please configure Interakt first.' : 'No customers available for broadcasting.'}
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Message Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Messages Sent:</span>
                        <Badge variant="secondary">{(messageStats as any)?.totalSent || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Successful Deliveries:</span>
                        <Badge variant="default">{(messageStats as any)?.delivered || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed Messages:</span>
                        <Badge variant="destructive">{(messageStats as any)?.failed || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <Badge variant="outline">{(messageStats as any)?.successRate || 0}%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Last Message Sent:</span>
                        <span className="text-muted-foreground">
                          {(messageStats as any)?.lastSent ? new Date((messageStats as any).lastSent).toLocaleString() : 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Today's Messages:</span>
                        <span className="text-muted-foreground">{(messageStats as any)?.todayCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>This Week:</span>
                        <span className="text-muted-foreground">{(messageStats as any)?.weekCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>This Month:</span>
                        <span className="text-muted-foreground">{(messageStats as any)?.monthCount || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}