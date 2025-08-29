
import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Receipt, FileText, Zap, Phone, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Quick Entry Component
export function QuickBillEntry({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [quickData, setQuickData] = useState({
    customerPhone: '',
    customerName: '',
    totalAmount: '',
    storeName: '',
    referralCode: ''
  });
  const { toast } = useToast();

  const handleQuickSubmit = () => {
    if (!quickData.customerPhone || !quickData.totalAmount) {
      toast({
        title: 'Missing Information',
        description: 'Phone number and amount are required',
        variant: 'destructive',
      });
      return;
    }

    onSubmit({
      customerPhone: quickData.customerPhone,
      customerName: quickData.customerName || `Customer ${quickData.customerPhone}`,
      totalAmount: quickData.totalAmount,
      billNumber: `QUICK-${Date.now()}`,
      products: [{ name: 'General Purchase', quantity: 1, price: parseFloat(quickData.totalAmount) }],
      extractedText: `Quick entry - Store: ${quickData.storeName || 'Unknown'}`,
      ocrConfidence: 100,
      entryMethod: 'quick',
      referralCode: quickData.referralCode
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Bill Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quickPhone">Customer Phone *</Label>
            <Input
              id="quickPhone"
              value={quickData.customerPhone}
              onChange={(e) => setQuickData(prev => ({ ...prev, customerPhone: e.target.value }))}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quickName">Customer Name</Label>
            <Input
              id="quickName"
              value={quickData.customerName}
              onChange={(e) => setQuickData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="Enter customer name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quickAmount">Bill Amount (₹) *</Label>
            <Input
              id="quickAmount"
              type="number"
              value={quickData.totalAmount}
              onChange={(e) => setQuickData(prev => ({ ...prev, totalAmount: e.target.value }))}
              placeholder="Enter total amount"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quickStore">Store Name</Label>
            <Input
              id="quickStore"
              value={quickData.storeName}
              onChange={(e) => setQuickData(prev => ({ ...prev, storeName: e.target.value }))}
              placeholder="Enter store name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quickReferral">Referral Code (Optional)</Label>
          <Input
            id="quickReferral"
            value={quickData.referralCode}
            onChange={(e) => setQuickData(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
            placeholder="Enter referral code"
          />
        </div>

        <Button 
          onClick={handleQuickSubmit}
          disabled={!quickData.customerPhone || !quickData.totalAmount}
          className="w-full"
        >
          Submit Bill for Approval
        </Button>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import Webcam from 'react-webcam';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Camera, Upload, CheckCircle } from 'lucide-react';
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
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [manualBillData, setManualBillData] = useState({
    totalAmount: '',
    billNumber: '',
    storeName: '',
    products: [{ name: '', quantity: 1, price: 0 }]
  });

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
    // Instead of OCR, just store the image and prompt for manual entry
    setIsProcessingOCR(false);
    
    toast({
      title: 'Image Captured',
      description: 'Please enter the bill details manually below',
    });
    
    // Auto-switch to manual entry mode
    setUseManualEntry(true);
  };

  const addProduct = () => {
    setManualBillData(prev => ({
      ...prev,
      products: [...prev.products, { name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeProduct = (index: number) => {
    setManualBillData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    setManualBillData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const calculateTotal = () => {
    const total = manualBillData.products.reduce((sum, product) => 
      sum + (product.price * product.quantity), 0
    );
    setManualBillData(prev => ({ ...prev, totalAmount: total.toString() }));
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

      // Bill details (from manual entry or OCR)
      products: extractedData!.products,
      totalAmount: extractedData!.totalAmount,
      billNumber: extractedData!.billNumber || manualBillData.billNumber || undefined,

      // Metadata
      extractedText: extractedData!.extractedText,
      ocrConfidence: extractedData!.confidence,
      imageData: imagePreview || undefined,
      entryMethod: useManualEntry ? 'manual' : 'ocr',
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
        <CardContent>
          <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick">Quick Entry</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="scan">Scan Bill</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quick" className="space-y-6">
              <QuickBillEntry onSubmit={(data) => {
                submitBillMutation.mutate(data);
              }} />
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-6">
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

                {/* Manual Entry Toggle */}
                <div className="flex gap-4">
                  <Button
                    variant={useManualEntry ? "default" : "outline"}
                    onClick={() => setUseManualEntry(true)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Manual Entry
                  </Button>
                  <Button
                    variant={!useManualEntry ? "default" : "outline"}
                    onClick={() => setUseManualEntry(false)}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Scan Bill
                  </Button>
                </div>

                {/* Manual Entry Form */}
                {useManualEntry && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Enter Bill Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="storeName">Store Name</Label>
                          <Input
                            id="storeName"
                            value={manualBillData.storeName}
                            onChange={(e) => setManualBillData(prev => ({ ...prev, storeName: e.target.value }))}
                            placeholder="Enter store name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billNumber">Bill Number</Label>
                          <Input
                            id="billNumber"
                            value={manualBillData.billNumber}
                            onChange={(e) => setManualBillData(prev => ({ ...prev, billNumber: e.target.value }))}
                            placeholder="Enter bill number"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Products</Label>
                          <Button type="button" onClick={addProduct} size="sm">
                            Add Product
                          </Button>
                        </div>
                        
                        {manualBillData.products.map((product, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-5">
                              <Input
                                placeholder="Product name"
                                value={product.name}
                                onChange={(e) => updateProduct(index, 'name', e.target.value)}
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={product.quantity}
                                onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                type="number"
                                placeholder="Price"
                                value={product.price}
                                onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="col-span-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeProduct(index)}
                                disabled={manualBillData.products.length === 1}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4">
                        <Button type="button" onClick={calculateTotal} variant="outline">
                          Calculate Total
                        </Button>
                        <div className="space-y-2 flex-1">
                          <Label htmlFor="totalAmount">Total Amount (₹)</Label>
                          <Input
                            id="totalAmount"
                            type="number"
                            value={manualBillData.totalAmount}
                            onChange={(e) => setManualBillData(prev => ({ ...prev, totalAmount: e.target.value }))}
                            placeholder="Enter total amount"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          // Convert manual data to extracted data format
                          setExtractedData({
                            products: manualBillData.products.filter(p => p.name),
                            totalAmount: manualBillData.totalAmount,
                            billNumber: manualBillData.billNumber,
                            extractedText: `Manual entry - Store: ${manualBillData.storeName}`,
                            confidence: 100
                          });
                          
                          toast({
                            title: 'Bill Data Entered',
                            description: `Total: ₹${manualBillData.totalAmount}`,
                          });
                        }}
                        disabled={!manualBillData.totalAmount}
                        className="w-full"
                      >
                        Use This Data
                      </Button>
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
            </TabsContent>

            <TabsContent value="scan" className="space-y-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">OCR scanning is currently disabled. Please use Manual Entry instead.</p>
              </div>
            </TabsContent>
          </Tabs>
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
