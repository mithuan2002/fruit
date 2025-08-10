import Header from "@/components/layout/header";

export default function Coupons() {
  return (
    <>
      <Header
        title="Coupon Codes"
        description="Generate and manage coupon codes for your referral campaigns."
        createButtonText="Generate Codes"
        showCreateButton={true}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coupon Management</h3>
            <p className="text-gray-500">This page is under development. Coupon code management features will be available soon.</p>
          </div>
        </div>
      </main>
    </>
  );
}
