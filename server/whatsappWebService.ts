
import puppeteer, { Browser, Page } from 'puppeteer';
import { storage } from './storage';
import { execSync } from 'child_process';

class WhatsAppWebService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isConnected: boolean = false;
  private isInitializing: boolean = false;
  private demoOwnerPhone: string = '+919600267509';
  private businessName: string = 'Demo Shop';

  constructor() {
    console.log('🤖 WhatsApp Web Service initializing...');
    console.log('📱 Real-time WhatsApp automation mode');
  }

  private findChromiumExecutable(): string {
    try {
      // Try to find chromium in various locations
      const possiblePaths = [
        '/nix/store/*/bin/chromium',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome',
        'chromium',
        'google-chrome'
      ];

      for (const path of possiblePaths) {
        try {
          if (path.includes('*')) {
            // Use find command for nix store paths
            const result = execSync(`find /nix/store -name chromium -type f -executable 2>/dev/null | head -1`, { encoding: 'utf8' }).trim();
            if (result) return result;
          } else {
            execSync(`which ${path}`, { encoding: 'utf8' });
            return path;
          }
        } catch {
          continue;
        }
      }

      console.log('⚠️ No Chromium executable found, using Puppeteer default');
      return '';
    } catch (error) {
      console.log('⚠️ Error finding Chromium, using Puppeteer default');
      return '';
    }
  }

  async initialize(): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    if (this.isInitializing) {
      return { success: false, error: 'Already initializing' };
    }

    try {
      this.isInitializing = true;
      console.log('🚀 Starting WhatsApp Web automation...');

      const chromiumPath = this.findChromiumExecutable();
      console.log(`🔍 Using Chromium at: ${chromiumPath || 'default'}`);

      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: chromiumPath || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--no-first-run',
          '--disable-infobars',
          '--window-size=1200,800',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--single-process',
          '--no-zygote'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set a realistic user agent
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set viewport
      await this.page.setViewport({ width: 1200, height: 800 });

      console.log('📱 Opening WhatsApp Web...');
      await this.page.goto('https://web.whatsapp.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });

      console.log('⏳ Waiting for page to fully load...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check page content to debug loading issues
      const title = await this.page.title();
      console.log(`📄 Page title: ${title}`);

      try {
        console.log('🔍 Looking for QR code or login state...');

        // Give more time and check multiple states
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          attempts++;
          console.log(`🔄 Attempt ${attempts}/${maxAttempts} - Checking page state...`);

          // Check if already logged in
          const loggedInElement = await this.page.$('[data-testid="chat-list"], [data-testid="side"], div[data-testid="default-user"], .two._aigs');
          if (loggedInElement) {
            this.isConnected = true;
            console.log('✅ WhatsApp Web already connected');
            return { success: true };
          }

          // Look for QR code with more selectors
          const qrSelectors = [
            'canvas[aria-label="Scan me!"]',
            'canvas[aria-label*="scan"]', 
            'div[data-testid="qr-canvas"] canvas',
            'canvas',
            'div[data-ref] canvas',
            '.landing-wrapper canvas'
          ];

          let qrElement = null;
          for (const selector of qrSelectors) {
            const elements = await this.page.$$(selector);
            for (const element of elements) {
              // Check if canvas has actual content
              const box = await element.boundingBox();
              if (box && box.width > 50 && box.height > 50) {
                qrElement = element;
                console.log(`📷 Found QR code canvas with selector: ${selector} (${box.width}x${box.height})`);
                break;
              }
            }
            if (qrElement) break;
          }

          if (qrElement) {
            console.log('📸 Capturing QR code...');
            // Wait a bit more for QR to fully render
            await new Promise(resolve => setTimeout(resolve, 3000));

            try {
              const qrCodeBase64 = await qrElement.screenshot({
                encoding: 'base64',
                type: 'png'
              });

              if (qrCodeBase64 && qrCodeBase64.length > 1000) {
                console.log(`✅ QR code captured successfully (${qrCodeBase64.length} chars)`);
                return { success: true, qrCode: `data:image/png;base64,${qrCodeBase64}` };
              } else {
                console.log('⚠️ QR code image seems too small, retrying...');
              }
            } catch (screenshotError) {
              console.error('❌ Screenshot failed:', screenshotError);
            }
          }

          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log('❌ Could not find QR code after all attempts');
        return { success: true, qrCode: null };

      } catch (error) {
        console.error('❌ Error during QR code detection:', error);
        return { success: true, qrCode: null };
      }
    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp Web:', error);
      await this.cleanup();
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      this.isInitializing = false;
    }
  }

  async waitForConnection(): Promise<boolean> {
    if (!this.page) return false;

    try {
      console.log('⏳ Waiting for WhatsApp Web connection...');
      
      // Check if already connected by looking for chat interface
      const isAlreadyConnected = await this.page.$('[data-testid="chat-list"], [data-testid="side"], div[data-testid="default-user"]');
      
      if (isAlreadyConnected) {
        this.isConnected = true;
        console.log('✅ WhatsApp Web already connected');
        return true;
      }
      
      // Wait for the main interface to appear (multiple possible selectors)
      await Promise.race([
        this.page.waitForSelector('[data-testid="chat-list"]', { timeout: 60000 }),
        this.page.waitForSelector('[data-testid="side"]', { timeout: 60000 }),
        this.page.waitForSelector('div[data-testid="default-user"]', { timeout: 60000 })
      ]);

      this.isConnected = true;
      console.log('✅ WhatsApp Web connected and ready for messaging');
      return true;
    } catch (error) {
      console.error('❌ Connection timeout or failed');
      return false;
    }
  }

  async sendMessage(phoneNumber: string, message: string, type: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`📤 sendMessage called for ${phoneNumber} (connected: ${this.isConnected})`);
    
    if (!this.isConnected || !this.page) {
      console.log('❌ WhatsApp Web not connected, logging to database only');
      
      // Still log the message attempt to database
      await storage.createWhatsappMessage({
        phoneNumber,
        message,
        status: 'failed',
        type,
        customerId: null
      });
      
      return { success: false, error: 'WhatsApp Web not connected' };
    }

    try {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      console.log(`📤 Attempting to send real WhatsApp message to ${phoneNumber} (clean: ${cleanPhone})...`);

      // Check current page status
      const currentUrl = this.page.url();
      console.log(`📍 Current page URL: ${currentUrl}`);

      // Use WhatsApp Web send URL
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      console.log(`🔗 Navigating to: ${whatsappUrl}`);
      
      // Navigate to the send URL
      await this.page.goto(whatsappUrl, { 
        waitUntil: 'networkidle2',
        timeout: 20000 
      });

      console.log('⏳ Page loaded, waiting for elements...');
      
      // Wait for the page to load and message to appear
      await new Promise(resolve => setTimeout(resolve, 5000));

      try {
        // Check if we're still on WhatsApp Web (not logged out)
        const pageContent = await this.page.content();
        if (pageContent.includes('Phone number shared via url is invalid') || pageContent.includes('invalid phone number')) {
          throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }

        // Wait for message composition area or error message
        const elementFound = await Promise.race([
          this.page.waitForSelector('[data-testid="conversation-compose-box-input"], [data-testid="msg-container"], textarea[data-tab="10"]', { timeout: 15000 }).then(() => 'compose'),
          this.page.waitForSelector('canvas[aria-label*="scan"], canvas[aria-label="Scan me!"]', { timeout: 15000 }).then(() => 'qr')
        ]);

        if (elementFound === 'qr') {
          throw new Error('WhatsApp Web requires QR code scan - not connected');
        }
        
        console.log('📝 Found message composition area');
        
        // Wait a bit more for message to populate
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Look for send button and click it
        const sendButtonSelectors = [
          '[data-testid="send-button"]',
          'button[aria-label="Send"]',
          'span[data-testid="send"]',
          'button span[data-icon="send"]',
          '[data-tab="11"]'
        ];

        let sendButton = null;
        for (const selector of sendButtonSelectors) {
          sendButton = await this.page.$(selector);
          if (sendButton) {
            console.log(`🎯 Found send button with selector: ${selector}`);
            break;
          }
        }

        if (sendButton) {
          // Click the send button
          await sendButton.click();
          console.log(`✅ Clicked send button for ${phoneNumber}`);

          // Wait to confirm sending
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Log successful message to database
          await storage.createWhatsappMessage({
            phoneNumber,
            message,
            status: 'sent',
            type,
            customerId: null
          });

          console.log(`✅ Real WhatsApp message sent and logged for ${phoneNumber}`);
          return { success: true, messageId: `real_wp_${Date.now()}` };
        } else {
          console.log('❌ Send button not found, checking page state...');
          const currentContent = await this.page.content();
          console.log(`📄 Page title: ${await this.page.title()}`);
          throw new Error('Send button not found - message may not have loaded properly');
        }

      } catch (buttonError) {
        console.error('❌ Failed to find/click send button:', buttonError);
        throw new Error(`Could not send message - UI elements not found: ${buttonError.message}`);
      }

    } catch (error) {
      console.error(`❌ Failed to send real WhatsApp message to ${phoneNumber}:`, error);

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

    console.log(`🎊 Sending real welcome message to ${customerPhone}`);
    return this.sendMessage(customerPhone, message, 'welcome_referral');
  }

  async sendPointsEarnedMessage(customerPhone: string, customerName: string, pointsEarned: number) {
    const message = `🎊 Great news ${customerName}!

You've earned *${pointsEarned} points* from your recent referral!

Your total points are now available for redemption. Keep referring friends to earn more rewards!

Thank you for being part of ${this.businessName}! 🌟`;

    console.log(`🎯 Sending real points earned message to ${customerPhone}`);
    return this.sendMessage(customerPhone, message, 'points_earned');
  }

  async sendPointsRedeemedMessage(customerPhone: string, customerName: string, pointsRedeemed: number) {
    const message = `✅ Points Redeemed Successfully!

Hi ${customerName}, you've successfully redeemed *${pointsRedeemed} points*!

Your reward is being processed. Keep shopping and referring friends to earn more points!

Thanks for choosing ${this.businessName}! 🎁`;

    console.log(`🎁 Sending real points redeemed message to ${customerPhone}`);
    return this.sendMessage(customerPhone, message, 'points_redeemed');
  }

  async sendBroadcastMessage(phoneNumbers: string[], message: string) {
    let successCount = 0;
    let failureCount = 0;
    const results = [];

    console.log(`📢 Starting real WhatsApp broadcast to ${phoneNumbers.length} recipients...`);

    for (const phoneNumber of phoneNumbers) {
      console.log(`📤 Broadcasting to ${phoneNumber}...`);
      
      const result = await this.sendMessage(phoneNumber, message, 'broadcast');
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      results.push({ phoneNumber, ...result });

      // Add delay between messages to avoid being blocked (important for real messaging)
      console.log('⏳ Waiting 5 seconds before next message...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`📊 Real broadcast completed: ${successCount} sent, ${failureCount} failed`);

    return {
      successCount,
      failureCount,
      results
    };
  }

  async getCurrentQRCode(): Promise<string | null> {
    if (!this.page || this.isConnected) return null;

    try {
      console.log('🔍 Fetching current QR code...');

      // Try multiple selectors for QR code
      const qrSelectors = [
        'canvas[aria-label="Scan me!"]',
        'canvas[aria-label*="scan"]',
        'div[data-testid="qr-canvas"] canvas',
        'canvas',
        'div[data-ref] canvas',
        '.landing-wrapper canvas'
      ];

      for (const selector of qrSelectors) {
        const elements = await this.page.$$(selector);
        for (const element of elements) {
          try {
            // Check if canvas has content
            const box = await element.boundingBox();
            if (box && box.width > 50 && box.height > 50) {
              console.log(`📷 Capturing fresh QR code with selector: ${selector}`);
              const qrCodeBase64 = await element.screenshot({
                encoding: 'base64',
                type: 'png'
              });
              
              if (qrCodeBase64 && qrCodeBase64.length > 1000) {
                console.log(`✅ Fresh QR code captured (${qrCodeBase64.length} chars)`);
                return `data:image/png;base64,${qrCodeBase64}`;
              }
            }
          } catch (err) {
            console.log(`⚠️ Error with element ${selector}:`, err.message);
            continue;
          }
        }
      }

      console.log('📷 No valid QR code element found');
      return null;
    } catch (error) {
      console.error('❌ Error capturing QR code:', error);
      return null;
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      businessNumber: this.demoOwnerPhone,
      businessName: this.businessName,
      configured: true,
      demoMode: false, // Real messaging mode
      automationType: 'Real WhatsApp Web Automation'
    };
  }

  private async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  async disconnect() {
    await this.cleanup();
    this.isConnected = false;
    console.log('🔌 WhatsApp Web disconnected');
  }
}

export const whatsappWebService = new WhatsAppWebService();
