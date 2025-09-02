import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, FileText, CheckCircle, AlertCircle, Gift, Scan, User, Phone, Receipt } from 'lucide-react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import OCRBillScanner from '@/components/ocr-bill-scanner';

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  points: number;
  referralCode: string;
  pointsEarned: number;
  pointsRedeemed: number;
  createdAt: string;
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

interface ExtractedBillData {
  invoiceNumber?: string;
  storeName?: string;
  totalAmount?: string;
  billDate?: string;
  extractedText: string;
  confidence: number;
}

export default function CustomerApp() {
  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('customerId');

  // UI states
  const [showBillScanner, setShowBillScanner] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedBillData | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [referralCode, setReferralCode] = useState('');

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

  // Fetch customer data
  const { data: customerData, isLoading } = useQuery({
    queryKey: [`/api/customer/dashboard/${customerId}`],
    queryFn: async (): Promise<{ customer: Customer }> => {
      const response = await fetch(`/api/customer/dashboard/${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch customer data');
      return response.json();
    },
    enabled: !!customerId,
  });

  // Process bill mutation
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
        title: 'Bill Processed Successfully! 🎉',
        description: `You earned ${result.bill.pointsEarned} points! New balance: ${result.customer.newPointsBalance} points`,
      });

      resetForm();
      queryClient.invalidateQueries({ queryKey: [`/api/customer/dashboard/${customerId}`] });
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
    setReferralCode('');
    setManualData({ totalAmount: '', invoiceNumber: '', storeName: '' });
    setShowConfirmDialog(false);
    setShowBillScanner(false);
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

      setExtractedData({
        ...extractedInfo,
        extractedText: text,
        confidence: Math.round(confidence),
      });

      setManualData({
        totalAmount: extractedInfo.totalAmount || '',
        invoiceNumber: extractedInfo.invoiceNumber || '',
        storeName: extractedInfo.storeName || '',
      });

      const successMessage = extractedInfo.totalAmount
        ? `Found amount: ₹${extractedInfo.totalAmount}`
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
        extractedText: 'OCR processing failed',
        confidence: 0,
      });
    } finally {
      setIsProcessingOCR(false);
      setOcrProgress(0);
    }
  };

  const extractBillInfo = (text: string): Partial<ExtractedBillData> => {
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

    const storePatterns = [
      // First few lines that look like store names
      /^([A-Z][A-Za-z\s&.,]{2,30})$/m,
      // Common store name patterns
      /^([A-Z\s]{3,25})$/m,
      // Names with common business suffixes
      /^([A-Za-z\s&]+(?:store|shop|mart|plaza|center|ltd|pvt))/im,
    ];

    let totalAmount: string | undefined;
    let invoiceNumber: string | undefined;
    let storeName: string | undefined;

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
        invoiceNumber = match[1].trim();
        break;
      }
    }

    // Extract store name from first few meaningful lines
    const meaningfulLines = lines.filter(line =>
      line.length > 2 &&
      line.length < 50 &&
      !/^\d+$/.test(line) &&
      !line.match(/^\d+\.\d{2}$/) &&
      !line.toLowerCase().includes('total') &&
      !line.toLowerCase().includes('amount')
    );

    for (const pattern of storePatterns) {
      for (const line of meaningfulLines.slice(0, 8)) {
        const match = line.match(pattern);
        if (match) {
          storeName = match[1].trim();
          break;
        }
      }
      if (storeName) break;
    }

    // Fallback - use first meaningful line as store name
    if (!storeName && meaningfulLines.length > 0) {
      storeName = meaningfulLines[0];
    }

    return { totalAmount, invoiceNumber, storeName };
  };

  const handleProcessBill = () => {
    if (!manualData.totalAmount) {
      toast({
        title: 'Missing Information',
        description: 'Please provide total amount',
        variant: 'destructive',
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmProcessBill = () => {
    const billData = {
      customerPhone: customerData?.customer.phoneNumber,
      customerName: customerData?.customer.name,
      customerId: customerId,
      referralCode: referralCode || undefined,

      totalAmount: manualData.totalAmount,
      invoiceNumber: manualData.invoiceNumber || undefined,
      storeName: manualData.storeName || undefined,

      extractedText: extractedData?.extractedText || '',
      ocrConfidence: extractedData?.confidence || 0,
      imageData: imagePreview || undefined,
    };

    processBillMutation.mutate(billData);
    setShowConfirmDialog(false);
  };

  if (!customerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Access Required</h1>
            <p className="text-gray-600">Please register first to access your account</p>
          </div>
          <Button onClick={() => window.location.href = '/register'} className="w-full">
            Go to Registration
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  const customer = customerData?.customer;

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Account Not Found</h1>
            <p className="text-gray-600">Please check your link or register again</p>
          </div>
        </div>
      </div>
    );
  }

  const handleBillSubmitted = (result: ProcessedBillResult) => {
    console.log('Bill submitted successfully:', result);
    setShowBillScanner(false);
    // Invalidate queries to refetch customer data and show updated points
    queryClient.invalidateQueries({ queryKey: [`/api/customer/dashboard/${customerId}`] });
    toast({
      title: 'Bill Submitted for Approval!',
      description: `You will earn ${result.bill.pointsEarned} points upon approval.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {!showBillScanner ? (
        // Main Dashboard
        <div className="p-4">
          <div className="max-w-md mx-auto space-y-6">
            {/* Welcome Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {customer.name}!</h1>
              <p className="text-gray-600">Your Fruitbox Rewards Account</p>
            </div>

            {/* Points Card */}
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="h-6 w-6" />
                    <span className="text-lg font-semibold">Your Points</span>
                  </div>
                  <div className="text-4xl font-bold">{customer.points}</div>
                  <p className="text-blue-100">Available to redeem</p>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-medium">{customer.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Referral Code</span>
                  <Badge variant="secondary">{customer.referralCode}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Earned</span>
                  <span className="font-medium">{customer.pointsEarned} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Redeemed</span>
                  <span className="font-medium">{customer.pointsRedeemed} pts</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => setShowBillScanner(true)}
                className="w-full h-12 text-lg"
                data-testid="button-scan-bill"
              >
                <Scan className="h-5 w-5 mr-2" />
                Scan Bill to Earn Points
              </Button>

              <Button variant="outline" className="w-full">
                <Receipt className="h-4 w-4 mr-2" />
                View Bill History
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Bill Scanner Interface - Use the full OCR Bill Scanner
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setShowBillScanner(false)}>
                ← Back to Dashboard
              </Button>
              <div>
                <h2 className="text-xl font-bold">Submit Your Bill</h2>
                <p className="text-sm text-gray-600">Upload receipt for cashier approval to earn points</p>
              </div>
            </div>

            {/* OCR Bill Scanner Component */}
            <OCRBillScanner customerId={customerId} onBillSubmitted={handleBillSubmitted} />
          </div>
        </div>
      )}

      {/* Confirmation Dialog - kept for potential future use or review */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bill Processing</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please verify the bill details:</p>
              <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
                <p><strong>Total Amount:</strong> ₹{manualData.totalAmount}</p>
                <p><strong>Invoice:</strong> {manualData.invoiceNumber || 'N/A'}</p>
                <p><strong>Store:</strong> {manualData.storeName || 'N/A'}</p>
                {referralCode && <p><strong>Referral Code:</strong> {referralCode}</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmProcessBill} disabled={processBillMutation.isPending}>
              {processBillMutation.isPending ? 'Processing...' : 'Confirm & Earn Points'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}