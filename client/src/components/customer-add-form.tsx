import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CustomerAddForm() {
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phoneNumber: "",
    points: 0,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    <Card className="border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Add New Customer</h3>
          <UserPlus className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input
              id="customer-name"
              type="text"
              placeholder="Enter full name"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="customer-phone">Phone Number</Label>
            <Input
              id="customer-phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={customerForm.phoneNumber}
              onChange={(e) => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="customer-points">Initial Points (Optional)</Label>
            <Input
              id="customer-points"
              type="number"
              placeholder="0"
              min="0"
              value={customerForm.points}
              onChange={(e) => setCustomerForm({ ...customerForm, points: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={addCustomerMutation.isPending}
          >
            {addCustomerMutation.isPending ? "Adding..." : "Add Customer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}