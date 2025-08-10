import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, Clock, AlertTriangle } from "lucide-react";

interface SmsStatsData {
  today: {
    sent: number;
    failed: number;
    total: number;
  };
  allTime: {
    sent: number;
    failed: number;
    total: number;
  };
  messagesByType: Record<string, number>;
  deliveryRate: number;
}

export default function SmsStats() {
  const { data: stats, isLoading } = useQuery<SmsStatsData>({
    queryKey: ["/api/sms/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SMS Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SMS Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No statistics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          SMS Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Stats */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today's Activity
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.today.sent}</div>
              <div className="text-xs text-gray-500">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.today.failed}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.today.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>

        {/* All Time Stats */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            All Time
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-green-700">{stats.allTime.sent}</div>
              <div className="text-sm text-green-600">Messages Sent</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-lg font-semibold text-red-700">{stats.allTime.failed}</div>
              <div className="text-sm text-red-600">Failed Messages</div>
            </div>
          </div>
        </div>

        {/* Delivery Rate */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Delivery Rate</h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.deliveryRate}%` }}
              ></div>
            </div>
            <Badge
              variant={stats.deliveryRate >= 95 ? "default" : stats.deliveryRate >= 85 ? "secondary" : "destructive"}
              className={
                stats.deliveryRate >= 95
                  ? "bg-green-100 text-green-800"
                  : stats.deliveryRate >= 85
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {stats.deliveryRate}%
            </Badge>
          </div>
        </div>

        {/* Message Types */}
        {stats.messagesByType && Object.keys(stats.messagesByType).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Message Types</h4>
            <div className="space-y-2">
              {Object.entries(stats.messagesByType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">
                    {type.replace(/_/g, ' ')}
                  </span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Indicator */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {stats.deliveryRate >= 95 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Excellent delivery rate</span>
              </>
            ) : stats.deliveryRate >= 85 ? (
              <>
                <MessageSquare className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 font-medium">Good delivery rate</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 font-medium">Check SMS configuration</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}