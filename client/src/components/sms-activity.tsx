import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageCircle } from "lucide-react";
import type { SmsMessage } from "@shared/schema";

export default function SmsActivity() {
  const { data: recentSms, isLoading: smsLoading } = useQuery({
    queryKey: ["/api/sms"],
  });

  return (
    <Card className="border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent SMS Activity</h3>
          <Button variant="ghost" className="text-primary hover:text-blue-700 text-sm font-medium">
            View All
          </Button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {smsLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentSms && recentSms.length > 0 ? (
          recentSms.map((sms: SmsMessage) => (
            <div key={sms.id} className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 ${
                    sms.type === "reward_earned" ? "bg-green-100" : "bg-blue-100"
                  } rounded-full flex items-center justify-center`}>
                    {sms.type === "reward_earned" ? (
                      <CheckCircle className="text-green-600 h-3 w-3" />
                    ) : (
                      <MessageCircle className="text-blue-600 h-3 w-3" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{sms.message}</p>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <span>{sms.phoneNumber}</span>
                    <span className="mx-1">•</span>
                    <span>{new Date(sms.sentAt!).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No SMS activity yet.</p>
            <p className="text-xs text-gray-400 mt-1">SMS messages will appear here when customers receive notifications.</p>
          </div>
        )}
      </div>
    </Card>
  );
}