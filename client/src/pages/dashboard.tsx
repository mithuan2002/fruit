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
import BillingPOS from "@/components/billing-pos";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <BillingPOS />
            </div>
            <div className="space-y-6">
              <CouponRedemption />
              <TopPerformers />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}