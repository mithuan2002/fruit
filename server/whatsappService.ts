import { storage } from './storage';
import type { InsertWhatsappMessage, Customer } from '@shared/schema';

// Dynamic imports for WhatsApp Web.js and QR Terminal
let Client: any, LocalAuth: any, qrcode: any;

async function initializeModules() {
  try {
    const whatsappModule = await import('whatsapp-web.js');
    Client = whatsappModule.Client;
    LocalAuth = whatsappModule.LocalAuth;
    qrcode = await import('qrcode-terminal');
  } catch (error) {
    console.error('Failed to load WhatsApp modules:', error);
  }
}

class WhatsAppService {
  private client: Client | null = null;
  private isConnected = false;
  private isInitializing = false;
  private businessNumber = '';

  constructor() {
    initializeModules().then(() => {
      this.initializeClient();
    });
  }

  private async initializeClient() {
    if (this.isInitializing || !Client || !LocalAuth) return;
    this.isInitializing = true;

    try {
      // Create WhatsApp client with local authentication
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'fruitbox-automation'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      // Event listeners
      this.client.on('qr', (qrCode) => {
        console.log('\n=== WhatsApp QR Code ===');
        console.log('Scan this QR code with your WhatsApp to connect your business account:');
        if (qrcode && qrcode.generate) {
          qrcode.generate(qrCode, { small: true });
        } else {
          console.log('QR Code:', qrCode);
        }
        console.log('========================\n');
      });

      this.client.on('ready', async () => {
        console.log('✅ WhatsApp Client is ready!');
        this.isConnected = true;
        
        // Get business number
        const info = this.client?.info;
        if (info) {
          this.businessNumber = info.wid.user;
          console.log(`📱 Business WhatsApp Number: ${this.businessNumber}`);
        }
      });

      this.client.on('authenticated', () => {
        console.log('✅ WhatsApp Client authenticated');
      });

      this.client.on('auth_failure', (msg) => {
        console.error('❌ WhatsApp authentication failed:', msg);
        this.isConnected = false;
      });

      this.client.on('disconnected', (reason) => {
        console.log('❌ WhatsApp Client disconnected:', reason);
        this.isConnected = false;
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          this.reconnect();
        }, 5000);
      });

      this.client.on('message_create', (message) => {
        // Handle incoming messages if needed
        if (message.fromMe) return;
        console.log(`📨 Received message from ${message.from}: ${message.body}`);
      });

      // Initialize the client
      await this.client.initialize();
      
    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp client:', error);
      this.isConnected = false;
    }
    
    this.isInitializing = false;
  }

  private async reconnect() {
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        console.error('Error destroying client:', error);
      }
    }
    this.client = null;
    this.isConnected = false;
    this.isInitializing = false;
    
    // Reinitialize after a short delay
    setTimeout(() => {
      this.initializeClient();
    }, 2000);
  }

  async sendMessage(phoneNumber: string, message: string, type: string = 'broadcast'): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.isConnected || !this.client) {
        return {
          success: false,
          error: 'WhatsApp client not connected. Please scan QR code to connect.'
        };
      }

      // Format phone number (ensure it has country code)
      let formattedNumber = phoneNumber.replace(/[^\d+]/g, '');
      if (!formattedNumber.startsWith('+')) {
        // Add default country code if not present (using +1 for US, adjust as needed)
        formattedNumber = '+1' + formattedNumber.replace(/^\+?1?/, '');
      }
      
      // Convert to WhatsApp format (remove + and add @c.us)
      const chatId = formattedNumber.substring(1) + '@c.us';

      console.log(`📤 Sending WhatsApp message to ${formattedNumber}...`);

      // Send message
      const sentMessage = await this.client.sendMessage(chatId, message);
      
      // Create message record in database
      await storage.createWhatsappMessage({
        phoneNumber: formattedNumber,
        message,
        type: type as any,
        status: 'sent',
        customerId: null
      });

      console.log(`✅ WhatsApp message sent successfully. ID: ${sentMessage.id.id}`);
      
      return {
        success: true,
        messageId: sentMessage.id.id
      };

    } catch (error) {
      console.error('❌ Failed to send WhatsApp message:', error);
      
      // Log failed message to database
      await storage.createWhatsappMessage({
        phoneNumber,
        message,
        type: type as any,
        status: 'failed',
        customerId: null
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp message'
      };
    }
  }

  async sendWelcomeMessage(customer: Customer, couponCode?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let message = `🎉 Welcome to our referral program, ${customer.name}!`;
    
    if (couponCode) {
      message += `\n\n🎁 Your exclusive coupon code: *${couponCode}*`;
      message += `\n💰 Use this code to get special discounts on your purchases!`;
    }
    
    message += `\n\n📱 Share your referral link with friends and earn rewards for every successful referral!`;
    message += `\n\n💎 Current points: ${customer.points}`;
    message += `\n🏆 Total referrals: ${customer.totalReferrals}`;
    
    return await this.sendMessage(customer.phoneNumber, message, 'welcome_referral');
  }

  async sendCouponMessage(customer: Customer, couponCode: string, value: number): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `🎉 Congratulations ${customer.name}!

🎁 You've earned a new coupon: *${couponCode}*
💰 Value: $${value}

✨ Use this code for your next purchase and save money!

📊 Your Stats:
💎 Current points: ${customer.points}
🏆 Total referrals: ${customer.totalReferrals}

Keep referring friends to earn more rewards! 🚀`;

    return await this.sendMessage(customer.phoneNumber, message, 'coupon_generated');
  }

  async sendRewardMessage(customer: Customer, points: number): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `🎉 Great news ${customer.name}!

💎 You've earned ${points} reward points!
📊 Total points: ${customer.points}
🏆 Total referrals: ${customer.totalReferrals}

Keep up the great work! Share your referral link with more friends to earn even more rewards! 🚀`;

    return await this.sendMessage(customer.phoneNumber, message, 'reward_earned');
  }

  async sendBroadcastMessage(phoneNumbers: string[], message: string): Promise<{ successCount: number; failureCount: number; results: Array<{ phoneNumber: string; success: boolean; error?: string }> }> {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const phoneNumber of phoneNumbers) {
      const result = await this.sendMessage(phoneNumber, message, 'broadcast');
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      results.push({
        phoneNumber,
        success: result.success,
        error: result.error
      });

      // Add small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { successCount, failureCount, results };
  }

  getConnectionStatus(): { connected: boolean; businessNumber: string } {
    return {
      connected: this.isConnected,
      businessNumber: this.businessNumber
    };
  }

  async getMessageStats(): Promise<{
    totalSent: number;
    totalFailed: number;
    todaySent: number;
    recentMessages: Array<{ phoneNumber: string; message: string; status: string; sentAt: Date; type: string }>;
  }> {
    const messages = await storage.getAllWhatsappMessages();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalSent = messages.filter(msg => msg.status === 'sent').length;
    const totalFailed = messages.filter(msg => msg.status === 'failed').length;
    const todaySent = messages.filter(msg => 
      msg.status === 'sent' && 
      msg.sentAt && 
      new Date(msg.sentAt) >= today
    ).length;

    const recentMessages = messages
      .sort((a, b) => new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime())
      .slice(0, 10)
      .map(msg => ({
        phoneNumber: msg.phoneNumber,
        message: msg.message.substring(0, 50) + (msg.message.length > 50 ? '...' : ''),
        status: msg.status,
        sentAt: msg.sentAt!,
        type: msg.type
      }));

    return {
      totalSent,
      totalFailed,
      todaySent,
      recentMessages
    };
  }
}

// Create singleton instance
export const whatsappService = new WhatsAppService();

// Automated message sending when new customer is added
export async function triggerWelcomeMessage(customer: Customer, couponCode?: string): Promise<void> {
  try {
    console.log(`🤖 Auto-triggering welcome message for customer: ${customer.name} (${customer.phoneNumber})`);
    
    // Small delay to ensure everything is saved
    setTimeout(async () => {
      const result = await whatsappService.sendWelcomeMessage(customer, couponCode);
      
      if (result.success) {
        console.log(`✅ Welcome message sent automatically to ${customer.name}`);
      } else {
        console.error(`❌ Failed to send automatic welcome message to ${customer.name}: ${result.error}`);
      }
    }, 2000); // 2 second delay
    
  } catch (error) {
    console.error('❌ Error in automatic welcome message trigger:', error);
  }
}

export async function triggerCouponMessage(customer: Customer, couponCode: string, value: number): Promise<void> {
  try {
    console.log(`🤖 Auto-triggering coupon message for customer: ${customer.name}`);
    
    setTimeout(async () => {
      const result = await whatsappService.sendCouponMessage(customer, couponCode, value);
      
      if (result.success) {
        console.log(`✅ Coupon message sent automatically to ${customer.name}`);
      } else {
        console.error(`❌ Failed to send automatic coupon message to ${customer.name}: ${result.error}`);
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error in automatic coupon message trigger:', error);
  }
}