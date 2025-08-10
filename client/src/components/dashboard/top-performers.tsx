import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Customer } from "@shared/schema";

export default function TopPerformers() {
  const { data: topReferrers, isLoading } = useQuery({
    queryKey: ["/api/analytics/top-referrers"],
  });

  if (isLoading) {
    return (
      <div className="mt-8">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const badgeColors = ["primary", "secondary", "accent"];

  return (
    <div className="mt-8">
      <Card className="border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Referrers This Month</h3>
        </div>
        <CardContent className="p-6">
          {topReferrers && topReferrers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topReferrers.slice(0, 3).map((customer: Customer, index: number) => (
                <div key={customer.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Badge 
                      variant="secondary"
                      className={`w-10 h-10 rounded-full flex items-center justify-center bg-${badgeColors[index]} text-white`}
                    >
                      <span className="font-medium">{index + 1}</span>
                    </Badge>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.phoneNumber}</div>
                    <div className={`text-xs text-${badgeColors[index]} font-medium mt-1`}>
                      <span>{customer.totalReferrals}</span> referrals • 
                      <span className="ml-1">{customer.points}</span> points earned
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No referral data available yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
