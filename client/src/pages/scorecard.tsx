
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, Trophy, Zap } from 'lucide-react';

interface CustomerScore {
  phone: string;
  name: string;
  points: number;
  totalReferrals: number;
  rank: number;
  nextRewardAt: number;
  availableCoupons: number;
}

export default function Scorecard() {
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Get customer phone from URL params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phone = urlParams.get('phone') || localStorage.getItem('customer-phone') || '';
    setCustomerPhone(phone);
    if (phone) {
      localStorage.setItem('customer-phone', phone);
    }
  }, []);

  const { data: scoreData, isLoading } = useQuery({
    queryKey: ['customer-score', customerPhone],
    queryFn: async (): Promise<CustomerScore> => {
      if (!customerPhone) throw new Error('No phone number');
      const response = await fetch(`/api/customers/score/${encodeURIComponent(customerPhone)}`);
      if (!response.ok) throw new Error('Failed to fetch score');
      return response.json();
    },
    enabled: !!customerPhone,
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });

  if (!customerPhone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <Gift className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <h2 className="text-xl font-bold mb-2">Your Score Card</h2>
            <p className="text-gray-600 text-sm mb-4">
              Enter your phone number to view your live score
            </p>
            <input
              type="tel"
              placeholder="+91 9876543210"
              className="w-full p-3 border rounded-lg text-center"
              onChange={(e) => {
                const phone = e.target.value;
                setCustomerPhone(phone);
                window.location.search = `?phone=${encodeURIComponent(phone)}`;
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-32 bg-blue-200 rounded mx-auto mb-2"></div>
          <div className="h-4 w-24 bg-blue-100 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  const pointsToNext = scoreData ? scoreData.nextRewardAt - scoreData.points : 0;
  const progressPercent = scoreData ? (scoreData.points / scoreData.nextRewardAt) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-lg font-bold text-gray-800">🎯 My Score Card</h1>
        <p className="text-xs text-gray-600">{scoreData?.name || customerPhone}</p>
      </div>

      {/* Main Score Display */}
      <Card className="mb-4 shadow-lg border-2 border-blue-200">
        <CardContent className="p-6 text-center">
          <div className="relative">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {scoreData?.points || 0}
            </div>
            <div className="text-sm text-gray-600 mb-4">Total Points</div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {pointsToNext > 0 ? `${pointsToNext} points to next reward` : 'Reward available!'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{scoreData?.totalReferrals || 0}</div>
            <div className="text-xs text-gray-600">Referrals</div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">#{scoreData?.rank || '-'}</div>
            <div className="text-xs text-gray-600">Rank</div>
          </CardContent>
        </Card>
      </div>

      {/* Available Rewards */}
      {scoreData && scoreData.availableCoupons > 0 && (
        <Card className="mb-4 shadow-lg border-2 border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <Gift className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-green-800 mb-1">
              {scoreData.availableCoupons} Reward{scoreData.availableCoupons > 1 ? 's' : ''} Available!
            </div>
            <div className="text-sm text-green-700">
              Contact shop to redeem your rewards
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Update Indicator */}
      <div className="text-center py-4">
        <Badge variant="outline" className="text-xs">
          <Zap className="h-3 w-3 mr-1" />
          Live Updates Every 30s
        </Badge>
      </div>

      {/* Add to Home Screen Hint */}
      <div className="text-center py-2">
        <p className="text-xs text-gray-500">
          📌 Tap share → "Add to Home Screen" to pin this scorecard
        </p>
      </div>
    </div>
  );
}
