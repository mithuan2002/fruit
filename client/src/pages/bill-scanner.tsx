import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import BillPhotoUploader from "@/components/bill-photo-uploader";
import { CheckCircle, Receipt, TrendingUp, Users, Gift } from "lucide-react";

interface ProcessedBillResult {
  success: boolean;
  billSubmission: {
    id: string;
    billNumber: string;
    totalAmount: number;
    verificationStatus: string;
    submittedAt: string;
  };
  customer: {
    id: string;
    name: string;
  };
}

export default function BillScanner() {
  const [recentBills, setRecentBills] = useState<ProcessedBillResult[]>([]);
  const { toast } = useToast();

  const handleBillSubmitted = (result: ProcessedBillResult) => {
    setRecentBills(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 bills
    
    toast({
      title: "Bill Submitted Successfully!",
      description: `${result.customer.name}'s bill is now pending verification`,
    });
  };

  return (
    <>
      <Header
        title="Bill Submission"
        description="Submit customer bills for admin verification and point allocation"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Receipt className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Bills Submitted Today</p>
                    <p className="text-2xl font-bold text-gray-900">{recentBills.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Gift className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Bills Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {recentBills.filter(bill => bill.billSubmission.verificationStatus === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unique Customers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(recentBills.map(b => b.customer.id)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{recentBills.reduce((sum, bill) => sum + bill.billSubmission.totalAmount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bill Photo Uploader */}
            <div className="lg:col-span-2">
              <BillPhotoUploader onBillSubmitted={handleBillSubmitted} />
            </div>

            {/* Recent Bills */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Recent Submissions</CardTitle>
                  <CardDescription>Latest bill submissions and their status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentBills.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No bills submitted yet. Upload your first bill to get started!
                    </p>
                  ) : (
                    recentBills.map((bill, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{bill.customer.name}</p>
                            <p className="text-sm text-gray-600">₹{bill.billSubmission.totalAmount}</p>
                          </div>
                          <Badge 
                            variant={bill.billSubmission.verificationStatus === 'pending' ? 'outline' : 
                                   bill.billSubmission.verificationStatus === 'approved' ? 'default' : 'destructive'}
                          >
                            {bill.billSubmission.verificationStatus}
                          </Badge>
                        </div>
                        
                        {bill.billSubmission.billNumber && (
                          <p className="text-xs text-gray-500">
                            Bill: {bill.billSubmission.billNumber}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-400">
                          {new Date(bill.billSubmission.submittedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
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