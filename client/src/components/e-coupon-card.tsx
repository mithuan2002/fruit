import { Button } from "@/components/ui/button";
import { Copy, Sparkles, User, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

interface ECouponCardProps {
  customerName: string;
  shopName: string;
  couponCode: string;
}

export default function ECouponCard({ customerName, shopName, couponCode }: ECouponCardProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    const couponText = `🎁 ${shopName}\nFor: ${customerName}\nCode: ${couponCode}\n\nThank you for choosing us!`;
    navigator.clipboard.writeText(couponText);
    toast({
      title: "Copied!",
      description: "Coupon shared to clipboard",
    });
  };

  return (
    <Card className="w-full max-w-sm mx-auto bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600 text-white border-none shadow-xl overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
      
      <CardContent className="p-6 relative z-10">
        <div className="space-y-5">
          {/* Header with sparkle icon */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-3">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Referral Coupon</span>
            </div>
          </div>

          {/* Shop info */}
          <div className="text-center border-b border-white/20 pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Store className="h-4 w-4 opacity-80" />
              <span className="text-xs uppercase tracking-wide opacity-80">From</span>
            </div>
            <h2 className="text-2xl font-bold">{shopName || "Your Shop"}</h2>
          </div>

          {/* Customer info */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <User className="h-4 w-4 opacity-80" />
              <span className="text-xs uppercase tracking-wide opacity-80">For</span>
            </div>
            <p className="text-lg font-semibold">{customerName}</p>
          </div>

          {/* Coupon code - highlighted */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <p className="text-xs text-center mb-2 opacity-80 uppercase tracking-wide">Your Code</p>
            <p className="text-2xl font-bold text-center font-mono tracking-widest bg-white/20 py-2 px-4 rounded-lg">
              {couponCode}
            </p>
          </div>

          {/* Copy button */}
          <Button 
            onClick={copyToClipboard}
            className="w-full bg-white text-emerald-600 hover:bg-white/95 font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <Copy className="h-4 w-4 mr-2" />
            Share Coupon
          </Button>

          {/* Personal touch message */}
          <p className="text-center text-xs opacity-75 italic">
            "Thank you for your referral!"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}