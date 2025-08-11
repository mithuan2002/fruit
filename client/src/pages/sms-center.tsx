import { useState } from "react";
import Header from "@/components/layout/header";
import WhatsAppActivity from "@/components/whatsapp-activity";
import SendWhatsAppBroadcastModal from "@/components/modals/send-whatsapp-broadcast-modal";
import WhatsAppStats from "@/components/whatsapp-stats";
import WhatsAppConnection from "@/components/whatsapp-connection";
import WhatsAppGuide from "@/components/whatsapp-guide";

export default function WhatsAppCenter() {
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  return (
    <>
      <Header
        title="WhatsApp Center"
        description="Send automated WhatsApp messages and track communication with your customers."
        createButtonText="Send Broadcast"
        onCreateClick={() => setShowBroadcastModal(true)}
        showCreateButton={true}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <WhatsAppConnection />
              <WhatsAppActivity />
              <WhatsAppStats />
            </div>
            <div className="space-y-6">
              <WhatsAppGuide />
            </div>
          </div>
        </div>
      </main>

      <SendWhatsAppBroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
      />
    </>
  );
}
