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
import { Camera, Upload, FileText, CheckCircle, Receipt, User, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ExtractedBillData {
  products: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
  totalAmount: string;
  billNumber?: string;
  extractedText: string;
  confidence: number;
}

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

export interface OCRBillScannerProps {
  onBillSubmitted?: (result: SubmissionResult) => void;
}

export default function OCRBillScanner({ onBillSubmitted }: OCRBillScannerProps) {
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
        description: 'Admin will review and approve your bill. Points will be assigned automatically after approval.',
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
    setCustomerPhone('');
    setCustomerName('');
    setReferralCode('');
    setCustomerId(null);
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
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,:-/₹$#×',
      });

      console.log('OCR Raw Text:', text);

      const extractedInfo = extractBillInfo(text);
      console.log('Extracted Info:', extractedInfo);

      setExtractedData({
        ...extractedInfo,
        extractedText: text,
        confidence: Math.round(confidence),
      });

      toast({
        title: 'OCR Processing Complete',
        description: `Found ${extractedInfo.products.length} products and total: ₹${extractedData?.totalAmount}`,
      });

    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: 'OCR Processing Failed',
        description: 'Please try a clearer image',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingOCR(false);
      setOcrProgress(0);
    }
  };

  const extractBillInfo = (text: string): Omit<ExtractedBillData, 'extractedText' | 'confidence'> => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    // Extract total amount
    const totalPatterns = [
      /(?:total|amount|grand\s*total|net\s*amount)[:\s]*₹?\s*(\d+(?:\.\d{2})?)/i,
      /₹\s*(\d+(?:\.\d{2})?)\s*(?:total|amount|grand|net)/i,
      /(\d+\.\d{2})\s*₹?\s*$/m,
    ];

    let totalAmount = '';
    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        totalAmount = parseFloat(match[1]).toFixed(2);
        break;
      }
    }

    // Extract bill number
    const billPatterns = [
      /(?:bill|invoice|receipt|ref)[:\s#]*([A-Z0-9]{3,15})/i,
      /(?:^|\s)([A-Z]{2,4}\d{3,10})(?:\s|$)/m,
      /#\s*([A-Z0-9]{3,15})/i,
    ];

    let billNumber = '';
    for (const pattern of billPatterns) {
      const match = text.match(pattern);
      if (match) {
        billNumber = match[1].trim();
        break;
      }
    }

    // Extract products with quantities
    const products: Array<{ name: string; quantity: number; price?: number }> = [];

    for (const line of lines) {
      // Look for lines with product patterns
      const productPatterns = [
        // Pattern: Quantity x Product Name Price
        /^(\d+)\s*×?\s*([A-Za-z\s]+?)\s+₹?(\d+(?:\.\d{2})?)/,
        // Pattern: Product Name Quantity Price
        /^([A-Za-z\s]+?)\s+(\d+)\s+₹?(\d+(?:\.\d{2})?)/,
        // Pattern: Product Name Price (assume qty 1)
        /^([A-Za-z\s]{3,30})\s+₹?(\d+(?:\.\d{2})?)$/,
      ];

      for (const pattern of productPatterns) {
        const match = line.match(pattern);
        if (match) {
          if (pattern.source.includes('×')) {
            // Quantity x Product format
            const quantity = parseInt(match[1]);
            const name = match[2].trim();
            const price = parseFloat(match[3]);
            if (name.length > 2 && quantity > 0) {
              products.push({ name, quantity, price });
            }
          } else if (match.length === 4) {
            // Product Quantity Price format
            const name = match[1].trim();
            const quantity = parseInt(match[2]);
            const price = parseFloat(match[3]);
            if (name.length > 2 && quantity > 0) {
              products.push({ name, quantity, price });
            }
          } else {
            // Product Price format (assume qty 1)
            const name = match[1].trim();
            const price = parseFloat(match[2]);
            if (name.length > 2) {
              products.push({ name, quantity: 1, price });
            }
          }
          break;
        }
      }
    }

    return { products, totalAmount, billNumber };
  };

  const handleCustomerLookup = () => {
    if (customerPhone.length >= 10) {
      findCustomerMutation.mutate(customerPhone);
    }
  };

  const handleSubmitBill = () => {
    if (!extractedData?.totalAmount || !customerPhone) {
      toast({
        title: 'Missing Information',
        description: 'Please provide customer phone and ensure bill data is extracted',
        variant: 'destructive',
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmSubmitBill = () => {
    const billData = {
      customerPhone,
      customerName: customerName || undefined,
      customerId: customerId || undefined,
      referralCode: referralCode || undefined,

      // Extracted bill details
      products: extractedData!.products,
      totalAmount: extractedData!.totalAmount,
      billNumber: extractedData!.billNumber || undefined,

      // OCR metadata
      extractedText: extractedData!.extractedText,
      ocrConfidence: extractedData!.confidence,
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
            Bill Scanner & Submission
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

            {isProcessingOCR && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Extracting bill data...</span>
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

          {/* Extracted Bill Data */}
          {extractedData && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Extracted Bill Data</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <div className="p-2 bg-muted rounded">₹{extractedData.totalAmount}</div>
                </div>
                <div className="space-y-2">
                  <Label>Bill Number</Label>
                  <div className="p-2 bg-muted rounded">{extractedData.billNumber || 'Not found'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Products Found ({extractedData.products.length})</Label>
                <div className="border rounded p-4 max-h-40 overflow-y-auto">
                  {extractedData.products.length > 0 ? (
                    <ul className="space-y-1">
                      {extractedData.products.map((product, index) => (
                        <li key={index} className="text-sm">
                          {product.quantity}× {product.name} 
                          {product.price && ` - ₹${product.price.toFixed(2)}`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">No products extracted</p>
                  )}
                </div>
              </div>

              <Badge variant={extractedData.confidence > 80 ? "default" : "secondary"}>
                {extractedData.confidence}% OCR confidence
              </Badge>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleSubmitBill}
              disabled={!extractedData || !customerPhone || submitBillMutation.isPending}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Submit for Admin Approval
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
            <AlertDialogTitle>Submit Bill for Approval</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please verify the extracted data before submitting:</p>
              <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                <p><strong>Customer:</strong> {customerName || 'New Customer'} ({customerPhone})</p>
                <p><strong>Total Amount:</strong> ₹{extractedData?.totalAmount}</p>
                <p><strong>Bill Number:</strong> {extractedData?.billNumber || 'N/A'}</p>
                <p><strong>Products:</strong> {extractedData?.products.length || 0} items</p>
                {referralCode && <p><strong>Referral Code:</strong> {referralCode}</p>}
              </div>
              <p className="text-xs text-muted-foreground">
                This will be sent to admin for approval. Points will be automatically assigned after approval based on the configured rules.
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