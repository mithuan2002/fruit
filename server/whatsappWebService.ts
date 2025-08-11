
import puppeteer, { Browser, Page } from 'puppeteer';
import { storage } from './storage';

class WhatsAppWebService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isConnected: boolean = false;
  private isInitializing: boolean = false;
  private demoOwnerPhone: string = '+919600267509';
  private businessName: string = 'Demo Shop';

  constructor() {
    console.log('🤖 WhatsApp Web Service initializing...');
    console.log('📱 Demo mode with Puppeteer automation');
  }

  async initialize(): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    if (this.isInitializing) {
      return { success: false, error: 'Already initializing' };
    }

    try {
      this.isInitializing = true;
      console.log('🚀 Starting WhatsApp Web automation...');

      this.browser = await puppeteer.launch({
        headless: false, // Show browser for QR code scanning
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log('📱 Opening WhatsApp Web...');
      await this.page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2' });

      // Wait for QR code or main interface
      try {
        await this.page.waitForSelector('canvas[aria-label="Scan me!"]', { timeout: 10000 });
        console.log('📷 QR Code appeared - please scan with your phone (+919600267509)');
        return { success: true, qrCode: 'QR Code displayed in browser window' };
      } catch (error) {
        // Maybe already logged in
        try {
          await this.page.waitForSelector('[data-testid="chat-list"]', { timeout: 5000 });
          this.isConnected = true;
          console.log('✅ WhatsApp Web connected successfully');
          return { success: true };
        } catch (innerError) {
          throw new Error('Failed to connect to WhatsApp Web');
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp Web:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      this.isInitializing = false;
    }
  }

  async waitForConnection(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Wait for the main chat interface to appear
      await this.page.waitForSelector('[data-testid="chat-list"]', { timeout: 60000 });
      this.isConnected = true;
      console.log('✅ WhatsApp Web connected and ready');
      return true;
    } catch (error) {
      console.error('❌ Connection timeout');
      return false;
    }
  }

  async sendMessage(phoneNumber: string, message: string, type: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConnected || !this.page) {
      return { success: false, error: 'WhatsApp Web not connected' };
    }

    try {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      
      console.log(`📤 Sending WhatsApp message to ${phoneNumber}...`);
      
      // Navigate to send message URL
      await this.page.goto(whatsappUrl, { waitUntil: 'networkidle2' });
      
      // Wait for message input box and send button
      await this.page.waitForSelector('[data-testid="msg-container"]', { timeout: 15000 });
      
      // Wait a moment for the message to load in the input
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click send button
      const sendButton = await this.page.$('[data-testid="send-button"]');
      if (sendButton) {
        await sendButton.click();
        console.log(`✅ Message sent to ${phoneNumber}`);
        
        // Log to database
        await storage.createWhatsappMessage({
          phoneNumber,
          message,
          status: 'sent',
          type,
          customerId: null
        });

        return { success: true, messageId: `wp_${Date.now()}` };
      } else {
        throw new Error('Send button not found');
      }
    } catch (error) {
      console.error(`❌ Failed to send message to ${phoneNumber}:`, error);
      
      // Log failed message to database
      await storage.createWhatsappMessage({
        phoneNumber,
        message,
        status: 'failed',
        type,
        customerId: null
      });

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async sendWelcomeMessage(customerPhone: string, customerName: string, couponCode: string) {
    const message = `🎉 Hi ${customerName}! Welcome to ${this.businessName}! 

Thank you for shopping with us. Here's your referral code: *${couponCode}*

Share this code with friends and family to earn points and rewards!

Happy shopping! 🛍️`;

    return this.sendMessage(customerPhone, message, 'welcome_referral');
  }

  async sendPointsEarnedMessage(customerPhone: string, customerName: string, pointsEarned: number) {
    const message = `🎊 Great news ${customerName}! 

You've earned *${pointsEarned} points* from your recent referral! 

Your total points are now available for redemption. Keep referring friends to earn more rewards!

Thank you for being part of ${this.businessName}! 🌟`;

    return this.sendMessage(customerPhone, message, 'points_earned');
  }

  async sendPointsRedeemedMessage(customerPhone: string, customerName: string, pointsRedeemed: number) {
    const message = `✅ Points Redeemed Successfully!

Hi ${customerName}, you've successfully redeemed *${pointsRedeemed} points*!

Your reward is being processed. Keep shopping and referring friends to earn more points!

Thanks for choosing ${this.businessName}! 🎁`;

    return this.sendMessage(customerPhone, message, 'points_redeemed');
  }

  async sendBroadcastMessage(phoneNumbers: string[], message: string) {
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
      
      // Add delay between messages to avoid being blocked
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log(`📊 Broadcast completed: ${successCount} sent, ${failureCount} failed`);

    return {
      successCount,
      failureCount,
      results
    };
  }

  getStatus() {
    return {
      connected: this.isConnected,
      businessNumber: this.demoOwnerPhone,
      businessName: this.businessName,
      configured: true,
      demoMode: true,
      automationType: 'WhatsApp Web + Puppeteer'
    };
  }

  async disconnect() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isConnected = false;
      console.log('🔌 WhatsApp Web disconnected');
    }
  }
}

export const whatsappWebService = new WhatsAppWebService();
