import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, Users, Target } from "lucide-react";

interface SendWhatsAppBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendWhatsAppBroadcastModal({ isOpen, onClose }: SendWhatsAppBroadcastModalProps) {
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendBroadcast = useMutation({
    mutationFn: async (data: { message: string; recipients: string }) => {
      const response = await apiRequest("POST", "/api/whatsapp/broadcast", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Broadcast Sent!",
        description: `Successfully sent ${data.messagesSent} WhatsApp messages. ${data.messagesFailed > 0 ? `${data.messagesFailed} failed.` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp"] });
      handleClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to send broadcast",
        description: error.message,
      });
    },
  });

  const handleClose = () => {
    setMessage("");
    setRecipients("all");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Message Required",
        description: "Please enter a message to send.",
      });
      return;
    }
    sendBroadcast.mutate({ message: message.trim(), recipients });
  };

  const messageLength = message.length;
  const maxLength = 1600;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-whatsapp-broadcast">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send WhatsApp Broadcast
          </DialogTitle>
          <DialogDescription>
            Send a message to all your customers via WhatsApp. Messages are sent automatically with rate limiting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipients">Recipients</Label>
            <RadioGroup
              value={recipients}
              onValueChange={setRecipients}
              className="flex space-x-4"
              data-testid="radio-recipients"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4" />
                  All Customers
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Message ({messageLength}/{maxLength} characters)
            </Label>
            <Textarea
              id="message"
              placeholder="Enter your WhatsApp message here... You can use [NAME] for customer name and [COUPON_CODE] for their referral code."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={maxLength}
              data-testid="textarea-message"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Tip: Use [NAME] and [COUPON_CODE] for personalization</span>
              <span className={messageLength > maxLength * 0.9 ? "text-orange-500" : ""}>
                {maxLength - messageLength} characters remaining
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Preview</span>
            </div>
            <p className="text-xs text-blue-700">
              {message || "Your message will appear here..."}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sendBroadcast.isPending || !message.trim()}
              data-testid="button-send-broadcast"
            >
              {sendBroadcast.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Broadcast
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}