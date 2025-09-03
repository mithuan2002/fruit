
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BillScannerWidgetProps {
  customerId: string;
  onClose: () => void;
  onSubmit: () => void;
}

export default function BillScannerWidget({ customerId, onClose, onSubmit }: BillScannerWidgetProps) {
  const [billData, setBillData] = useState({
    shopName: '',
    totalAmount: '',
    billNumber: '',
    notes: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a valid image file",
        variant: "destructive"
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const takePicture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "camera" as any;
      fileInputRef.current.click();
    }
  };

  const selectFromGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage || !billData.totalAmount) {
      toast({
        title: "Missing information",
        description: "Please add bill image and total amount",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('customerId', customerId);
      formData.append('shopName', billData.shopName);
      formData.append('totalAmount', billData.totalAmount);
      formData.append('billNumber', billData.billNumber);
      formData.append('notes', billData.notes);

      const response = await fetch('/api/bills/submit-for-approval', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({
          title: "Bill submitted!",
          description: "Your bill is being reviewed. Points will be added once approved."
        });
        onSubmit();
      } else {
        throw new Error('Failed to submit bill');
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <Card className="w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Submit Bill</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-3">
            <Label>Bill Image *</Label>
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Bill preview" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={takePicture}
                  className="h-24 flex flex-col items-center gap-2 border-2 border-dashed"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-sm">Take Photo</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={selectFromGallery}
                  className="h-24 flex flex-col items-center gap-2 border-2 border-dashed"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Choose Photo</span>
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Bill Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={billData.shopName}
                onChange={(e) => setBillData({...billData, shopName: e.target.value})}
                placeholder="e.g. Fresh Mart"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount *</Label>
              <Input
                id="totalAmount"
                type="number"
                value={billData.totalAmount}
                onChange={(e) => setBillData({...billData, totalAmount: e.target.value})}
                placeholder="₹ 0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billNumber">Bill Number (optional)</Label>
            <Input
              id="billNumber"
              value={billData.billNumber}
              onChange={(e) => setBillData({...billData, billNumber: e.target.value})}
              placeholder="Invoice/Bill number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              value={billData.notes}
              onChange={(e) => setBillData({...billData, notes: e.target.value})}
              placeholder="Any additional details..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedImage || !billData.totalAmount}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            size="lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Bills are usually approved within 24 hours. You'll earn {Math.floor(parseFloat(billData.totalAmount || '0') / 10)} points if approved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
