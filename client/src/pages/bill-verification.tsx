
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Header from "@/components/layout/header";
import { CheckCircle, XCircle, Eye, Receipt, User, Phone, ShoppingBag, Calendar, Hash } from "lucide-react";

interface PendingBillItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PendingBill {
  bill: {
    id: string;
    billNumber: string;
    totalAmount: string;
    extractedItems: string;
    extractedText: string;
    ocrConfidence: string;
    imageUrl: string;
    referralCode: string | null;
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
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending bills
  const { data: pendingBills = [], isLoading } = useQuery({
    queryKey: ['/api/admin/pending-bills'],
    queryFn: async (): Promise<PendingBill[]> => {
      const response = await fetch('/api/admin/pending-bills');
      if (!response.ok) throw new Error('Failed to fetch pending bills');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Approve bill mutation
  const approveBillMutation = useMutation({
    mutationFn: async (billId: string) => {
      const response = await fetch(`/api/admin/approve-bill/${billId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve bill');
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: 'Bill Approved Successfully',
        description: `${result.customer.name} earned ${result.bill.pointsEarned} points`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-bills'] });
      setSelectedBill(null);
      setShowApproveDialog(false);
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
  const rejectBillMutation = useMutation({
    mutationFn: async ({ billId, reason }: { billId: string; reason: string }) => {
      const response = await fetch(`/api/admin/reject-bill/${billId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject bill');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Bill Rejected',
        description: 'Bill has been rejected and customer notified',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-bills'] });
      setSelectedBill(null);
      setShowRejectDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Rejection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (bill: PendingBill) => {
    setSelectedBill(bill);
    setShowApproveDialog(true);
  };

  const handleReject = (bill: PendingBill) => {
    setSelectedBill(bill);
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (selectedBill) {
      approveBillMutation.mutate(selectedBill.bill.id);
    }
  };

  const confirmReject = () => {
    if (selectedBill) {
      rejectBillMutation.mutate({
        billId: selectedBill.bill.id,
        reason: 'Bill details could not be verified'
      });
    }
  };

  const parseExtractedItems = (itemsJson: string): PendingBillItem[] => {
    try {
      return JSON.parse(itemsJson || '[]');
    } catch {
      return [];
    }
  };

  return (
    <>
      <Header
        title="Bill Verification"
        description="Review and approve customer bill submissions"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto py-6 px-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Receipt className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Bills</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingBills.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {pendingBills.reduce((sum, bill) => sum + parseExtractedItems(bill.bill.extractedItems).length, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ShoppingBag className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{pendingBills.reduce((sum, bill) => sum + parseFloat(bill.bill.totalAmount), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Bills List */}
          <Card>
            <CardHeader>
              <CardTitle>Bills Awaiting Verification</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading pending bills...</div>
              ) : pendingBills.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No bills pending verification
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingBills.map((pendingBill) => {
                    const extractedItems = parseExtractedItems(pendingBill.bill.extractedItems);
                    return (
                      <Card key={pendingBill.bill.id} className="border-l-4 border-l-orange-400">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Customer & Bill Info */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold">{pendingBill.customer.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-3 w-3" />
                                <span>{pendingBill.customer.phoneNumber}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Hash className="h-3 w-3" />
                                <span className="font-mono">{pendingBill.bill.billNumber}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(pendingBill.bill.submittedAt).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Bill Details */}
                            <div className="space-y-3">
                              <div className="text-lg font-bold text-green-600">
                                Total: ₹{pendingBill.bill.totalAmount}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Items: </span>
                                <span>{extractedItems.length} products</span>
                              </div>
                              {pendingBill.bill.referralCode && (
                                <Badge variant="secondary">
                                  Referral: {pendingBill.bill.referralCode}
                                </Badge>
                              )}
                              <Badge variant="outline">
                                OCR: {pendingBill.bill.ocrConfidence}% confidence
                              </Badge>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleApprove(pendingBill)}
                                  className="flex-1"
                                  disabled={approveBillMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(pendingBill)}
                                  className="flex-1"
                                  disabled={rejectBillMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedBill(pendingBill);
                                  setShowImageModal(true);
                                }}
                                className="w-full"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </div>

                          {/* Extracted Items Preview */}
                          {extractedItems.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium mb-2">Extracted Items:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {extractedItems.slice(0, 4).map((item, index) => (
                                  <div key={index} className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                                    <span>{item.productName}</span>
                                    <span>{item.quantity}x ₹{item.totalPrice}</span>
                                  </div>
                                ))}
                                {extractedItems.length > 4 && (
                                  <div className="text-xs text-gray-500 p-2">
                                    ...and {extractedItems.length - 4} more items
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bill Details Modal */}
      <AlertDialog open={showImageModal} onOpenChange={setShowImageModal}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Bill Details - {selectedBill?.bill.billNumber}</AlertDialogTitle>
          </AlertDialogHeader>
          {selectedBill && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p>{selectedBill.customer.name}</p>
                  <p className="text-xs text-gray-600">{selectedBill.customer.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Current Points</p>
                  <p className="text-lg font-bold text-blue-600">{selectedBill.customer.points}</p>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded">
                <div>
                  <p className="text-sm font-medium">Bill Number</p>
                  <p className="font-mono text-sm">{selectedBill.bill.billNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-lg font-bold">₹{selectedBill.bill.totalAmount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">OCR Confidence</p>
                  <p className="text-sm">{selectedBill.bill.ocrConfidence}%</p>
                </div>
              </div>

              {/* Extracted Items */}
              <div>
                <h3 className="font-semibold mb-3">Extracted Items</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {parseExtractedItems(selectedBill.bill.extractedItems).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white border rounded">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                      </div>
                      <p className="font-semibold">₹{item.totalPrice}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Image */}
              {selectedBill.bill.imageUrl && (
                <div>
                  <h3 className="font-semibold mb-3">Bill Image</h3>
                  <img 
                    src={selectedBill.bill.imageUrl} 
                    alt="Bill scan" 
                    className="max-w-full h-auto border rounded-lg"
                  />
                </div>
              )}

              {/* Raw OCR Text */}
              <div>
                <h3 className="font-semibold mb-3">Raw OCR Text</h3>
                <div className="p-3 bg-gray-100 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  {selectedBill.bill.extractedText || 'No OCR text available'}
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Confirmation */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Bill</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBill && (
                <div className="space-y-2">
                  <p>Approve bill for <strong>{selectedBill.customer.name}</strong>?</p>
                  <div className="bg-green-50 p-3 rounded space-y-1 text-sm">
                    <p><strong>Bill:</strong> {selectedBill.bill.billNumber}</p>
                    <p><strong>Amount:</strong> ₹{selectedBill.bill.totalAmount}</p>
                    <p><strong>Items:</strong> {parseExtractedItems(selectedBill.bill.extractedItems).length} products</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Points will be calculated and assigned automatically based on campaign rules.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmApprove}
              disabled={approveBillMutation.isPending}
            >
              {approveBillMutation.isPending ? 'Approving...' : 'Approve & Process'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Bill</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBill && (
                <div className="space-y-2">
                  <p>Reject bill submission from <strong>{selectedBill.customer.name}</strong>?</p>
                  <div className="bg-red-50 p-3 rounded space-y-1 text-sm">
                    <p><strong>Bill:</strong> {selectedBill.bill.billNumber}</p>
                    <p><strong>Amount:</strong> ₹{selectedBill.bill.totalAmount}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customer will be notified that their bill could not be verified.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReject}
              disabled={rejectBillMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectBillMutation.isPending ? 'Rejecting...' : 'Reject Bill'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
