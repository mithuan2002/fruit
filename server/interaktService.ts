
import axios from 'axios';

export interface InteraktConfig {
  apiKey: string;
  apiUrl: string;
  phoneNumber: string;
  businessName: string;
}

export interface InteraktMessage {
  to: string;
  type: 'text' | 'template';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

export interface InteraktResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class InteraktService {
  private apiKey: string = '';
  private apiUrl: string = 'https://api.interakt.ai/v1/public';
  private phoneNumber: string = '';
  private businessName: string = '';
  private isConfigured: boolean = false;

  constructor() {
    // Auto-configure if environment variables are available
    if (process.env.INTERAKT_API_TOKEN) {
      this.configure({
        apiKey: process.env.INTERAKT_API_TOKEN,
        apiUrl: process.env.INTERAKT_API_URL || 'https://api.interakt.ai/v1/public',
        phoneNumber: process.env.INTERAKT_BUSINESS_NUMBER || '',
        businessName: process.env.INTERAKT_BUSINESS_NAME || 'Your Business'
      });
    }
  }

  configure(config: InteraktConfig): boolean {
    try {
      this.apiKey = config.apiKey;
      this.apiUrl = config.apiUrl;
      this.phoneNumber = config.phoneNumber;
      this.businessName = config.businessName;
      this.isConfigured = true;
      console.log('✅ Interakt service configured successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to configure Interakt service:', error);
      return false;
    }
  }

  getConfig(): InteraktConfig {
    return {
      apiKey: this.apiKey ? '***' : '',
      apiUrl: this.apiUrl,
      phoneNumber: this.phoneNumber,
      businessName: this.businessName
    };
  }

  isReady(): boolean {
    return this.isConfigured && !!this.apiKey && !!this.phoneNumber;
  }

  async sendMessage(message: InteraktMessage): Promise<InteraktResponse> {
    if (!this.isReady()) {
      throw new Error('Interakt service not configured properly');
    }

    // Enhanced phone number cleaning and formatting
    const cleanPhone = message.to.replace(/[^\d]/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    
    console.log(`💬 Sending message to ${formattedPhone}: ${message.text?.body?.substring(0, 50)}...`);

    try {
      const messageData = {
        event: 'text_message',
        phoneNumber: formattedPhone,
        countryCode: "91",
        callbackData: 'fruitbox_message',
        type: 'Text',
        message: message.text?.body || 'Hello from Fruitbox!'
      };

      console.log(`📤 Sending message data to Interakt:`, {
        ...messageData,
        message: messageData.message.substring(0, 100) + '...'
      });

      const response = await axios.post(
        `${this.apiUrl}/track/events/`,
        messageData,
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 second timeout
        }
      );

      console.log('✅ Interakt message sent successfully:', {
        messageId: response.data.id || response.data.messageId,
        status: response.status
      });
      
      return {
        success: true,
        messageId: response.data.id || response.data.messageId || 'message_sent'
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      
      console.error(`❌ Failed to send message to ${formattedPhone}:`, {
        error: errorMessage,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Check for specific error about phone number not existing
      if (errorMessage && errorMessage.includes("phoneNumber doesn't exists")) {
        return {
          success: false,
          error: `Phone number ${formattedPhone} not found in Interakt contacts. Contact creation may have failed.`
        };
      }
      
      return {
        success: false,
        error: errorMessage || 'Unknown error occurred'
      };
    }
  }

  async sendTextMessage(phoneNumber: string, text: string): Promise<InteraktResponse> {
    return this.sendMessage({
      to: phoneNumber,
      type: 'text',
      text: { body: text }
    });
  }

  async sendTemplateMessage(phoneNumber: string, templateName: string, components?: any[]): Promise<InteraktResponse> {
    return this.sendMessage({
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components
      }
    });
  }

  // Predefined message templates
  async sendWelcomeMessage(phoneNumber: string, customerName: string, referralCode: string, eCouponCode?: string): Promise<InteraktResponse> {
    let message = `🎉 Welcome to ${this.businessName}, ${customerName}!\n\n✨ Your Personal E-Coupon ✨\n\n🏪 Shop: ${this.businessName}\n👤 For: ${customerName}\n🎫 Code: *${referralCode}*\n\n💝 Thank you for your referral!\n\nThis is your exclusive referral code that also works as your personal e-coupon!`;
    
    message += `\n\n💰 How it works:\n• Share your code with friends\n• They make a purchase using *${referralCode}*\n• You earn reward points!\n• Use the same code for your own discounts!\n\n🚀 Start referring and earning today!\n\nSave this message - your code is always here when you need it! 📱`;
    
    return this.sendTextMessage(phoneNumber, message);
  }

  async sendPointsEarnedMessage(phoneNumber: string, customerName: string, pointsEarned: number, totalPoints: number): Promise<InteraktResponse> {
    const message = `🎊 Congratulations ${customerName}!\n\nYou've earned *${pointsEarned} points* from a successful referral!\n\n💎 Total Points: ${totalPoints}\n\nKeep sharing your referral code to earn more rewards!\n\nThank you for being a valued customer! ❤️`;
    
    return this.sendTextMessage(phoneNumber, message);
  }

  async sendPointsRedeemedMessage(phoneNumber: string, customerName: string, pointsRedeemed: number, remainingPoints: number, reward: string): Promise<InteraktResponse> {
    const message = `✅ Points Redeemed Successfully!\n\nHi ${customerName},\n\n🎁 You've redeemed *${pointsRedeemed} points* for: ${reward}\n\n💎 Remaining Points: ${remainingPoints}\n\nEnjoy your reward and keep earning more points by referring friends!\n\nThank you for choosing ${this.businessName}! 🙏`;
    
    return this.sendTextMessage(phoneNumber, message);
  }

  async sendBroadcastMessage(phoneNumbers: string[], message: string): Promise<{ total: number; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await this.sendTextMessage(phoneNumber, message);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
      }
    }

    return { total: phoneNumbers.length, sent, failed };
  }

  // Create contact using Interakt's Contact API
  async createContact(phoneNumber: string, customerName: string, email?: string): Promise<InteraktResponse> {
    if (!this.isReady()) {
      throw new Error('Interakt service not configured properly');
    }

    // Clean and format phone number
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    
    console.log(`📞 Creating contact for ${customerName} (${formattedPhone}) in Interakt`);

    try {
      // First, try to create the contact using Interakt's contact creation API
      const contactData = {
        phoneNumber: formattedPhone,
        countryCode: "91",
        traits: {
          name: customerName,
          email: email || "",
          phone: formattedPhone
        }
      };

      console.log(`📤 Creating contact in Interakt:`, contactData);

      const response = await axios.post(
        `${this.apiUrl}/track/users/`,
        contactData,
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('✅ Contact created successfully in Interakt:', response.status);
      
      return {
        success: true,
        messageId: response.data.id || 'contact_created'
      };
    } catch (error: any) {
      console.error(`❌ Failed to create contact in Interakt:`, {
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      
      // If contact creation fails, return error
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create contact'
      };
    }
  }

  // Get message delivery status
  async getMessageStatus(messageId: string): Promise<any> {
    if (!this.isReady()) {
      throw new Error('Interakt service not configured properly');
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/messages/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get message status:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const interaktService = new InteraktService();
