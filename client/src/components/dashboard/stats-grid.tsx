import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Handshake, Gift, TrendingUp } from "lucide-react";

export default function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardContent className="p-5">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: "primary",
      change: "+12%",
      changeText: "from last month",
    },
    {
      title: "Active Referrals",
      value: stats?.activeReferrals || 0,
      icon: Handshake,
      color: "secondary",
      change: "+8%",
      changeText: "this week",
    },
    {
      title: "Rewards Distributed",
      value: `$${stats?.rewardsDistributed || 0}`,
      icon: Gift,
      color: "accent",
      change: "+15%",
      changeText: "this month",
    },
    {
      title: "Conversion Rate",
      value: `${stats?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: "success",
      change: "+3%",
      changeText: "improvement",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 bg-${stat.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                    <Icon className={`text-${stat.color} h-4 w-4`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center text-sm">
                  <span className="text-success font-medium">{stat.change}</span>
                  <span className="text-gray-500 ml-2">{stat.changeText}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
