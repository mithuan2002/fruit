import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, CheckCircle, AlertTriangle, Clock, RefreshCw } from "lucide-react";

interface SmsMessage {
  id: string;
  messageId?: string;
  phoneNumber: string;
  message: string;
  status: string;
  sentAt: string;
  type: string;
}

export default function SmsTroubleshoot() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: messages, refetch } = useQuery<SmsMessage[]>({
    queryKey: ["/api/sms"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const latestMessage = messages?.[0];

  const getTroubleshootingSteps = (phoneNumber: string) => {
    const countryCode = phoneNumber.startsWith('+91') ? 'India' : 
                       phoneNumber.startsWith('+1') ? 'US/Canada' : 'Unknown';
    
    return [
      {
        title: "Check Phone Number Format",
        status: phoneNumber.startsWith('+') ? "✓" : "⚠",
        details: `Your number: ${phoneNumber} (${countryCode})`
      },
      {
        title: "SMS Delivery Time",
        status: "⏱",
        details: "SMS can take 1-5 minutes for delivery, especially for international numbers"
      },
      {
        title: "Check Spam/Junk Folder",
        status: "❓",
        details: "Some carriers filter promotional SMS messages"
      },
      {
        title: "Verify Twilio Configuration",
        status: "✓",
        details: "Twilio API accepted the message successfully"
      },
      {
        title: "Network Issues",
        status: "❓",
        details: "Check your mobile network connection and signal strength"
      }
    ];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Troubleshooting
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {latestMessage ? (
          <>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Latest SMS Status:</strong> Message sent to {latestMessage.phoneNumber} at{' '}
                {new Date(latestMessage.sentAt).toLocaleTimeString()}
                <Badge
                  variant={latestMessage.status === 'sent' ? 'default' : 'destructive'}
                  className="ml-2"
                >
                  {latestMessage.status}
                </Badge>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Troubleshooting Checklist:</h4>
              {getTroubleshootingSteps(latestMessage.phoneNumber).map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">{step.status}</span>
                  <div>
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-gray-600">{step.details}</div>
                  </div>
                </div>
              ))}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Common Reasons for SMS Delays:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• International SMS can take 1-5 minutes to deliver</li>
                  <li>• Carrier filtering for promotional messages</li>
                  <li>• Network congestion during peak hours</li>
                  <li>• DND (Do Not Disturb) settings on the recipient's number</li>
                  <li>• Invalid or inactive phone number</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Message Details:</h5>
              <div className="text-sm text-blue-800 space-y-1">
                <div><strong>To:</strong> {latestMessage.phoneNumber}</div>
                <div><strong>Type:</strong> {latestMessage.type}</div>
                <div><strong>Content:</strong> {latestMessage.message.substring(0, 100)}...</div>
                <div><strong>Sent At:</strong> {new Date(latestMessage.sentAt).toLocaleString()}</div>
              </div>
            </div>
          </>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No SMS messages found. Try adding a customer first to test SMS functionality.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}