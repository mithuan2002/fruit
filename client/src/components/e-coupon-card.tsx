import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Gift } from "lucide-react";

interface ECouponCardProps {
  customerName: string;
  shopName: string;
  couponCode: string;
}

export default function ECouponCard({ customerName, shopName, couponCode }: ECouponCardProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    const couponText = `${shopName || "Your Shop"}\nCustomer: ${customerName}\nCoupon Code: ${couponCode}`;
    navigator.clipboard.writeText(couponText);
    toast({
      title: "Copied!",
      description: "Coupon details copied to clipboard",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-500 to-purple-600 text-white border-none shadow-lg">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift className="h-6 w-6" />
            <h2 className="text-xl font-bold">E-Coupon</h2>
          </div>

          {/* Shop Name */}
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm opacity-90">Shop</p>
            <p className="text-lg font-semibold">{shopName || "Your Shop"}</p>
          </div>

          {/* Customer Name */}
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm opacity-90">Customer</p>
            <p className="text-lg font-semibold">{customerName}</p>
          </div>

          {/* Coupon Code */}
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm opacity-90">Coupon Code</p>
            <p className="text-xl font-bold tracking-wider font-mono">{couponCode}</p>
          </div>

          {/* Copy Button */}
          <Button 
            onClick={copyToClipboard}
            variant="secondary"
            className="w-full bg-white text-blue-600 hover:bg-white/90 transition-colors"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}