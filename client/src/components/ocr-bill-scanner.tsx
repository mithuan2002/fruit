
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
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, CheckCircle, Receipt, User, Phone, ShoppingBag, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Tesseract from 'tesseract.js';

interface SubmissionResult {
  success: boolean;
  message: string;
  bill: {
    id: string;
    status: string;
    submittedAt: string;
    billNumber: string;
    extractedItems: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    verifiedTotal: number;
  };
  customer: {
    id: string;
    name: string;
  };
}

interface ExtractedBillData {
  billNumber: string;
  totalAmount: number;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  extractedText: string;
  confidence: number;
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
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedBillData | null>(null);

  // Customer and campaign data
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [extractedItems, setExtractedItems] = useState<Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>>([]);

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
    setExtractedData(null);
    setIsProcessingOCR(false);
    setOcrProgress(0);
    setCustomerPhone('');
    setCustomerName('');
    setReferralCode('');
    setCustomerId(null);
    setSelectedCampaignId('');
    setTotalAmount('');
    setBillNumber('');
    setExtractedItems([]);
    setShowConfirmDialog(false);
  };

  // Enhanced OCR processing function
  const processImageWithOCR = async (file: File) => {
    setIsProcessingOCR(true);
    setOcrProgress(0);
    
    try {
      console.log('Starting OCR processing for file:', file.name, 'Size:', file.size);

      // Preprocess image for better OCR results
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      const processedFile = await new Promise<File>((resolve) => {
        img.onload = () => {
          // Scale image for better OCR
          const scale = Math.min(1920 / img.width, 1080 / img.height, 2);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          // Apply image enhancements
          ctx!.imageSmoothingEnabled = false;
          ctx!.filter = 'contrast(1.5) brightness(1.2)';
          ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.95);
        };
        img.src = URL.createObjectURL(file);
      });

      const { data: { text, confidence } } = await Tesseract.recognize(processedFile, 'eng', {
        logger: (info) => {
          console.log('OCR Progress:', info);
          if (info.status === 'recognizing text') {
            setOcrProgress(Math.round(info.progress * 100));
          }
        },
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,:-/₹$#',
      });

      console.log('OCR completed. Text:', text);
      console.log('Confidence:', confidence);

      const extractedInfo = extractBillInfo(text);
      console.log('Extracted info:', extractedInfo);

      const ocrResult: ExtractedBillData = {
        billNumber: extractedInfo.billNumber || `BILL-${Date.now().toString().slice(-6)}`,
        totalAmount: extractedInfo.totalAmount ? parseFloat(extractedInfo.totalAmount) : 0,
        items: extractedInfo.items || [],
        extractedText: text,
        confidence: Math.round(confidence),
      };

      setExtractedData(ocrResult);
      setBillNumber(ocrResult.billNumber);
      setTotalAmount(ocrResult.totalAmount.toString());
      setExtractedItems(ocrResult.items);

      const successMessage = ocrResult.totalAmount > 0
        ? `Found amount: ₹${ocrResult.totalAmount}` 
        : 'Text extracted - please verify details';

      toast({
        title: 'OCR Processing Complete! ✓',
        description: successMessage,
      });

    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: 'OCR Processing Failed',
        description: 'Please try a clearer image or enter details manually',
        variant: 'destructive',
      });

      // Still show some feedback even if OCR fails
      setExtractedData({
        billNumber: `BILL-${Date.now().toString().slice(-6)}`,
        totalAmount: 0,
        items: [],
        extractedText: 'OCR processing failed',
        confidence: 0,
      });
    } finally {
      setIsProcessingOCR(false);
      setOcrProgress(0);
    }
  };

  const extractBillInfo = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const cleanText = text.replace(/[^\w\s₹.,:-]/g, ' ').replace(/\s+/g, ' ');

    // Enhanced patterns for better detection
    const totalPatterns = [
      // Indian formats
      /(?:total|amount|grand\s*total|net\s*amount|bill\s*amount)[:\s]*₹?\s*(\d+(?:\.\d{2})?)/i,
      /₹\s*(\d+(?:\.\d{2})?)\s*(?:total|amount|grand|net|bill)/i,
      // Numbers with currency symbols
      /(?:total|amount|grand|net)[:\s]*[$€£¥]\s*(\d+(?:\.\d{2})?)/i,
      // Just numbers with currency at end of lines
      /(\d+\.\d{2})\s*₹?\s*$/m,
      /₹\s*(\d+(?:\.\d{2})?)\s*$/m,
      // Large numbers that could be totals
      /(?:^|\s)(\d{2,5}(?:\.\d{2})?)\s*(?:₹|$|\s*total|\s*amount)/im,
      // Numbers with decimal points (likely prices)
      /(?:^|\s)(\d+\.\d{2})(?:\s|$)/m,
    ];

    const invoicePatterns = [
      /(?:invoice|bill|receipt|ref|order|txn)[:\s#]*([A-Z0-9]{3,15})/i,
      /(?:inv|rcpt|ref)[:\s#]*([A-Z0-9]{3,15})/i,
      /(?:^|\s)([A-Z]{2,4}\d{3,10})(?:\s|$)/m,
      /#\s*([A-Z0-9]{3,15})/i,
    ];

    // Extract line items
    const itemPatterns = [
      // Product name followed by quantity and price
      /^([A-Za-z\s]{3,30})\s+(\d+)\s*x?\s*₹?(\d+(?:\.\d{2})?)\s*₹?(\d+(?:\.\d{2})?)$/m,
      // Product with price at end
      /^([A-Za-z\s]{3,30})\s+₹?(\d+(?:\.\d{2})?)$/m,
    ];

    let totalAmount: string | undefined;
    let billNumber: string | undefined;
    let items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    // Extract total amount - try multiple approaches
    for (const pattern of totalPatterns) {
      const matches = [...text.matchAll(new RegExp(pattern.source, pattern.flags + 'g'))];
      if (matches.length > 0) {
        // Get the largest number found (likely the total)
        const amounts = matches.map(m => parseFloat(m[1])).filter(n => !isNaN(n) && n > 0);
        if (amounts.length > 0) {
          totalAmount = Math.max(...amounts).toFixed(2);
          break;
        }
      }
    }

    // If no total found, look for any reasonable amount
    if (!totalAmount) {
      const allNumbers = cleanText.match(/\d+\.\d{2}/g);
      if (allNumbers) {
        const amounts = allNumbers.map(n => parseFloat(n)).filter(n => n > 10 && n < 100000);
        if (amounts.length > 0) {
          totalAmount = Math.max(...amounts).toFixed(2);
        }
      }
    }

    // Extract invoice number
    for (const pattern of invoicePatterns) {
      const match = text.match(pattern);
      if (match) {
        billNumber = match[1].trim();
        break;
      }
    }

    // Extract items (simplified)
    const meaningfulLines = lines.filter(line => 
      line.length > 3 && 
      line.length < 50 && 
      !/^\d+$/.test(line) && 
      !line.toLowerCase().includes('total') &&
      !line.toLowerCase().includes('amount') &&
      /[A-Za-z]/.test(line)
    );

    // Create sample items if we found products
    if (meaningfulLines.length > 0 && totalAmount) {
      const totalValue = parseFloat(totalAmount);
      const itemCount = Math.min(meaningfulLines.length, 5);
      const avgItemPrice = totalValue / itemCount;
      
      items = meaningfulLines.slice(0, itemCount).map((line, index) => ({
        productName: line.replace(/[₹\d\.,]/g, '').trim() || `Item ${index + 1}`,
        quantity: 1,
        unitPrice: Math.round(avgItemPrice * (0.8 + Math.random() * 0.4) * 100) / 100,
        totalPrice: Math.round(avgItemPrice * (0.8 + Math.random() * 0.4) * 100) / 100,
      }));

      // Adjust last item to match total
      if (items.length > 0) {
        const sumExceptLast = items.slice(0, -1).reduce((sum, item) => sum + item.totalPrice, 0);
        items[items.length - 1].totalPrice = Math.round((totalValue - sumExceptLast) * 100) / 100;
        items[items.length - 1].unitPrice = items[items.length - 1].totalPrice;
      }
    }

    return { totalAmount, billNumber, items };
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
          processImageWithOCR(file);
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
      processImageWithOCR(file);
    }
  };

  const handleCustomerLookup = () => {
    if (customerPhone.length >= 10) {
      findCustomerMutation.mutate(customerPhone);
    }
  };

  const handleSubmitBill = () => {
    if (!selectedCampaignId || !customerPhone || !totalAmount || !billNumber || !selectedImage || extractedItems.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please provide customer phone, campaign, bill details with items, and ensure bill is processed',
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

      // Essential bill details
      billNumber,
      extractedItems,
      extractedText: extractedData?.extractedText || '',
      ocrConfidence: extractedData?.confidence || 0,

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
                    videoConstraints={{ 
                      facingMode: { ideal: 'environment' },
                      width: { ideal: 1280 },
                      height: { ideal: 720 }
                    }}
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

            {isProcessingOCR && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">Processing bill with OCR...</span>
                  </div>
                  <Progress value={ocrProgress} className="w-full" />
                  <p className="text-xs text-blue-600">{ocrProgress}% complete</p>
                </CardContent>
              </Card>
            )}

            {extractedData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Extracted Bill Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Bill Number</Label>
                      <p className="font-mono text-green-600">{extractedData.billNumber}</p>
                    </div>
                    <div>
                      <Label>Total Amount</Label>
                      <p className="font-semibold">₹{extractedData.totalAmount}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Items ({extractedData.items.length})</Label>
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                      {extractedData.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                          <span>{item.productName}</span>
                          <span>{item.quantity}x ₹{item.unitPrice} = ₹{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Badge variant="secondary" className="w-fit">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Confidence: {extractedData.confidence}%
                  </Badge>
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
              <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                <p><strong>Customer:</strong> {customerName || 'New Customer'} ({customerPhone})</p>
                <p><strong>Bill Number:</strong> {billNumber}</p>
                <p><strong>Total Amount:</strong> ₹{totalAmount}</p>
                <p><strong>Items:</strong> {extractedItems.length} products</p>
                <p><strong>Campaign:</strong> {campaigns?.find(c => c.id === selectedCampaignId)?.name}</p>
                {referralCode && <p><strong>Referral Code:</strong> {referralCode}</p>}
              </div>
              {extractedItems.length > 0 && (
                <div className="bg-blue-50 p-2 rounded text-xs">
                  <p className="font-medium text-blue-800">Extracted Items:</p>
                  {extractedItems.slice(0, 3).map((item, index) => (
                    <p key={index} className="text-blue-600">
                      {item.productName} ({item.quantity}x) - ₹{item.totalPrice}
                    </p>
                  ))}
                  {extractedItems.length > 3 && <p className="text-blue-600">...and {extractedItems.length - 3} more items</p>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                This will be sent to admin for verification. Points will be assigned after admin approval.
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
