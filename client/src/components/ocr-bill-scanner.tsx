import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Camera, Upload, CheckCircle, Receipt, User, Phone, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface SubmissionResult {
  success: boolean;
  message: string;
  bill: {
    id: string;
    status: string;
    submittedAt: string;
  };
  customer: {
    id: string;
    name: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  pointCalculationType: string;
  rewardPerReferral: number;
  percentageRate?: string;
}

export interface BillScannerProps {
  onBillSubmitted?: (result: SubmissionResult) => void;
}

export default function BillScanner({ onBillSubmitted }: BillScannerProps) {
  const [cameraMode, setCameraMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Customer and campaign data
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState('');

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns/active'],
    queryFn: async (): Promise<Campaign[]> => {
      const response = await fetch('/api/campaigns/active');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
  });

  // Find customer by phone
  const findCustomerMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await fetch(`/api/customers/phone/${phoneNumber}`);
      if (!response.ok) {
        throw new Error('Customer not found');
      }
      return response.json();
    },
    onSuccess: (customer) => {
      setCustomerId(customer.id);
      setCustomerName(customer.name);
      toast({
        title: 'Customer Found',
        description: `Welcome back, ${customer.name}!`,
      });
    },
    onError: () => {
      setCustomerId(null);
      toast({
        title: 'Customer Not Found',
        description: 'New customer will be created after approval',
        variant: 'destructive',
      });
    },
  });

  // Submit bill for admin approval
  const submitBillMutation = useMutation({
    mutationFn: async (billData: any) => {
      const response = await fetch('/api/bills/submit-for-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit bill for approval');
      }

      return response.json();
    },
    onSuccess: (result: SubmissionResult) => {
      toast({
        title: 'Bill Submitted for Approval!',
        description: 'Cashier will review and approve your bill. Points will be assigned automatically after approval.',
      });

      resetForm();
      onBillSubmitted?.(result);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-bills'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setCameraMode(false);
    setSelectedImage(null);
    setImagePreview(null);
    setCustomerPhone('');
    setCustomerName('');
    setReferralCode('');
    setCustomerId(null);
    setSelectedCampaignId('');
    setTotalAmount('');
    setShowConfirmDialog(false);
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImagePreview(imageSrc);
      setCameraMode(false);

      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          setSelectedImage(file);
        });
    }
  }, [webcamRef]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomerLookup = () => {
    if (customerPhone.length >= 10) {
      findCustomerMutation.mutate(customerPhone);
    }
  };

  const handleSubmitBill = () => {
    if (!selectedCampaignId || !customerPhone || !totalAmount || !selectedImage) {
      toast({
        title: 'Missing Information',
        description: 'Please provide customer phone, campaign, total amount, and bill photo',
        variant: 'destructive',
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmSubmitBill = () => {
    const selectedCampaign = campaigns?.find(c => c.id === selectedCampaignId);
    
    const billData = {
      customerPhone,
      customerName: customerName || undefined,
      customerId: customerId || undefined,
      referralCode: referralCode || undefined,

      // Campaign and bill details
      campaignId: selectedCampaignId,
      campaignName: selectedCampaign?.name,
      totalAmount: parseFloat(totalAmount),

      // Image data
      imageData: imagePreview || undefined,
    };

    submitBillMutation.mutate(billData);
    setShowConfirmDialog(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Bill Submission for Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Capture Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Bill Photo</h3>
            <div className="flex gap-4">
              <Button
                onClick={() => setCameraMode(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Use Camera
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {cameraMode && (
              <Card>
                <CardContent className="p-4">
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full max-w-md mx-auto rounded-lg"
                  />
                  <div className="flex gap-2 mt-4 justify-center">
                    <Button onClick={capture}>
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                    <Button variant="outline" onClick={() => setCameraMode(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {imagePreview && (
              <Card>
                <CardContent className="p-4">
                  <img 
                    src={imagePreview} 
                    alt="Bill preview" 
                    className="max-w-md mx-auto rounded-lg"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Campaign Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Campaign Selection
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign">Select Campaign *</Label>
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a campaign/product cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignsLoading && <SelectItem value="loading" disabled>Loading campaigns...</SelectItem>}
                    {campaigns?.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                    {campaigns?.length === 0 && <SelectItem value="none" disabled>No active campaigns</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Bill Amount *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  placeholder="Enter total amount"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>
            </div>

            {selectedCampaignId && campaigns && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected Campaign:</strong> {campaigns.find(c => c.id === selectedCampaignId)?.description}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Customer Phone *</Label>
                <div className="flex gap-2">
                  <Input
                    id="customerPhone"
                    placeholder="Enter phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <Button
                    onClick={handleCustomerLookup}
                    disabled={findCustomerMutation.isPending || customerPhone.length < 10}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Auto-filled or enter manually"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <Input
                id="referralCode"
                placeholder="Enter referral code if applicable"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              />
            </div>

            {customerId && (
              <Badge variant="secondary" className="w-fit">
                <CheckCircle className="h-3 w-3 mr-1" />
                Existing Customer Found
              </Badge>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleSubmitBill}
              disabled={!selectedCampaignId || !customerPhone || !totalAmount || !selectedImage || submitBillMutation.isPending}
              className="flex items-center gap-2"
            >
              <Receipt className="h-4 w-4" />
              Submit for Cashier Approval
            </Button>

            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Bill for Cashier Approval</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please verify the bill details before submitting:</p>
              <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                <p><strong>Customer:</strong> {customerName || 'New Customer'} ({customerPhone})</p>
                <p><strong>Total Amount:</strong> ₹{totalAmount}</p>
                <p><strong>Campaign:</strong> {campaigns?.find(c => c.id === selectedCampaignId)?.name}</p>
                {referralCode && <p><strong>Referral Code:</strong> {referralCode}</p>}
              </div>
              <p className="text-xs text-muted-foreground">
                This will be sent to cashier for approval. Points will be automatically assigned after approval based on the campaign rules.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSubmitBill}
              disabled={submitBillMutation.isPending}
            >
              {submitBillMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}