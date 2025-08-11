import { storage } from './storage';

interface WatiMessage {
  template_name?: string;
  broadcast_name?: string;
  parameters?: Array<{
    name: string;
    value: string;
  }>;
  text?: string;
}

class WatiService {
  private apiToken: string = '';
  private businessPhoneNumber: string = '';
  private businessName: string = '';
  private isConfigured: boolean = false;
  private baseUrl: string = 'https://live-server-113452.wati.io/api/v1';

  constructor() {
    console.log('WATI Service initializing...');
    console.log('📱 WATI WhatsApp Service ready for configuration');
    console.log('💡 Configure your WATI API token and business number via the frontend');
  }

  // Configure WATI credentials
  configure(apiToken: string, businessPhoneNumber: string, businessName: string = 'Your Shop') {
    if (!apiToken || !businessPhoneNumber) {
      throw new Error('API token and business phone number are required');
    }

    this.apiToken = apiToken;
    this.businessPhoneNumber = businessPhoneNumber;
    this.businessName = businessName;
    this.isConfigured = true;

    console.log(`✅ WATI configured: ${this.businessPhoneNumber} (${this.businessName})`);
    console.log('📱 Ready to send WhatsApp messages via WATI');

    return {
      success: true,
      businessNumber: this.businessPhoneNumber,
      businessName: this.businessName
    };
  }

  // Clear configuration
  clearConfiguration() {
    console.log('📱 Clearing WATI configuration...');
    this.apiToken = '';
    this.businessPhoneNumber = '';
    this.businessName = '';
    this.isConfigured = false;

    return { success: true };
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConfigured,
      businessNumber: this.businessPhoneNumber,
      businessName: this.businessName,
      configured: this.isConfigured
    };
  }

  // Send welcome message with coupon code
  async sendWelcomeMessage(customerPhone: string, customerName: string, couponCode: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'WATI not configured. Please add your API token and business number first.'
      };
    }

    const message = `🎉 Hi ${customerName}! Welcome to ${this.businessName}! 

Thank you for shopping with us. Here's your referral code: *${couponCode}*

Share this code with friends and family to earn points and rewards!

Happy shopping! 🛍️`;

    return this.sendMessage(customerPhone, message, 'welcome_referral');
  }

  // Send points earned notification
  async sendPointsEarnedMessage(customerPhone: string, customerName: string, pointsEarned: number): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'WATI not configured. Please add your API token and business number first.'
      };
    }

    const message = `🎊 Great news ${customerName}! 

You've earned *${pointsEarned} points* from your recent referral! 

Your total points are now available for redemption. Keep referring friends to earn more rewards!

Thank you for being part of ${this.businessName}! 🌟`;

    return this.sendMessage(customerPhone, message, 'points_earned');
  }

  // Send points redemption notification
  async sendPointsRedeemedMessage(customerPhone: string, customerName: string, pointsRedeemed: number): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'WATI not configured. Please add your API token and business number first.'
      };
    }

    const message = `✅ Points Redeemed Successfully!

Hi ${customerName}, you've successfully redeemed *${pointsRedeemed} points*!

Your reward is being processed. Keep shopping and referring friends to earn more points!

Thanks for choosing ${this.businessName}! 🎁`;

    return this.sendMessage(customerPhone, message, 'points_redeemed');
  }

  // Generic message sender
  private async sendMessage(phoneNumber: string, text: string, type: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Clean and format phone number (remove + and ensure it starts with country code)
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      
      const response = await fetch(`${this.baseUrl}/sendSessionMessage/${cleanPhone}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageText: text
        })
      });

      const result = await response.json();

      if (response.ok && result.result) {
        console.log(`📤 WATI WhatsApp message sent successfully:`);
        console.log(`   From: ${this.businessPhoneNumber} (${this.businessName})`);
        console.log(`   To: ${phoneNumber}`);
        console.log(`   Type: ${type}`);
        console.log(`   Message ID: ${result.id || 'N/A'}`);

        // Log to database
        await storage.createWhatsappMessage({
          phoneNumber,
          message: text,
          status: 'sent',
          type,
          customerId: null
        });

        return {
          success: true,
          messageId: result.id || `wati_${Date.now()}`
        };
      } else {
        console.error('WATI API Error:', result);
        return {
          success: false,
          error: result.message || 'Failed to send message via WATI'
        };
      }
    } catch (error) {
      console.error('Failed to send WATI message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Send broadcast message to multiple recipients
  async sendBroadcastMessage(phoneNumbers: string[], message: string) {
    if (!this.isConfigured) {
      return {
        successCount: 0,
        failureCount: phoneNumbers.length,
        error: 'WATI not configured'
      };
    }

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    for (const phoneNumber of phoneNumbers) {
      const result = await this.sendMessage(phoneNumber, message, 'broadcast');
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      results.push({ phoneNumber, ...result });
      
      // Add small delay between messages to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`📊 Broadcast completed: ${successCount} sent, ${failureCount} failed`);

    return {
      successCount,
      failureCount,
      results
    };
  }
}

export const watiService = new WatiService();