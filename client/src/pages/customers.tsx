import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Phone, Star, TrendingUp, Users, Eye, Copy, Search, Gift, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import CustomerAddForm from "@/components/customer-add-form";
import ECouponCard from "@/components/e-coupon-card";
import type { Customer, Coupon } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Customers() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Query for customer coupons when a customer is selected
  const { data: customerCoupons } = useQuery<Coupon[]>({
    queryKey: ["/api/customers", selectedCustomer?.id, "coupons"],
    enabled: !!selectedCustomer?.id,
  });

  // Get user data to get shop name
  const { user } = useAuth();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const handleDeleteCustomer = (customerId: string) => {
    deleteMutation.mutate(customerId);
  };

  if (isLoading) {
    return (
      <>
        <Header
          title="Customers"
          description="Manage your customer database and track referral activity."
          createButtonText="Add Customer"
          showCreateButton={true}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        title="Customers"
        description="Manage your customer database and track referral activity."
        createButtonText="Add Customer"
        showCreateButton={true}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">🚀 Customers</h1>
              <p className="text-gray-600 mt-1">Manage your customer database and track referral activity</p>
            </div>
            <Link href="/customers-setup-guide">
              <Button variant="outline" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Setup Guide
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              <CustomerAddForm />
            </div>
            <div className="lg:col-span-2">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search customers by name or phone..."
                    className="pl-10"
                  />
                </div>
              </div>

          {/* Customer List */}
          <Card className="border border-gray-200">
            <CardContent className="p-0">
              {customers && customers.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <div key={customer.id} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                          <div className="flex items-center text-gray-600 mt-1">
                            <Phone className="h-4 w-4 mr-2" />
                            <span className="text-sm">{customer.phoneNumber}</span>
                          </div>
                          {customer.referralCode && (
                            <div className="flex items-center mt-2">
                              <Badge variant="outline" className="mr-2">
                                {customer.referralCode}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(customer.referralCode!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{customer.points}</div>
                            <div className="text-xs text-gray-500">Points</div>
                          </div>

                          <div className="text-center">
                            <div className="text-2xl font-bold text-secondary">{customer.totalReferrals}</div>
                            <div className="text-xs text-gray-500">Referrals</div>
                          </div>

                          {customer.totalReferrals > 0 && (
                            <Badge variant="secondary" className="bg-success bg-opacity-10 text-success">
                              <Star className="h-3 w-3 mr-1" />
                              Top Referrer
                            </Badge>
                          )}

                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedCustomer(customer)}
                                  data-testid={`button-view-details-${customer.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Customer Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold">{customer.name}</h4>
                                  <p className="text-sm text-gray-600">{customer.phoneNumber}</p>
                                </div>

                                {customer.referralCode && (
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">Referral Code:</span>
                                      <div className="flex items-center">
                                        <Badge variant="outline" className="mr-2">
                                          {customer.referralCode}
                                        </Badge>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => copyToClipboard(customer.referralCode!)}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* E-Coupon Section - Simple single coupon using referral code */}
                                {customer.referralCode && (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                      <Gift className="h-4 w-4 text-green-600" />
                                      <span className="text-sm font-medium text-green-800">E-Coupon</span>
                                    </div>
                                    {selectedCustomer && (
                                      <ECouponCard
                                        customerName={selectedCustomer.name}
                                        shopName={user?.shopName || "Your Shop"}
                                        couponCode={selectedCustomer.referralCode || "N/A"}
                                      />
                                    )}
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                      {customer.pointsEarned || 0}
                                    </div>
                                    <div className="text-sm text-green-700">Points Earned</div>
                                  </div>

                                  <div className="p-3 bg-red-50 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">
                                      {customer.pointsRedeemed || 0}
                                    </div>
                                    <div className="text-sm text-red-700">Points Redeemed</div>
                                  </div>

                                  <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {customer.points}
                                    </div>
                                    <div className="text-sm text-blue-700">Remaining Points</div>
                                  </div>

                                  <div className="p-3 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {customer.totalReferrals}
                                    </div>
                                    <div className="text-sm text-purple-700">Total Referrals</div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                                data-testid={`button-delete-${customer.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{customer.name}</strong>? This action cannot be undone and will remove all their referral data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCustomer(customer.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  data-testid={`button-confirm-delete-${customer.id}`}
                                >
                                  Delete Customer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No customers found. Add your first customer to get started.</p>
                </div>
              )}
            </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}