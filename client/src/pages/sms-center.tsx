import Header from "@/components/layout/header";
import SmsActivity from "@/components/sms-activity";

export default function SMSCenter() {
  return (
    <>
      <Header
        title="SMS Center"
        description="Send messages and track SMS communication with your customers."
        createButtonText="Send Broadcast"
        showCreateButton={true}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1">
              <SmsActivity />
            </div>
            <div className="lg:col-span-1">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">SMS Features</h3>
                <p className="text-gray-500">Additional SMS management features will be available soon.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
