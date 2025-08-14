
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import StatsGrid from "@/components/dashboard/stats-grid";
import ActiveCampaigns from "@/components/dashboard/active-campaigns";
import TopPerformers from "@/components/dashboard/top-performers";
import CouponManagement from "@/components/dashboard/coupon-management";
import QuickActions from "@/components/dashboard/quick-actions";
import CouponRedemption from "@/components/coupon-redemption";
import IndustryWelcome from "@/components/industry-welcome";
import { Button } from "@/components/ui/button";
import { BarChart3, Calculator, ShoppingCart, Store, Settings } from "lucide-react";

export default function Dashboard() {
  return (
    <>
      <Header
        title="Dashboard"
        description="Process referrals and assign points based on sales transactions."
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">🚀 Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor your referral program performance and key metrics</p>
            </div>
            <Link href="/dashboard-setup-guide">
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Setup Guide
              </Button>
            </Link>
          </div>

          <IndustryWelcome />
          <StatsGrid />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="space-y-6">
              <CouponRedemption />
            </div>
            <div className="space-y-6">
              <TopPerformers />
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/points-setup">
              <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors">
                <Calculator className="h-6 w-6 text-blue-600" />
                <span className="font-medium">Points Setup</span>
                <span className="text-xs text-gray-500">Configure point rules</span>
              </Button>
            </Link>
            
            <Link href="/sales-processing">
              <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300 transition-colors">
                <ShoppingCart className="h-6 w-6 text-green-600" />
                <span className="font-medium">Sales Processing</span>
                <span className="text-xs text-gray-500">Process sales & points</span>
              </Button>
            </Link>
            
            <Link href="/pos-integration">
              <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300 transition-colors">
                <Store className="h-6 w-6 text-purple-600" />
                <span className="font-medium">POS Integration</span>
                <span className="text-xs text-gray-500">Connect your POS</span>
              </Button>
            </Link>
            
            <Link href="/settings">
              <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                <Settings className="h-6 w-6 text-gray-600" />
                <span className="font-medium">Settings</span>
                <span className="text-xs text-gray-500">Manage your shop</span>
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            <ActiveCampaigns />
            <CouponManagement />
          </div>
        </div>
      </main>
    </>
  );
}
