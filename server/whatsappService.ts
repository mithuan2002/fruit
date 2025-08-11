import { storage } from './storage';
import type { InsertWhatsappMessage, Customer } from '@shared/schema';

class WhatsAppService {
  private isConnected = false;
  private businessNumber = '';
  private businessName = '';

  constructor() {
    console.log('WhatsApp Service initializing...');
    console.log('📱 WhatsApp Service ready for configuration');
    console.log('💡 To register your shop WhatsApp number, use the frontend interface');
  }

  // Register business WhatsApp number
  registerBusinessNumber(phoneNumber: string, businessName: string = 'Your Shop') {
    // Format and validate phone number
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    if (cleanNumber.length < 10) {
      throw new Error('Invalid phone number format');
    }
    
    this.businessNumber = cleanNumber;
    this.businessName = businessName;
    this.isConnected = true;
    
    console.log(`✅ Business WhatsApp registered: ${this.businessNumber} (${this.businessName})`);
    console.log('📱 This number will be shown as the sender for all automated messages');
    
    return {
      success: true,
      businessNumber: this.businessNumber,
      businessName: this.businessName
    };
  }

  // Unregister business number
  unregisterBusiness() {
    console.log('📱 Unregistering business WhatsApp...');
    this.businessNumber = '';
    this.businessName = '';
    this.isConnected = false;
    
    return { success: true };
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      businessNumber: this.businessNumber,
      businessName: this.businessName
    };
  }

  // Send a WhatsApp message (educational simulation)
  async sendMessage(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConnected) {
      return {
        success: false,
        error: 'WhatsApp business number not registered. Please register your business number first.'
      };
    }

    try {
      // Simulate message sending with educational logging
      const messageId = `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`📤 [EDUCATIONAL] WhatsApp message simulation:`);
      console.log(`   From: ${this.businessNumber} (${this.businessName})`);
      console.log(`   To: ${phoneNumber}`);
      console.log(`   Message: ${message}`);
      console.log(`   Message ID: ${messageId}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Log to database
      await storage.createWhatsappMessage({
        phoneNumber,
        message,
        status: 'sent',
        type: 'automated',
        customerId: null
      });

      return {
        success: true,
        messageId
      };
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Send broadcast messages
  async sendBroadcastMessage(phoneNumbers: string[], message: string) {
    if (!this.isConnected) {
      return {
        successCount: 0,
        failureCount: phoneNumbers.length,
        results: phoneNumbers.map(phone => ({
          phoneNumber: phone,
          success: false,
          error: 'WhatsApp business number not registered'
        }))
      };
    }

    console.log(`📤 [EDUCATIONAL] WhatsApp broadcast simulation to ${phoneNumbers.length} recipients`);
    
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const phoneNumber of phoneNumbers) {
      const result = await this.sendMessage(phoneNumber, message);
      
      results.push({
        phoneNumber,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      successCount,
      failureCount,
      results
    };
  }
}

// Create and export service instance
export const whatsappService = new WhatsAppService();

// Helper functions for automated messaging
export async function triggerWelcomeMessage(customer: Customer, couponCode: string) {
  const message = `🎉 Welcome to ${whatsappService.getConnectionStatus().businessName || 'our store'}! Thank you for your purchase. Your referral code is: ${couponCode}. Share it with friends and family to earn special rewards!`;
  
  const result = await whatsappService.sendMessage(customer.phoneNumber, message);
  
  if (result.success) {
    console.log(`✅ Welcome WhatsApp sent to ${customer.name} (${customer.phoneNumber})`);
    
    // Log to database
    await storage.createWhatsappMessage({
      customerId: customer.id,
      phoneNumber: customer.phoneNumber,
      message,
      type: 'welcome_referral',
      status: 'sent'
    });
  } else {
    console.error(`❌ Failed to send welcome WhatsApp to ${customer.name}: ${result.error}`);
  }
}

export async function triggerCouponMessage(customer: Customer, couponCode: string, value: number) {
  const message = `🎫 New coupon generated! Your referral code: ${couponCode} (Value: $${value}). Share this code with friends to earn points and rewards!`;
  
  const result = await whatsappService.sendMessage(customer.phoneNumber, message);
  
  if (result.success) {
    console.log(`✅ Coupon WhatsApp sent to ${customer.name} (${customer.phoneNumber})`);
    
    // Log to database
    await storage.createWhatsappMessage({
      customerId: customer.id,
      phoneNumber: customer.phoneNumber,
      message,
      type: 'coupon_generated',
      status: 'sent'
    });
  } else {
    console.error(`❌ Failed to send coupon WhatsApp to ${customer.name}: ${result.error}`);
  }
}