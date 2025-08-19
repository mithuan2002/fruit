import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Download, Printer, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Simple QR code generator using a public API
function generateQRCodeURL(text: string, size: number = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}

export default function QRGenerator() {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [size, setSize] = useState(300);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get current site URL for registration
  const registrationUrl = `${window.location.origin}/register`;

  const generateQR = () => {
    const url = generateQRCodeURL(registrationUrl, size);
    setQrUrl(url);
  };

  const downloadQR = async () => {
    if (!qrUrl) return;

    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fruitbox-registration-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded!",
        description: "QR code saved to your downloads folder",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const printQR = () => {
    if (!qrUrl) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fruitbox Registration QR Code</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif; 
                text-align: center; 
              }
              h1 { 
                color: #4f46e5; 
                margin-bottom: 10px; 
              }
              .subtitle { 
                color: #6b7280; 
                margin-bottom: 30px; 
              }
              img { 
                border: 2px solid #e5e7eb; 
                border-radius: 8px; 
                margin: 20px 0; 
              }
              .instructions {
                margin-top: 20px;
                padding: 15px;
                background-color: #f3f4f6;
                border-radius: 8px;
                max-width: 400px;
                margin-left: auto;
                margin-right: auto;
              }
              @media print {
                .instructions { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <h1>Fruitbox Customer Registration</h1>
            <p class="subtitle">Scan to get your unique coupon code</p>
            <img src="${qrUrl}" alt="Registration QR Code" />
            <div class="instructions">
              <h3>Instructions for Customers:</h3>
              <ol style="text-align: left;">
                <li>Scan this QR code with your phone camera</li>
                <li>Enter your name and phone number</li>
                <li>Get your unique coupon code instantly</li>
                <li>Show the code at checkout for discounts</li>
              </ol>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Generator</h1>
          <p className="text-gray-600">Generate QR codes for customer registration at checkout</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode size={24} />
                <span>QR Code Settings</span>
              </CardTitle>
              <CardDescription>
                Customize your QR code for customer registration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registration-url">Registration URL</Label>
                <Input
                  id="registration-url"
                  value={registrationUrl}
                  readOnly
                  className="bg-gray-50"
                  data-testid="input-registration-url"
                />
                <p className="text-sm text-gray-500">
                  This URL will be encoded in your QR code
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">QR Code Size</Label>
                <Input
                  id="size"
                  type="number"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  min={100}
                  max={800}
                  step={50}
                  data-testid="input-size"
                />
                <p className="text-sm text-gray-500">
                  Size in pixels (100-800)
                </p>
              </div>

              <Button 
                onClick={generateQR} 
                className="w-full"
                data-testid="button-generate"
              >
                Generate QR Code
              </Button>

              <div className="pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <ExternalLink size={16} />
                  <span>Test the registration flow:</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(registrationUrl, '_blank')}
                  data-testid="button-test"
                >
                  Open Registration Page
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display Card */}
          <Card>
            <CardHeader>
              <CardTitle>Generated QR Code</CardTitle>
              <CardDescription>
                {qrUrl ? "Your QR code is ready!" : "Click 'Generate QR Code' to create"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img 
                      src={qrUrl} 
                      alt="Registration QR Code"
                      className="border-2 border-gray-200 rounded-lg shadow-sm"
                      data-testid="qr-code-image"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={downloadQR}
                      className="flex items-center space-x-2"
                      data-testid="button-download"
                    >
                      <Download size={16} />
                      <span>Download</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={printQR}
                      className="flex items-center space-x-2"
                      data-testid="button-print"
                    >
                      <Printer size={16} />
                      <span>Print</span>
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Usage Instructions:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Place this QR code at your checkout counter</li>
                      <li>• Customers scan with their phone camera</li>
                      <li>• They register and get a unique coupon code</li>
                      <li>• Code works for discounts and points tracking</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <QrCode size={64} className="mb-4" />
                  <p>No QR code generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PWA Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>PWA Features</CardTitle>
            <CardDescription>
              Progressive Web App capabilities for seamless customer experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">📱 Mobile Optimized</h4>
                <p className="text-sm text-green-700">
                  Works perfectly on all mobile devices and tablets
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">⚡ Fast Loading</h4>
                <p className="text-sm text-blue-700">
                  Instant loading and smooth registration process
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">🔄 Offline Capable</h4>
                <p className="text-sm text-purple-700">
                  Registration works even with poor internet connection
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}