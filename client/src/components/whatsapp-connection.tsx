import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function WhatsAppConnection() {
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 5000, // Check status every 5 seconds
  });

  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    setLastUpdated(new Date());
  }, [status]);

  const handleRefresh = () => {
    refetch();
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

        <div className="mt-4 space-y-2">
          {!status?.connected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Setup Required:</strong> Connect your WhatsApp Business account
              </p>
              <div className="text-xs text-yellow-700 space-y-1">
                <p>1. Check the server console for a QR code</p>
                <p>2. Open WhatsApp on your business phone</p>
                <p>3. Go to Settings → Linked Devices → Link a Device</p>
                <p>4. Scan the QR code displayed in the console</p>
                <p>5. Your business WhatsApp will be the sender for all automated messages</p>
              </div>
            </div>
          )}

          {status?.connected && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                <strong>Ready for automation!</strong> New customers will automatically receive welcome messages with their coupon codes.
              </p>
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