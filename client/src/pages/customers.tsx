import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Star } from "lucide-react";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

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
                  {customers.map((customer: Customer) => (
                    <div key={customer.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-medium text-lg">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
                            <div className="flex items-center text-gray-500 text-sm">
                              <Phone className="h-4 w-4 mr-1" />
                              {customer.phoneNumber}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
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
      </main>
    </>
  );
}
