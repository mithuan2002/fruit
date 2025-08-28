import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Camera, Upload, FileText, CheckCircle, AlertCircle, Gift, Scan, User, Phone, Receipt } from 'lucide-react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';

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
      const { data: { text, confidence } } = await Tesseract.recognize(file, 'eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            setOcrProgress(Math.round(info.progress * 100));
          }
        },
      });

      const extractedInfo = extractBillInfo(text);

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

    const totalPatterns = [
      /total[:\s]*[₹$€£¥]*\s*(\d+\.?\d*)/i,
      /amount[:\s]*[₹$€£¥]*\s*(\d+\.?\d*)/i,
      /grand\s*total[:\s]*[₹$€£¥]*\s*(\d+\.?\d*)/i,
      /(\d+\.\d{2})\s*$/,
    ];

    const invoicePatterns = [
      /invoice[:\s#]*(\w+\d+)/i,
      /bill[:\s#]*(\w+\d+)/i,
      /receipt[:\s#]*(\w+\d+)/i,
      /ref[:\s#]*(\w+\d+)/i,
    ];

    let totalAmount: string | undefined;
    let invoiceNumber: string | undefined;
    let storeName: string | undefined;

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        totalAmount = match[1];
        break;
      }
    }

    for (const pattern of invoicePatterns) {
      const match = text.match(pattern);
      if (match) {
        invoiceNumber = match[1];
        break;
      }
    }

    const firstLines = lines.slice(0, 5);
    for (const line of firstLines) {
      if (line.length > 3 && line.length < 50 && /^[A-Z]/.test(line)) {
        storeName = line;
        break;
      }
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
        // Bill Scanner Interface
        <div className="p-4">
          <div className="max-w-md mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowBillScanner(false)}>
                ← Back
              </Button>
              <div>
                <h2 className="text-xl font-bold">Scan Your Bill</h2>
                <p className="text-sm text-gray-600">Upload receipt to earn points</p>
              </div>
            </div>

            {/* Image Capture */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCameraMode(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
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
                  <div className="space-y-3">
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: 'environment' }}
                      className="w-full rounded-lg"
                    />
                    <div className="flex gap-2">
                      <Button onClick={capture} className="flex-1">
                        <Camera className="h-4 w-4 mr-2" />
                        Capture
                      </Button>
                      <Button variant="outline" onClick={() => setCameraMode(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {imagePreview && (
                  <div className="space-y-2">
                    <img src={imagePreview} alt="Bill preview" className="w-full rounded-lg" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedImage(null);
                        setExtractedData(null);
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}

                {isProcessingOCR && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Processing with OCR...</span>
                    </div>
                    <Progress value={ocrProgress} className="w-full" />
                    <p className="text-xs text-gray-500">{ocrProgress}% complete</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Extracted Data */}
            {extractedData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    OCR Results
                    <Badge variant={extractedData.confidence > 80 ? "default" : "secondary"}>
                      {extractedData.confidence}% confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    value={extractedData.extractedText}
                    readOnly
                    className="h-20 text-xs w-full p-2 border rounded-md"
                  />
                </CardContent>
              </Card>
            )}

            {/* Manual Data Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bill Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="totalAmount">Total Amount *</Label>
                  <Input
                    id="totalAmount"
                    placeholder="0.00"
                    value={manualData.totalAmount}
                    onChange={(e) => setManualData(prev => ({ ...prev, totalAmount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="INV123456"
                    value={manualData.invoiceNumber}
                    onChange={(e) => setManualData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    placeholder="Store Name"
                    value={manualData.storeName}
                    onChange={(e) => setManualData(prev => ({ ...prev, storeName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input
                    id="referralCode"
                    placeholder="Enter referral code if applicable"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Removed Process Bill Button */}
            {/* The 'Process Bill & Earn Points' button is removed to prevent customers from processing bills */}

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