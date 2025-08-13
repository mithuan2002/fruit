import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Gift, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Coupon } from "@shared/schema";

interface ECouponCardProps {
  coupon: Coupon;
  customerName: string;
  shopName?: string;
}

export default function ECouponCard({ coupon, customerName, shopName = "Your Shop" }: ECouponCardProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Coupon code copied to clipboard",
    });
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Coupon Container */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-0.5 rounded-lg shadow-lg">
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b-2 border-dashed border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-600" />
                <span className="font-bold text-purple-800 text-lg">{shopName}</span>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                E-COUPON
              </Badge>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">Exclusive Discount For</p>
              <p className="font-semibold text-gray-800">{customerName}</p>
            </div>
          </div>

          {/* Discount Section */}
          <div className="px-6 py-6 text-center bg-gradient-to-br from-yellow-50 to-orange-50">
            <div className="mb-4">
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {coupon.value}{coupon.valueType === 'percentage' ? '%' : ''}
              </div>
              <div className="text-lg font-semibold text-gray-700">
                {coupon.valueType === 'percentage' ? 'OFF' : 'DISCOUNT'}
              </div>
            </div>

            {/* Coupon Code */}
            <div className="bg-white border-2 border-dashed border-orange-300 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">COUPON CODE</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-mono font-bold text-gray-800 tracking-widest">
                  {coupon.code}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(coupon.code)}
                  className="h-8 w-8 p-0"
                  data-testid={`button-copy-${coupon.code}`}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Terms */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• {coupon.usageLimit === -1 ? 'Unlimited usage' : `Valid for ${coupon.usageLimit - coupon.usageCount} more uses`}</p>
              <p>• {coupon.expiresAt ? `Expires: ${new Date(coupon.expiresAt).toLocaleDateString()}` : 'Never expires'}</p>
              <p>• Present this coupon at checkout</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 text-center border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Thank you for choosing {shopName}!
            </p>
          </div>
        </div>
      </div>

      {/* Decorative scissors */}
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md">
        <Scissors className="h-4 w-4 text-gray-400 rotate-90" />
      </div>
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md">
        <Scissors className="h-4 w-4 text-gray-400 rotate-90" />
      </div>

      {/* Perforation dots */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-1 h-1 bg-gray-300 rounded-full" />
        ))}
      </div>
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-1 h-1 bg-gray-300 rounded-full" />
        ))}
      </div>
    </div>
  );
}