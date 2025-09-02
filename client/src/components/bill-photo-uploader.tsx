import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Camera, Upload, CheckCircle, Receipt, User, Phone, ShoppingBag, FileText, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';

interface SubmissionResult {
  success: boolean;
  message: string;
  billSubmission: {
    id: string;
    verificationStatus: string;
    submittedAt: string;
    billNumber: string;
    totalAmount: number;
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

export interface BillPhotoUploaderProps {
  onBillSubmitted?: (result: SubmissionResult) => void;
}

export default function BillPhotoUploader({ onBillSubmitted }: BillPhotoUploaderProps) {
  const [cameraMode, setCameraMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer and campaign data
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns/active'],
    queryFn: async (): Promise<Campaign[]> => {
      const response = await fetch('/api/campaigns/active', { 
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
    staleTime: 0,
    cacheTime: 0,
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
      setCustomerName('');
      toast({
        title: 'Customer Not Found',
        description: 'Please register this customer first',
        variant: 'destructive',
      });
    }
  });

  // Submit bill for verification
  const submitBillMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/bills/submit', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit bill');
      }
      
      return response.json();
    },
    onSuccess: (result: SubmissionResult) => {
      toast({
        title: 'Bill Submitted Successfully! ✓',
        description: 'Your bill has been sent for admin verification.',
      });
      
      // Reset form
      resetForm();
      
      // Call the callback if provided
      if (onBillSubmitted) {
        onBillSubmitted(result);
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCustomerPhone('');
    setCustomerName('');
    setCustomerId(null);
    setSelectedCampaignId('');
    setTotalAmount('');
    setBillNumber('');
    setCustomerNotes('');
    setCameraMode(false);
    setShowConfirmDialog(false);
  };

  const handlePhoneSearch = () => {
    if (customerPhone.trim()) {
      findCustomerMutation.mutate(customerPhone.trim());
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setCameraMode(false);
    }
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      // Convert base64 to file
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `bill-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedImage(file);
          setImagePreview(imageSrc);
          setCameraMode(false);
        });
    }
  }, [webcamRef]);

  const handleSubmit = () => {
    if (!selectedImage || !customerId || !selectedCampaignId || !totalAmount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields and upload a bill photo.',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSubmission = async () => {
    if (!selectedImage || !customerId || !selectedCampaignId) return;

    setIsSubmitting(true);
    setShowConfirmDialog(false);

    try {
      const formData = new FormData();
      formData.append('billPhoto', selectedImage);
      formData.append('customerId', customerId);
      formData.append('campaignId', selectedCampaignId);
      formData.append('totalAmount', totalAmount);
      formData.append('billNumber', billNumber);
      formData.append('customerNotes', customerNotes);

      await submitBillMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="bill-photo-uploader">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Submit Bill for Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <Label className="text-sm font-medium">Customer Information</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="customerPhone"
                    data-testid="input-customer-phone"
                    placeholder="Enter phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={findCustomerMutation.isPending}
                  />
                  <Button 
                    onClick={handlePhoneSearch}
                    disabled={!customerPhone || findCustomerMutation.isPending}
                    data-testid="button-search-customer"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={customerName}
                  readOnly
                  placeholder="Search by phone first"
                  data-testid="text-customer-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center h-10">
                  {customerId ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Customer Found</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No customer selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Campaign Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <Label className="text-sm font-medium">Campaign Selection</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="campaign">Select Campaign</Label>
              <Select 
                value={selectedCampaignId} 
                onValueChange={setSelectedCampaignId}
                disabled={campaignsLoading}
              >
                <SelectTrigger data-testid="select-campaign">
                  <SelectValue placeholder={campaignsLoading ? "Loading campaigns..." : "Choose a campaign"} />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.map((campaign) => (
                    <SelectItem 
                      key={campaign.id} 
                      value={campaign.id}
                      data-testid={`campaign-option-${campaign.id}`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{campaign.name}</span>
                        <span className="text-xs text-muted-foreground">{campaign.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Bill Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <Label className="text-sm font-medium">Bill Details</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  data-testid="input-total-amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter total amount"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="billNumber">Bill Number (Optional)</Label>
                <Input
                  id="billNumber"
                  data-testid="input-bill-number"
                  placeholder="Enter bill number"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerNotes">Additional Notes (Optional)</Label>
              <Textarea
                id="customerNotes"
                data-testid="textarea-customer-notes"
                placeholder="Any additional information about this bill..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Photo Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <Label className="text-sm font-medium">Bill Photo</Label>
            </div>

            {!imagePreview ? (
              <div className="space-y-4">
                {!cameraMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => setCameraMode(true)}
                      variant="outline"
                      className="h-32 flex flex-col items-center justify-center gap-2"
                      data-testid="button-open-camera"
                    >
                      <Camera className="h-8 w-8" />
                      <span>Take Photo</span>
                    </Button>
                    
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="h-32 flex flex-col items-center justify-center gap-2"
                      data-testid="button-upload-file"
                    >
                      <Upload className="h-8 w-8" />
                      <span>Upload Photo</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        className="w-full max-w-md mx-auto rounded-lg"
                        data-testid="webcam-preview"
                      />
                    </div>
                    
                    <div className="flex gap-2 justify-center">
                      <Button onClick={capturePhoto} data-testid="button-capture-photo">
                        <Camera className="h-4 w-4 mr-2" />
                        Capture
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setCameraMode(false)}
                        data-testid="button-cancel-camera"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Bill preview"
                    className="w-full max-w-md mx-auto rounded-lg border"
                    data-testid="img-bill-preview"
                  />
                </div>
                
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImagePreview(null);
                      setSelectedImage(null);
                    }}
                    data-testid="button-retake-photo"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Retake Photo
                  </Button>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
              data-testid="input-file"
            />
          </div>

          <Separator />

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!selectedImage || !customerId || !selectedCampaignId || !totalAmount || isSubmitting}
              className="w-full md:w-auto"
              data-testid="button-submit-bill"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent data-testid="dialog-confirm-submission">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bill Submission</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please review your submission details:</p>
              <div className="space-y-1 text-left">
                <p><strong>Customer:</strong> {customerName}</p>
                <p><strong>Campaign:</strong> {campaigns?.find(c => c.id === selectedCampaignId)?.name}</p>
                <p><strong>Total Amount:</strong> ₹{totalAmount}</p>
                {billNumber && <p><strong>Bill Number:</strong> {billNumber}</p>}
                {customerNotes && <p><strong>Notes:</strong> {customerNotes}</p>}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Your bill will be sent to the admin for verification. You'll receive points once approved.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submission">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmission} data-testid="button-confirm-submission">
              Submit Bill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}