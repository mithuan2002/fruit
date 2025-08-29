import React, { useState, useRef } from 'react';
import { Camera, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Webcam from 'react-webcam';

interface ExtractedBillData {
  invoiceNumber: string;
  totalAmount: string;
  storeName: string;
  billDate: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface OCRBillScannerProps {
  onBillProcessed?: (data: any) => void;
}

export default function OCRBillScanner({ onBillProcessed }: OCRBillScannerProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedBillData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  const [manualData, setManualData] = useState({
    invoiceNumber: '',
    totalAmount: '',
    storeName: '',
  });

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      // Convert base64 to file
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'captured-bill.jpg', { type: 'image/jpeg' });
          setSelectedImage(file);
          setImagePreview(imageSrc);
          setActiveTab('upload');
        });
    }
  };

  const processWithOCR = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);

    try {
      // Simple text extraction simulation
      // In a real app, you'd use an OCR service like Google Vision API, Tesseract.js, etc.
      const mockExtractedData: ExtractedBillData = {
        invoiceNumber: `INV${Math.floor(Math.random() * 10000)}`,
        totalAmount: (Math.random() * 1000 + 100).toFixed(2),
        storeName: 'Sample Store',
        billDate: new Date().toISOString().split('T')[0],
        products: [
          { name: 'Product 1', quantity: 2, price: 50.00 },
          { name: 'Product 2', quantity: 1, price: 75.00 },
        ]
      };

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setExtractedData(mockExtractedData);
      setManualData({
        invoiceNumber: mockExtractedData.invoiceNumber,
        totalAmount: mockExtractedData.totalAmount,
        storeName: mockExtractedData.storeName,
      });

      toast({
        title: "OCR Processing Complete",
        description: "Bill data extracted successfully. Please verify the details.",
      });
    } catch (error) {
      toast({
        title: "OCR Processing Failed",
        description: "Could not extract text from the image. Please try again or enter data manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    const finalData = {
      ...manualData,
      products: extractedData?.products || [],
      billDate: extractedData?.billDate || new Date().toISOString().split('T')[0],
    };

    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billData: finalData,
          imageFile: selectedImage,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Bill Submitted",
          description: "Your bill has been submitted for admin approval.",
        });

        onBillProcessed?.(result);
        resetForm();
      } else {
        throw new Error('Failed to submit bill');
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Could not submit the bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedData(null);
    setManualData({
      invoiceNumber: '',
      totalAmount: '',
      storeName: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bill Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Bill</TabsTrigger>
              <TabsTrigger value="camera">Camera</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bill-image">Select Bill Image</Label>
                  <Input
                    id="bill-image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="mt-1"
                  />
                </div>

                {imagePreview && (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <img
                        src={imagePreview}
                        alt="Selected bill"
                        className="max-w-full h-auto max-h-64 mx-auto rounded"
                      />
                    </div>

                    <Button
                      onClick={processWithOCR}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Extract Data
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full"
                    videoConstraints={{
                      width: 640,
                      height: 480,
                      facingMode: "environment"
                    }}
                  />
                </div>

                <Button onClick={capturePhoto} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Bill
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {extractedData && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Extracted Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                    value={manualData.invoiceNumber}
                    onChange={(e) => setManualData(prev => ({
                      ...prev,
                      invoiceNumber: e.target.value
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="total-amount">Total Amount</Label>
                  <Input
                    id="total-amount"
                    type="number"
                    step="0.01"
                    value={manualData.totalAmount}
                    onChange={(e) => setManualData(prev => ({
                      ...prev,
                      totalAmount: e.target.value
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input
                    id="store-name"
                    value={manualData.storeName}
                    onChange={(e) => setManualData(prev => ({
                      ...prev,
                      storeName: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setShowConfirmDialog(true)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Bill
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bill Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Please verify the extracted data before submitting for admin approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Submit for Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}