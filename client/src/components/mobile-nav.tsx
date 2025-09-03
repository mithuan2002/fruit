
import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  Home, 
  Receipt, 
  Users, 
  User,
  Gift
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const navItems = [
    { id: 'overview', label: 'Home', icon: Home },
    { id: 'bills', label: 'Bills', icon: Receipt },
    { id: 'referrals', label: 'Refer', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-100 rounded-t-xl shadow-xl">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
