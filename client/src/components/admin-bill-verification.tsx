import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, Eye, Clock, Calendar, User, Receipt, Camera } from 'lucide-react';

interface BillSubmission {
  id: string;
  customerId: string;
  campaignId: string;
  billNumber: string | null;
  totalAmount: number;
  imageUrl: string;
  customerNotes: string | null;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  adminNotes: string | null;
  pointsAwarded: number;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  campaign: {
    id: string;
    name: string;
    rewardPerReferral: number;
  };
}

interface VerificationAction {
  submissionId: string;
  status: 'approved' | 'rejected';
  adminNotes: string;
  pointsAwarded?: number;
}

export default function AdminBillVerification() {
  const [selectedSubmission, setSelectedSubmission] = useState<BillSubmission | null>(null);
  const [verificationAction, setVerificationAction] = useState<VerificationAction | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending bill submissions
  const { data: pendingSubmissions, isLoading } = useQuery({
    queryKey: ['/api/bills/submissions/pending'],
    queryFn: async (): Promise<BillSubmission[]> => {
      const response = await fetch('/api/bills/submissions/pending');
      if (!response.ok) throw new Error('Failed to fetch pending submissions');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Verify bill submission mutation
  const verifySubmissionMutation = useMutation({
    mutationFn: async (action: VerificationAction) => {
      const response = await fetch(`/api/bills/submissions/${action.submissionId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action.status,
          adminNotes: action.adminNotes,
          pointsAwarded: action.pointsAwarded,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify submission');
      }
      
      return response.json();
    },
    onSuccess: (result, action) => {
      toast({
        title: action.status === 'approved' ? 'Bill Approved! ✓' : 'Bill Rejected',
        description: action.status === 'approved' 
          ? `Customer awarded ${action.pointsAwarded || 0} points`
          : 'Customer has been notified of the rejection',
      });
      
      // Reset state
      setSelectedSubmission(null);
      setVerificationAction(null);
      setAdminNotes('');
      setShowConfirmDialog(false);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/bills/submissions/pending'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleVerification = (submission: BillSubmission, status: 'approved' | 'rejected') => {
    const pointsAwarded = status === 'approved' ? submission.campaign.rewardPerReferral : 0;
    
    setVerificationAction({
      submissionId: submission.id,
      status,
      adminNotes,
      pointsAwarded,
    });
    setShowConfirmDialog(true);
  };

  const confirmVerification = () => {
    if (verificationAction) {
      verifySubmissionMutation.mutate(verificationAction);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading pending submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-bill-verification">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bill Verification</h2>
          <p className="text-muted-foreground">Review and approve customer bill submissions</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {pendingSubmissions?.length || 0} Pending
        </Badge>
      </div>

      {!pendingSubmissions || pendingSubmissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Pending Submissions</h3>
            <p className="text-muted-foreground">All bill submissions have been processed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submissions List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pending Submissions</h3>
            {pendingSubmissions.map((submission) => (
              <Card 
                key={submission.id} 
                className={`cursor-pointer transition-colors ${
                  selectedSubmission?.id === submission.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedSubmission(submission)}
                data-testid={`submission-card-${submission.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{submission.customer.name}</h4>
                      <p className="text-sm text-muted-foreground">{submission.customer.phoneNumber}</p>
                    </div>
                    <Badge variant="outline">
                      ₹{submission.totalAmount}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      <span>Campaign: {submission.campaign.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Submitted: {formatDate(submission.createdAt)}</span>
                    </div>
                    {submission.billNumber && (
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        <span>Bill #: {submission.billNumber}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submission Details */}
          <div className="space-y-4">
            {selectedSubmission ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Submission Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Customer</label>
                        <p>{selectedSubmission.customer.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <p>{selectedSubmission.customer.phoneNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Campaign</label>
                        <p>{selectedSubmission.campaign.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Total Amount</label>
                        <p className="font-semibold">₹{selectedSubmission.totalAmount}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Potential Points</label>
                        <p className="font-semibold text-green-600">
                          {selectedSubmission.campaign.rewardPerReferral} points
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Submitted</label>
                        <p>{formatDate(selectedSubmission.createdAt)}</p>
                      </div>
                    </div>

                    {selectedSubmission.billNumber && (
                      <div>
                        <label className="text-sm font-medium">Bill Number</label>
                        <p>{selectedSubmission.billNumber}</p>
                      </div>
                    )}

                    {selectedSubmission.customerNotes && (
                      <div>
                        <label className="text-sm font-medium">Customer Notes</label>
                        <p className="text-sm bg-muted p-2 rounded">{selectedSubmission.customerNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bill Image */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Bill Photo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={selectedSubmission.imageUrl}
                      alt="Bill"
                      className="w-full max-w-md mx-auto rounded-lg border"
                      data-testid="bill-image"
                    />
                  </CardContent>
                </Card>

                {/* Admin Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Add notes about this verification..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      data-testid="textarea-admin-notes"
                    />
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVerification(selectedSubmission, 'approved')}
                    className="flex-1"
                    disabled={verifySubmissionMutation.isPending}
                    data-testid="button-approve"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Award Points
                  </Button>
                  <Button
                    onClick={() => handleVerification(selectedSubmission, 'rejected')}
                    variant="destructive"
                    className="flex-1"
                    disabled={verifySubmissionMutation.isPending}
                    data-testid="button-reject"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a Submission</h3>
                  <p className="text-muted-foreground">Click on a submission to review details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent data-testid="dialog-confirm-verification">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {verificationAction?.status === 'approved' ? 'Approve Bill' : 'Reject Bill'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to{' '}
                <strong>{verificationAction?.status === 'approved' ? 'approve' : 'reject'}</strong>{' '}
                the bill submission from <strong>{selectedSubmission?.customer.name}</strong>.
              </p>
              
              {verificationAction?.status === 'approved' && (
                <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                  <p className="text-green-800">
                    <strong>Points to award:</strong> {verificationAction.pointsAwarded} points
                  </p>
                  <p className="text-green-700 text-sm">
                    The customer will be notified and points will be added to their account.
                  </p>
                </div>
              )}
              
              {verificationAction?.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                  <p className="text-red-800">
                    The customer will be notified that their bill was rejected.
                  </p>
                </div>
              )}
              
              {adminNotes && (
                <div className="mt-3">
                  <p className="text-sm font-medium">Admin Notes:</p>
                  <p className="text-sm bg-muted p-2 rounded mt-1">{adminNotes}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-verification">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmVerification}
              data-testid="button-confirm-verification"
            >
              {verificationAction?.status === 'approved' ? 'Approve & Award Points' : 'Reject Bill'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}