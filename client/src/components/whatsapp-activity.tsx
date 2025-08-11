import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function WhatsAppActivity() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/whatsapp"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "default";
      case "delivered":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "welcome_referral":
        return "bg-blue-100 text-blue-800";
      case "coupon_generated":
        return "bg-green-100 text-green-800";
      case "reward_earned":
        return "bg-purple-100 text-purple-800";
      case "broadcast":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card data-testid="card-whatsapp-activity">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Recent WhatsApp Messages
        </CardTitle>
        <CardDescription>
          Latest automated WhatsApp messages sent to customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.slice(0, 10).map((message: any) => (
              <div
                key={message.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                data-testid={`row-message-${message.id}`}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(message.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900" data-testid={`text-phone-${message.id}`}>
                      {message.phoneNumber}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(message.type)}`}>
                        {message.type.replace('_', ' ')}
                      </span>
                      <Badge variant={getStatusColor(message.status) as any} data-testid={`badge-status-${message.id}`}>
                        {message.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate" data-testid={`text-message-${message.id}`}>
                    {message.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No WhatsApp messages sent yet</p>
            <p className="text-sm">Messages will appear here when customers are added or broadcasts are sent</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}