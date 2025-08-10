import Header from "@/components/layout/header";

export default function Campaigns() {
  return (
    <>
      <Header
        title="Campaigns"
        description="Manage your referral campaigns and track their performance."
        createButtonText="New Campaign"
        showCreateButton={true}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Campaigns Management</h3>
            <p className="text-gray-500">This page is under development. Campaign management features will be available soon.</p>
          </div>
        </div>
      </main>
    </>
  );
}
