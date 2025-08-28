import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Camera, Upload, FileText, CheckCircle, AlertCircle, Receipt, Gift, Scan, User, Phone, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ExtractedBillData {
  invoiceNumber?: string;
  storeName?: string;
  totalAmount?: string;
  billDate?: string;
  extractedText: string;
  confidence: number;
}

interface ProcessedBillResult {
  success: boolean;
  bill: {
    id: string;
    invoiceNumber: string;
    storeName: string;
    totalAmount: string;
    pointsEarned: number;
    processedAt: string;
  };
  customer: {
    id: string;
    name: string;
    newPointsBalance: number;
  };
  referrer?: {
    id: string;
    name: string;
    bonusPointsEarned: number;
  };
}

export interface OCRBillScannerProps {
  onBillProcessed?: (result: ProcessedBillResult) => void;
}

export default function OCRBillScanner({ onBillProcessed }: OCRBillScannerProps) {
  const [cameraMode, setCameraMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedBillData | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Customer and referral data
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  // Manual override fields
  const [manualData, setManualData] = useState({
    totalAmount: '',
    invoiceNumber: '',
    storeName: '',
  });

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        description: 'Customer will be registered after bill processing',
        variant: 'destructive',
      });
    },
  });

  // Process bill and assign points
  const processBillMutation = useMutation({
    mutationFn: async (billData: any) => {
      const response = await fetch('/api/bills/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process bill');
      }
      
      return response.json();
    },
    onSuccess: (result: ProcessedBillResult) => {
      toast({
        title: 'Bill Processed Successfully!',
        description: `${result.customer.name} earned ${result.bill.pointsEarned} points`,
      });
      
      // Reset form
      resetForm();
      
      // Call callback if provided
      onBillProcessed?.(result);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Processing Failed',
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
    setCustomerPhone('');
    setCustomerName('');
    setReferralCode('');
    setCustomerId(null);
    setManualData({ totalAmount: '', invoiceNumber: '', storeName: '' });
    setShowConfirmDialog(false);
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImagePreview(imageSrc);
      setCameraMode(false);
      
      // Convert base64 to File
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          setSelectedImage(file);
          processImage(file);
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
      processImage(file);
    }
  };

  const processImage = async (file: File) => {
    setIsProcessingOCR(true);
    setOcrProgress(0);

    try {
      const { data: { text, confidence } } = await Tesseract.recognize(file, 'eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            setOcrProgress(Math.round(info.progress * 100));
          }
        },
      });

      // Extract bill information using regex patterns
      const extractedInfo = extractBillInfo(text);
      
      setExtractedData({
        ...extractedInfo,
        extractedText: text,
        confidence: Math.round(confidence),
      });

      // Populate manual fields with extracted data
      setManualData({
        totalAmount: extractedInfo.totalAmount || '',
        invoiceNumber: extractedInfo.invoiceNumber || '',
        storeName: extractedInfo.storeName || '',
      });

      toast({
        title: 'OCR Processing Complete',
        description: `Text extracted with ${Math.round(confidence)}% confidence`,
      });

    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: 'OCR Failed',
        description: 'Please try again or enter data manually',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingOCR(false);
      setOcrProgress(0);
    }
  };

  const extractBillInfo = (text: string): Partial<ExtractedBillData> => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Patterns for common bill information
    const totalPatterns = [
      /total[:\s]*[₹$€£¥]*\s*(\d+\.?\d*)/i,
      /amount[:\s]*[₹$€£¥]*\s*(\d+\.?\d*)/i,
      /grand\s*total[:\s]*[₹$€£¥]*\s*(\d+\.?\d*)/i,
      /(\d+\.\d{2})\s*$/, // Number at end of line with 2 decimal places
    ];
    
    const invoicePatterns = [
      /invoice[:\s#]*(\w+\d+)/i,
      /bill[:\s#]*(\w+\d+)/i,
      /receipt[:\s#]*(\w+\d+)/i,
      /ref[:\s#]*(\w+\d+)/i,
    ];
    
    const storePatterns = [
      /^([A-Z][A-Za-z\s&]+)$/m, // Capitalized words at start of line
    ];

    let totalAmount: string | undefined;
    let invoiceNumber: string | undefined;
    let storeName: string | undefined;

    // Extract total amount
    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        totalAmount = match[1];
        break;
      }
    }

    // Extract invoice number
    for (const pattern of invoicePatterns) {
      const match = text.match(pattern);
      if (match) {
        invoiceNumber = match[1];
        break;
      }
    }

    // Extract store name (usually first few capitalized lines)
    const firstLines = lines.slice(0, 5);
    for (const line of firstLines) {
      if (line.length > 3 && line.length < 50 && /^[A-Z]/.test(line)) {
        storeName = line;
        break;
      }
    }

    return { totalAmount, invoiceNumber, storeName };
  };

  const handleCustomerLookup = () => {
    if (customerPhone.length >= 10) {
      findCustomerMutation.mutate(customerPhone);
    }
  };

  const handleProcessBill = () => {
    if (!manualData.totalAmount || !customerPhone) {
      toast({
        title: 'Missing Information',
        description: 'Please provide customer phone and total amount',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmProcessBill = () => {
    const billData = {
      customerPhone: customerPhone,
      customerName: customerName || undefined,
      customerId: customerId || undefined,
      referralCode: referralCode || undefined,
      
      // Bill details
      totalAmount: manualData.totalAmount,
      invoiceNumber: manualData.invoiceNumber || undefined,
      storeName: manualData.storeName || undefined,
      
      // OCR metadata
      extractedText: extractedData?.extractedText || '',
      ocrConfidence: extractedData?.confidence || 0,
      imageData: imagePreview || undefined,
    };

    processBillMutation.mutate(billData);
    setShowConfirmDialog(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            OCR Bill Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Capture Section */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => setCameraMode(true)}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-camera"
              >
                <Camera className="h-4 w-4" />
                Use Camera
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-upload"
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
              data-testid="input-file"
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
                    <Button onClick={capture} data-testid="button-capture">
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
                    data-testid="img-preview"
                  />
                </CardContent>
              </Card>
            )}

            {isProcessingOCR && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Processing with OCR...</span>
                    </div>
                    <Progress value={ocrProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      {ocrProgress}% complete
                    </p>
                  </div>
                </CardContent>
              </Card>
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
                    data-testid="input-customer-phone"
                  />
                  <Button
                    onClick={handleCustomerLookup}
                    disabled={findCustomerMutation.isPending || customerPhone.length < 10}
                    data-testid="button-lookup-customer"
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
                  data-testid="input-customer-name"
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
                data-testid="input-referral-code"
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

          {/* Bill Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bill Information
            </h3>

            {extractedData && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">OCR Results</span>
                    <Badge variant={extractedData.confidence > 80 ? "default" : "secondary"}>
                      {extractedData.confidence}% confidence
                    </Badge>
                  </div>
                  <Textarea
                    value={extractedData.extractedText}
                    readOnly
                    className="h-20 text-xs"
                    data-testid="textarea-ocr-text"
                  />
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  placeholder="0.00"
                  value={manualData.totalAmount}
                  onChange={(e) => setManualData(prev => ({ ...prev, totalAmount: e.target.value }))}
                  data-testid="input-total-amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="INV123456"
                  value={manualData.invoiceNumber}
                  onChange={(e) => setManualData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  data-testid="input-invoice-number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  placeholder="Store Name"
                  value={manualData.storeName}
                  onChange={(e) => setManualData(prev => ({ ...prev, storeName: e.target.value }))}
                  data-testid="input-store-name"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleProcessBill}
              disabled={!customerPhone || !manualData.totalAmount || processBillMutation.isPending}
              className="flex items-center gap-2"
              data-testid="button-process-bill"
            >
              <Gift className="h-4 w-4" />
              Process Bill & Assign Points
            </Button>

            <Button
              variant="outline"
              onClick={resetForm}
              data-testid="button-reset"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent data-testid="dialog-confirm-process">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bill Processing</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please verify the bill details before processing:</p>
              <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                <p><strong>Customer:</strong> {customerName || 'New Customer'} ({customerPhone})</p>
                <p><strong>Total Amount:</strong> ₹{manualData.totalAmount}</p>
                <p><strong>Invoice:</strong> {manualData.invoiceNumber || 'N/A'}</p>
                <p><strong>Store:</strong> {manualData.storeName || 'N/A'}</p>
                {referralCode && <p><strong>Referral Code:</strong> {referralCode}</p>}
              </div>
              <p className="text-xs text-muted-foreground">
                Points will be calculated and assigned automatically based on your reward rules.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-process">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmProcessBill}
              disabled={processBillMutation.isPending}
              data-testid="button-confirm-process"
            >
              {processBillMutation.isPending ? 'Processing...' : 'Process Bill'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}