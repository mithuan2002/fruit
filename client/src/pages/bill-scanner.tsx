import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, Upload, CheckCircle, AlertCircle, Receipt, Gift } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface BillScanResult {
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

export default function BillScanner() {
  const [customerPhone, setCustomerPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<BillScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Get customer by phone number
  const findCustomerMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await fetch(`/api/customers/phone/${phoneNumber}`);
      if (!response.ok) {
        throw new Error("Customer not found");
      }
      return response.json();
    },
    onError: () => {
      toast({
        title: "Customer Not Found",
        description: "Please register first or check your phone number",
        variant: "destructive",
      });
    },
  });

  // Upload and process bill
  const uploadBillMutation = useMutation({
    mutationFn: async ({ customerId, imageData, referralCode }: {
      customerId: string;
      imageData: string;
      referralCode?: string;
    }) => {
      const response = await fetch("/api/bills/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          imageData,
          referralCode: referralCode || undefined,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process bill");
      }
      
      return response.json() as Promise<BillScanResult>;
    },
    onSuccess: (result) => {
      setScanResult(result);
      toast({
        title: "Bill Processed Successfully! 🎉",
        description: `You earned ${result.bill.pointsEarned} points! New balance: ${result.customer.newPointsBalance} points`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // Trigger file input for camera
    const input = document.getElementById('camera-input') as HTMLInputElement;
    input?.click();
  };

  const handleProcessBill = async () => {
    if (!customerPhone.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (!selectedImage) {
      toast({
        title: "Image Required",
        description: "Please select or capture a bill image",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // First find the customer
      const customer = await findCustomerMutation.mutateAsync(customerPhone.replace(/[^\d]/g, ''));
      
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        // Upload and process bill
        await uploadBillMutation.mutateAsync({
          customerId: customer.id,
          imageData: imageData.split(',')[1], // Remove data:image/... prefix
          referralCode: referralCode.trim() || undefined,
        });
      };
      reader.readAsDataURL(selectedImage);
      
    } catch (error) {
      // Error is handled by mutation onError
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCustomerPhone("");
    setReferralCode("");
    setSelectedImage(null);
    setImagePreview(null);
    setScanResult(null);
  };

  if (scanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Bill Processed Successfully!</CardTitle>
              <CardDescription className="text-green-600">
                Your points have been added to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bill Details */}
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold text-sm">Bill Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Store</p>
                    <p className="font-medium">{scanResult.bill.storeName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount</p>
                    <p className="font-medium">₹{scanResult.bill.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Invoice</p>
                    <p className="font-medium text-xs">{scanResult.bill.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date</p>
                    <p className="font-medium text-xs">
                      {new Date(scanResult.bill.processedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Points Earned */}
              <div className="bg-white rounded-lg p-4">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Points Earned</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    +{scanResult.bill.pointsEarned}
                  </div>
                  <p className="text-sm text-gray-600">
                    New Balance: <span className="font-semibold text-blue-600">
                      {scanResult.customer.newPointsBalance} points
                    </span>
                  </p>
                </div>
              </div>

              {/* Referral Bonus */}
              {scanResult.referrer && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-center space-y-2">
                    <div className="font-semibold text-purple-800">Referral Bonus!</div>
                    <p className="text-sm text-purple-600">
                      {scanResult.referrer.name} earned {scanResult.referrer.bonusPointsEarned} bonus points
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={resetForm} 
                  className="w-full"
                  data-testid="button-scan-another"
                >
                  Scan Another Bill
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/register'}
                  data-testid="link-view-history"
                >
                  View Bill History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Bill Scanner</h1>
          <p className="text-gray-600">Upload your bill to earn points automatically</p>
        </div>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
            <CardDescription>Enter your registered phone number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                data-testid="input-phone"
              />
            </div>
            <div>
              <Label htmlFor="referral">Referral Code (Optional)</Label>
              <Input
                id="referral"
                type="text"
                placeholder="Enter referral code if you have one"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                data-testid="input-referral"
              />
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Bill Image</CardTitle>
            <CardDescription>Take a photo or upload an image of your receipt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Preview */}
            {imagePreview && (
              <div className="bg-gray-50 rounded-lg p-4">
                <img 
                  src={imagePreview} 
                  alt="Bill preview" 
                  className="w-full max-h-64 object-contain rounded-md"
                />
                <div className="flex justify-center mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    data-testid="button-remove-image"
                  >
                    Remove Image
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Options */}
            {!imagePreview && (
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCameraCapture}
                  data-testid="button-camera"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                
                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                    OR
                  </span>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => document.getElementById('file-input')?.click()}
                  data-testid="button-upload"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload from Gallery
                </Button>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              id="camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageSelect}
            />
            <input
              id="file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </CardContent>
        </Card>

        {/* Process Button */}
        <Button 
          className="w-full"
          size="lg"
          onClick={handleProcessBill}
          disabled={isProcessing || !selectedImage || !customerPhone.trim()}
          data-testid="button-process-bill"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Bill...
            </>
          ) : (
            <>
              <Receipt className="h-4 w-4 mr-2" />
              Process Bill & Earn Points
            </>
          )}
        </Button>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">How it works:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Earn 1 point for every ₹10 spent</li>
                  <li>• Referrers get 10% bonus points</li>
                  <li>• Bills are automatically verified</li>
                  <li>• Points added instantly to your account</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}