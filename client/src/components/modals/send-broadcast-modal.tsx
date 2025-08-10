import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, MessageSquare, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SendBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendBroadcastModal({ isOpen, onClose }: SendBroadcastModalProps) {
  const [message, setMessage] = useState("");
  const [characterCount, setCharacterCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendBroadcastMutation = useMutation({
    mutationFn: async (messageData: { message: string; recipients: string }) => {
      const response = await apiRequest("POST", "/api/sms/broadcast", messageData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Broadcast Sent!",
        description: data.summary || `Message sent to ${data.messagesSent} customers`,
      });
      setMessage("");
      setCharacterCount(0);
      queryClient.invalidateQueries({ queryKey: ["/api/sms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sms/stats"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Broadcast Failed",
        description: error.message || "Failed to send broadcast message",
        variant: "destructive",
      });
    },
  });

  const handleMessageChange = (value: string) => {
    setMessage(value);
    setCharacterCount(value.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    if (message.length > 1600) {
      toast({
        title: "Error",
        description: "Message is too long. Maximum 1600 characters allowed.",
        variant: "destructive",
      });
      return;
    }

    sendBroadcastMutation.mutate({
      message: message.trim(),
      recipients: "all"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Broadcast Message
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message Input */}
          <div>
            <Label htmlFor="broadcastMessage">Message Content</Label>
            <Textarea
              id="broadcastMessage"
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder="Enter your message here..."
              rows={6}
              className="mt-2"
              data-testid="textarea-broadcast-message"
            />
            <div className="flex justify-between mt-2">
              <p className="text-sm text-gray-500">
                Use [COUPON_CODE] to include customer's referral code and [NAME] for their name
              </p>
              <p className={`text-sm ${characterCount > 1600 ? 'text-red-500' : characterCount > 1400 ? 'text-yellow-500' : 'text-gray-500'}`}>
                {characterCount}/1600
              </p>
            </div>
          </div>

          {/* Message Preview */}
          {message && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message Preview
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                  {message.replace(/\[COUPON_CODE\]/g, 'REF12345678').replace(/\[NAME\]/g, 'Customer Name')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recipient Info */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recipients
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="h-4 w-4" />
                This message will be sent to all customers in your database
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={sendBroadcastMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sendBroadcastMutation.isPending || !message.trim() || message.length > 1600}
              data-testid="button-send-broadcast"
            >
              {sendBroadcastMutation.isPending ? "Sending..." : "Send Broadcast"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}