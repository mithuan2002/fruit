import { useAuth } from "@/hooks/useAuth";
import { 
  UtensilsCrossed, 
  Shirt, 
  Smartphone, 
  Sparkles, 
  Wrench, 
  Package 
} from "lucide-react";

const industryConfig = {
  food: {
    icon: UtensilsCrossed,
    title: "Food & Restaurant",
    color: "from-orange-500 to-red-500",
    tips: [
      "Offer loyalty points for repeat orders",
      "Create referral bonuses for bringing friends",
      "Track popular dishes and recommend them",
      "Send birthday discounts via WhatsApp"
    ],
    examples: [
      "Refer 3 friends, get a free appetizer",
      "Share our menu, earn 10% off your next order",
      "Birthday month: 20% off all desserts"
    ]
  },
  fashion: {
    icon: Shirt,
    title: "Fashion & Apparel",
    color: "from-pink-500 to-purple-500",
    tips: [
      "Reward customers for social media shares",
      "Create seasonal referral campaigns",
      "Offer style consultation rewards",
      "Track trending items and sizes"
    ],
    examples: [
      "Share your outfit, get 15% off next purchase",
      "Refer 5 friends, unlock VIP styling session",
      "Season finale: Extra 20% off clearance"
    ]
  },
  electronics: {
    icon: Smartphone,
    title: "Electronics & Tech",
    color: "from-blue-500 to-cyan-500",
    tips: [
      "Offer tech support priority for referrers",
      "Create upgrade loyalty programs",
      "Track warranty and service renewals",
      "Send product launch notifications"
    ],
    examples: [
      "Refer customers, get extended warranty",
      "Loyalty tier: Priority tech support",
      "New arrivals: First access for VIP members"
    ]
  },
  beauty: {
    icon: Sparkles,
    title: "Beauty & Cosmetics",
    color: "from-pink-400 to-rose-500",
    tips: [
      "Reward product reviews and tutorials",
      "Create beauty consultation incentives",
      "Track skin type and product preferences",
      "Send seasonal beauty tips"
    ],
    examples: [
      "Review 3 products, get free consultation",
      "Refer friends, unlock exclusive shades",
      "Birthday beauty box with 5 referrals"
    ]
  },
  services: {
    icon: Wrench,
    title: "Services",
    color: "from-green-500 to-teal-500",
    tips: [
      "Offer service bundles for referrals",
      "Create loyalty for repeat bookings",
      "Track service preferences and timing",
      "Send maintenance reminders"
    ],
    examples: [
      "Refer 2 clients, get 1 service free",
      "Book quarterly, save 15% annually",
      "Maintenance reminder: 20% off tune-up"
    ]
  },
  others: {
    icon: Package,
    title: "General Business",
    color: "from-gray-500 to-slate-600",
    tips: [
      "Create flexible referral rewards",
      "Track customer purchase patterns",
      "Offer seasonal promotions",
      "Build community engagement programs"
    ],
    examples: [
      "Refer customers, earn store credit",
      "Loyalty program: Collect points for rewards",
      "Community events: Member exclusive access"
    ]
  }
};

export default function IndustryWelcome() {
  const { user } = useAuth();
  
  if (!user?.industry) return null;
  
  const config = industryConfig[user.industry as keyof typeof industryConfig];
  const IconComponent = config.icon;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center`}>
          <IconComponent className="text-white h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome to {user.shopName}!
          </h2>
          <p className="text-sm text-gray-600">
            {config.title} • Personalized for your industry
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Recommended Strategies</h3>
          <ul className="space-y-2">
            {config.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                {tip}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Campaign Examples</h3>
          <ul className="space-y-2">
            {config.examples.map((example, index) => (
              <li key={index} className="text-sm text-gray-600 bg-gray-50 rounded-md p-2">
                "{example}"
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}