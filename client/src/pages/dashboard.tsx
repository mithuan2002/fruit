import { useState } from "react";
import Header from "@/components/layout/header";
import StatsGrid from "@/components/dashboard/stats-grid";
import ActiveCampaigns from "@/components/dashboard/active-campaigns";
import TopPerformers from "@/components/dashboard/top-performers";
import CouponManagement from "@/components/dashboard/coupon-management";
import QuickActions from "@/components/dashboard/quick-actions";

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
          <StatsGrid />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <CouponRedemption />
            </div>
            <div className="space-y-6">
              <TopPerformers />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}