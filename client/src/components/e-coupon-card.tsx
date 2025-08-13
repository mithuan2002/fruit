import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Coupon } from "@shared/schema";

interface ECouponCardProps {
  coupon: Coupon;
  customerName: string;
  shopName?: string;
}

export default function ECouponCard({ coupon, customerName, shopName = "Your Shop" }: ECouponCardProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    const couponText = `${shopName}\nCustomer: ${customerName}\nCoupon Code: ${coupon.code}`;
    navigator.clipboard.writeText(couponText);
    toast({
      title: "Copied!",
      description: "Coupon details copied to clipboard",
    });
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Simple Coupon Container */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-0.5 rounded-lg shadow-lg">
        <div className="bg-white rounded-lg p-6 text-center space-y-4">
          
          {/* Shop Name */}
          <div className="text-xl font-bold text-gray-800 border-b-2 border-dashed border-gray-300 pb-3">
            {shopName}
          </div>
          
          {/* Customer Name */}
          <div className="text-lg font-semibold text-gray-700">
            {customerName}
          </div>
          
          {/* Coupon Code */}
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-2xl font-mono font-bold text-gray-800 tracking-widest mb-2">
              {coupon.code}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="w-full"
              data-testid={`button-copy-${coupon.code}`}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Details
            </Button>
          </div>
          
        </div>
      </div>

      {/* Perforation dots for coupon look */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
        ))}
      </div>
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
        ))}
      </div>
    </div>
  );
}