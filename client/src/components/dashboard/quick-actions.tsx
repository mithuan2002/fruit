import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, CheckCircle, MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { WhatsappMessage } from "@shared/schema";

export default function QuickActions() {
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phoneNumber: "",
    points: 0,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recentSms, isLoading: smsLoading } = useQuery({
    queryKey: ["/api/sms"],
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (customerData: typeof customerForm) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Customer added successfully.",
      });
      setCustomerForm({ name: "", phoneNumber: "", points: 0 });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add customer.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.phoneNumber) {
      toast({
        title: "Error",
        description: "Name and phone number are required.",
        variant: "destructive",
      });
      return;
    }
    addCustomerMutation.mutate(customerForm);
  };

  return (
    <div className="space-y-6">
      {/* Quick Add Customer */}
      <Card className="border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Add Customer</h3>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </Label>
              <Input
                id="customerName"
                type="text"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={customerForm.phoneNumber}
                onChange={(e) => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
            <div>
              <Label htmlFor="initialPoints" className="block text-sm font-medium text-gray-700 mb-2">
                Initial Points
              </Label>
              <Input
                id="initialPoints"
                type="number"
                value={customerForm.points}
                onChange={(e) => setCustomerForm({ ...customerForm, points: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-blue-700 text-white"
              disabled={addCustomerMutation.isPending}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {addCustomerMutation.isPending ? "Adding..." : "Add Customer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent SMS Activity */}
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
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentSms && Array.isArray(recentSms) && recentSms.length > 0 ? (
            recentSms.slice(0, 3).map((sms: WhatsappMessage) => (
              <div key={sms.id} className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 ${
                      sms.type === "reward_earned" ? "bg-success" : "bg-primary"
                    } bg-opacity-10 rounded-full flex items-center justify-center`}>
                      {sms.type === "reward_earned" ? (
                        <CheckCircle className={`text-success h-3 w-3`} />
                      ) : (
                        <MessageCircle className={`text-primary h-3 w-3`} />
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
            <div className="p-4 text-center">
              <p className="text-gray-500">No SMS activity yet.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-3 bg-gray-50">
          <Button 
            variant="ghost" 
            className="w-full text-primary hover:text-blue-700 text-sm font-medium py-2"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Broadcast Message
          </Button>
        </div>
      </Card>
    </div>
  );
}
