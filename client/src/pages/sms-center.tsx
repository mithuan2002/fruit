import { useState } from "react";
import Header from "@/components/layout/header";
import SmsActivity from "@/components/sms-activity";
import SendBroadcastModal from "@/components/modals/send-broadcast-modal";
import SmsStats from "@/components/sms-stats";
import SmsTroubleshoot from "@/components/sms-troubleshoot";

export default function SMSCenter() {
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  return (
    <>
      <Header
        title="SMS Center"
        description="Send messages and track SMS communication with your customers."
        createButtonText="Send Broadcast"
        onCreateClick={() => setShowBroadcastModal(true)}
        showCreateButton={true}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <SmsActivity />
            </div>
            <div className="lg:col-span-1">
              <SmsStats />
            </div>
            <div className="lg:col-span-1">
              <SmsTroubleshoot />
            </div>
          </div>
        </div>
      </main>

      <SendBroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
      />
    </>
  );
}
