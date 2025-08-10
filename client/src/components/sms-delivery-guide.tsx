import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Phone, Settings, MessageSquare } from "lucide-react";

export default function SmsDeliveryGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          SMS Delivery Guide for India
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Good News:</strong> Twilio confirmed your SMS was delivered successfully!
            The issue is likely with Indian carrier filtering.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Check Your Phone Settings
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-blue-500">1.</span>
                <span>Open your SMS app and check the "Spam" or "Blocked Messages" folder</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500">2.</span>
                <span>Look for messages from international numbers (+1309...)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500">3.</span>
                <span>Check if "Block Unknown Senders" is enabled in SMS settings</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              DND (Do Not Disturb) Settings
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>SMS to 1909 from your number to check DND status</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>If DND is active, SMS "STOP 0" to 1909 to disable</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>DND blocks promotional SMS but may allow transactional ones</span>
              </div>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Why This Happens:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Indian carriers filter SMS from international numbers</li>
                <li>• Long messages (2+ segments) are more likely to be filtered</li>
                <li>• Promotional content triggers carrier spam filters</li>
                <li>• US Twilio numbers aren't whitelisted with Indian operators</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-green-50 p-4 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">Recommended Solutions:</h5>
            <div className="space-y-2 text-sm text-green-800">
              <div><Badge className="bg-green-100 text-green-800">Best</Badge> Get an Indian Twilio phone number (+91)</div>
              <div><Badge className="bg-blue-100 text-blue-800">Good</Badge> Use shorter message content (under 160 characters)</div>
              <div><Badge className="bg-yellow-100 text-yellow-800">Alternative</Badge> Test with different phone numbers</div>
              <div><Badge className="bg-purple-100 text-purple-800">Advanced</Badge> Set up SMS delivery webhooks for tracking</div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Current Message Details:</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>From:</strong> +13092740754 (US Twilio Number)</div>
              <div><strong>To:</strong> +919600267509 (Your Indian Number)</div>
              <div><strong>Status:</strong> Delivered by Twilio ✅</div>
              <div><strong>Segments:</strong> 2 (Long message)</div>
              <div><strong>Cost:</strong> $0.17 USD</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}