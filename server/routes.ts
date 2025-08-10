import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCustomerSchema, 
  insertCampaignSchema, 
  insertCouponSchema, 
  insertReferralSchema,
  insertSmsMessageSchema
} from "@shared/schema";
import { z } from "zod";

// SMS Service (Twilio integration)
async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // Use Twilio API
    const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || "default_sid";
    const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN || "default_token";
    const fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM || "+1234567890";

    if (accountSid === "default_sid" || authToken === "default_token") {
      console.log(`SMS would be sent to ${phoneNumber}: ${message}`);
      return true; // Return success for demo purposes when no real credentials
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: phoneNumber,
        Body: message,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Check if phone number already exists
      const existingCustomer = await storage.getCustomerByPhone(validatedData.phoneNumber);
      if (existingCustomer) {
        return res.status(400).json({ message: "Customer with this phone number already exists" });
      }

      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/active", async (req, res) => {
    try {
      const campaigns = await storage.getActiveCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active campaigns" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      // Validate required fields manually first
      const { name, rewardPerReferral, startDate, endDate } = req.body;
      
      if (!name || !rewardPerReferral || !startDate || !endDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create campaign data with proper types
      const campaignData = {
        name: String(name),
        description: req.body.description || null,
        rewardPerReferral: Number(rewardPerReferral),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: req.body.isActive ?? true,
        goalCount: Number(req.body.goalCount) || 100,
      };

      // Validate dates
      if (isNaN(campaignData.startDate.getTime()) || isNaN(campaignData.endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      if (campaignData.endDate <= campaignData.startDate) {
        return res.status(400).json({ message: "End date must be after start date" });
      }

      const campaign = await storage.createCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Campaign creation error:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.body);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  // Coupon routes
  app.get("/api/coupons", async (req, res) => {
    try {
      const coupons = await storage.getAllCoupons();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.get("/api/coupons/active", async (req, res) => {
    try {
      const coupons = await storage.getActiveCoupons();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active coupons" });
    }
  });

  app.post("/api/coupons", async (req, res) => {
    try {
      const validatedData = insertCouponSchema.parse(req.body);
      
      // Check if code already exists
      const existingCoupon = await storage.getCouponByCode(validatedData.code);
      if (existingCoupon) {
        return res.status(400).json({ message: "Coupon code already exists" });
      }

      const coupon = await storage.createCoupon(validatedData);
      res.status(201).json(coupon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create coupon" });
    }
  });

  app.patch("/api/coupons/:id", async (req, res) => {
    try {
      const coupon = await storage.updateCoupon(req.params.id, req.body);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ message: "Failed to update coupon" });
    }
  });

  // Coupon redemption
  app.post("/api/coupons/:code/redeem", async (req, res) => {
    try {
      const { customerId, referredCustomerName, referredCustomerPhone } = req.body;
      
      const coupon = await storage.getCouponByCode(req.params.code);
      if (!coupon || !coupon.isActive) {
        return res.status(404).json({ message: "Invalid or inactive coupon code" });
      }

      if (coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit exceeded" });
      }

      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Create referred customer if provided
      let referredCustomer = null;
      if (referredCustomerName && referredCustomerPhone) {
        const existingReferred = await storage.getCustomerByPhone(referredCustomerPhone);
        if (!existingReferred) {
          referredCustomer = await storage.createCustomer({
            name: referredCustomerName,
            phoneNumber: referredCustomerPhone,
            points: 0,
          });
        } else {
          referredCustomer = existingReferred;
        }
      }

      // Create referral record
      const referral = await storage.createReferral({
        referrerId: customerId,
        referredCustomerId: referredCustomer?.id || null,
        campaignId: coupon.campaignId,
        couponCode: coupon.code,
        pointsEarned: coupon.value,
        status: "completed",
      });

      // Update customer points and referral count
      await storage.updateCustomer(customerId, {
        points: customer.points + coupon.value,
        totalReferrals: customer.totalReferrals + 1,
      });

      // Update coupon usage
      await storage.updateCoupon(coupon.id, {
        usageCount: coupon.usageCount + 1,
      });

      // Update campaign stats if applicable
      if (coupon.campaignId) {
        const campaign = await storage.getCampaign(coupon.campaignId);
        if (campaign) {
          await storage.updateCampaign(coupon.campaignId, {
            referralsCount: campaign.referralsCount + 1,
          });
        }
      }

      // Send SMS notification
      const message = `Congratulations! You've earned ${coupon.value} points for your referral. Your total points: ${customer.points + coupon.value}. Thank you for spreading the word!`;
      const smsSuccess = await sendSMS(customer.phoneNumber, message);
      
      // Log SMS
      await storage.createSmsMessage({
        customerId: customer.id,
        phoneNumber: customer.phoneNumber,
        message,
        type: "reward_earned",
        status: smsSuccess ? "sent" : "failed",
      });

      res.json({ 
        success: true, 
        pointsEarned: coupon.value, 
        totalPoints: customer.points + coupon.value,
        referral 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to redeem coupon" });
    }
  });

  // Referral routes
  app.get("/api/referrals", async (req, res) => {
    try {
      const referrals = await storage.getAllReferrals();
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  app.get("/api/referrals/customer/:customerId", async (req, res) => {
    try {
      const referrals = await storage.getReferralsByCustomer(req.params.customerId);
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer referrals" });
    }
  });

  // SMS routes
  app.get("/api/sms", async (req, res) => {
    try {
      const messages = await storage.getAllSmsMessages();
      res.json(messages.slice(0, 50)); // Return latest 50 messages
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SMS messages" });
    }
  });

  app.post("/api/sms/broadcast", async (req, res) => {
    try {
      const { message, customerIds } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      let customers;
      if (customerIds && customerIds.length > 0) {
        // Send to specific customers
        customers = await Promise.all(
          customerIds.map((id: string) => storage.getCustomer(id))
        );
        customers = customers.filter(Boolean);
      } else {
        // Send to all customers
        customers = await storage.getAllCustomers();
      }

      const results = await Promise.all(
        customers.map(async (customer) => {
          const success = await sendSMS(customer.phoneNumber, message);
          
          // Log SMS
          await storage.createSmsMessage({
            customerId: customer.id,
            phoneNumber: customer.phoneNumber,
            message,
            type: "broadcast",
            status: success ? "sent" : "failed",
          });

          return { customerId: customer.id, success };
        })
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      res.json({ 
        message: "Broadcast completed",
        totalSent: results.length,
        successCount,
        failureCount,
        results 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send broadcast" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/analytics/top-referrers", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topReferrers = await storage.getTopReferrers(limit);
      res.json(topReferrers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top referrers" });
    }
  });

  app.get("/api/analytics/campaign/:id", async (req, res) => {
    try {
      const stats = await storage.getCampaignStats(req.params.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
