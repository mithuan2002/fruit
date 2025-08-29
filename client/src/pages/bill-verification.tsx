import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, FileText, User, Calendar, Banknote, Receipt, AlertTriangle, ShoppingBag } from 'lucide-react';
import Header from '@/components/layout/header';
import { Label } from '@/components/ui/label';


interface PendingBill {
  bill: {
    id: string;
    totalAmount: string;
    campaignId?: string;
    campaignName?: string;
    imageData?: string;
    referralCode?: string;
    submittedAt: string;
    createdAt: string;
  };
  customer: {
    id: string;
    name: string;
    phoneNumber: string;
    points: number;
  };
}

export default function BillVerification() {
  const [selectedBill, setSelectedBill] = useState<PendingBill | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending bills
  const { data: pendingBills, isLoading } = useQuery({
    queryKey: ['/api/admin/pending-bills'],
    queryFn: async (): Promise<PendingBill[]> => {
      const response = await fetch('/api/admin/pending-bills');
      if (!response.ok) throw new Error('Failed to fetch pending bills');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Approve bill mutation
  const approveMutation = useMutation({
    mutationFn: async (billId: string) => {
      const response = await fetch(`/api/admin/approve-bill/${billId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve bill');
      }
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: 'Bill Approved Successfully!',
        description: `${result.customer.name} earned ${result.bill.pointsEarned} points`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-bills'] });
      setSelectedBill(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reject bill mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ billId, reason }: { billId: string; reason: string }) => {
      const response = await fetch(`/api/admin/reject-bill/${billId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject bill');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Bill Rejected',
        description: 'Bill has been rejected and customer will be notified',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-bills'] });
      setSelectedBill(null);
      setShowRejectDialog(false);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Rejection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (billId: string) => {
    approveMutation.mutate(billId);
  };

  const handleReject = () => {
    if (selectedBill) {
      rejectMutation.mutate({
        billId: selectedBill.bill.id,
        reason: rejectionReason,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculatePoints = (amount: string) => {
    return Math.floor(parseFloat(amount) / 10);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bill Verification</h1>
          <p className="text-gray-600 mt-2">Review and approve customer bill submissions with campaign-based points</p>
        </div>

        {!pendingBills || pendingBills.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Bills</h3>
              <p className="text-gray-600">All bills have been processed. Check back later for new submissions.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bills List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Pending Bills ({pendingBills.length})</h2>
              {pendingBills.map((item) => (
                <Card 
                  key={item.bill.id}
                  className={`cursor-pointer transition-all ${
                    selectedBill?.bill.id === item.bill.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedBill(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{item.customer.name}</h3>
                        <p className="text-sm text-gray-600">{item.customer.phoneNumber}</p>
                      </div>
                      <Badge variant="secondary">
                        ₹{item.bill.totalAmount}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Campaign:</span>
                        <p className="font-medium">{item.bill.campaignName || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <span className="text-xs text-gray-500">
                        {formatDate(item.bill.createdAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">
                          Campaign-based
                        </Badge>
                        <span className="text-sm text-green-600 font-medium">
                          +{calculatePoints(item.bill.totalAmount)} pts
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Bill Details */}
            <div>
              {selectedBill ? (
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Bill Details
                    </CardTitle>
                    <CardDescription>Review the bill information before approval</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Information
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-md space-y-1">
                        <p><strong>Name:</strong> {selectedBill.customer.name}</p>
                        <p><strong>Phone:</strong> {selectedBill.customer.phoneNumber}</p>
                        <p><strong>Current Points:</strong> {selectedBill.customer.points}</p>
                      </div>
                    </div>

                    {/* Bill Info */}
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Bill Information
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-md space-y-1">
                        <p><strong>Total Amount:</strong> ₹{selectedBill.bill.totalAmount}</p>
                        <p><strong>Points to Earn:</strong> {calculatePoints(selectedBill.bill.totalAmount)} points</p>
                        <p><strong>Campaign:</strong> {selectedBill.bill.campaignName || 'N/A'}</p>
                        {selectedBill.bill.referralCode && (
                          <p><strong>Referral Code:</strong> {selectedBill.bill.referralCode}</p>
                        )}
                      </div>
                    </div>

                    {/* Campaign Info */}
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Campaign Details
                      </h4>
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>Selected Campaign:</strong> {selectedBill.bill.campaignName}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Points will be calculated based on this campaign's rules
                        </p>
                      </div>
                    </div>

                    {/* Bill Image */}
                    {selectedBill.bill.imageData && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Bill Image</h4>
                        <img 
                          src={`data:image/jpeg;base64,${selectedBill.bill.imageData}`}
                          alt="Bill"
                          className="w-full max-w-md mx-auto rounded-lg border"
                        />
                      </div>
                    )}

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(selectedBill.bill.id)}
                        disabled={approveMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {approveMutation.isPending ? 'Approving...' : 'Approve & Process'}
                      </Button>

                      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                              Reject Bill
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Please provide a reason for rejecting this bill. The customer will be notified.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="py-4">
                            <Textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Enter reason for rejection..."
                              className="h-20"
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleReject}
                              disabled={rejectMutation.isPending || !rejectionReason.trim()}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Bill'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Bill</h3>
                    <p className="text-gray-600">Choose a bill from the list to review its details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}