import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, AlertCircle, TrendingUp } from "lucide-react";

export default function WhatsAppStats() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/whatsapp"],
  });

  if (isLoading) {
    return (
      <Card data-testid="card-whatsapp-stats">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp Statistics
          </CardTitle>
          <CardDescription>
            Overview of your automated WhatsApp messaging performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = messages ? {
    totalSent: messages.filter((msg: any) => msg.status === "sent").length,
    totalFailed: messages.filter((msg: any) => msg.status === "failed").length,
    todaySent: messages.filter((msg: any) => {
      const today = new Date().toDateString();
      return msg.status === "sent" && new Date(msg.sentAt).toDateString() === today;
    }).length,
    deliveryRate: messages.length > 0 ? 
      Math.round((messages.filter((msg: any) => msg.status === "sent").length / messages.length) * 100) : 0
  } : { totalSent: 0, totalFailed: 0, todaySent: 0, deliveryRate: 0 };

  return (
    <Card data-testid="card-whatsapp-stats">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          WhatsApp Statistics
        </CardTitle>
        <CardDescription>
          Overview of your automated WhatsApp messaging performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2" data-testid="stat-today-sent">
            <Send className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.todaySent}</p>
              <p className="text-xs text-muted-foreground">Sent Today</p>
            </div>
          </div>

          <div className="flex items-center space-x-2" data-testid="stat-total-sent">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalSent}</p>
              <p className="text-xs text-muted-foreground">Total Sent</p>
            </div>
          </div>

          <div className="flex items-center space-x-2" data-testid="stat-delivery-rate">
            <MessageSquare className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.deliveryRate}%</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
          </div>

          <div className="flex items-center space-x-2" data-testid="stat-failed">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalFailed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Automation Status</span>
            <span className="text-green-600 font-medium">✓ Active</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            New customers automatically receive welcome messages with coupon codes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}