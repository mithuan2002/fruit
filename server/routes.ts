import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCustomerSchema,
  insertCampaignSchema,
  insertCouponSchema,
  insertReferralSchema,
  insertWhatsappMessageSchema
} from "@shared/schema";
import { z } from "zod";

// WhatsApp Service Import
import { whatsappService, triggerWelcomeMessage, triggerCouponMessage } from './whatsappService';





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

      // Generate unique coupon code for the new customer
      const couponCode = await storage.generateUniqueCode();

      // Create customer with coupon code
      const customer = await storage.createCustomer({
        ...validatedData,
        couponCode
      });

      // Trigger automated WhatsApp welcome message
      triggerWelcomeMessage(customer, couponCode);

      res.status(201).json({
        customer,
        couponCode,
        whatsappStatus: "queued",
        message: `Customer created successfully. Welcome WhatsApp message will be sent automatically.`
      });
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

  // Update campaign
  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.body);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Failed to update campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Send campaign messages to all customers
  app.post("/api/campaigns/:id/send-messages", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const customers = await storage.getAllCustomers();

      if (customers.length === 0) {
        return res.status(400).json({ error: "No customers found to send messages to" });
      }

      // Prepare WhatsApp broadcast
      const phoneNumbers = customers.map(customer => customer.phoneNumber);
      const personalizedMessage = message.replace(/\[COUPON_CODE\]/g, 'your referral code');

      // Send WhatsApp broadcast
      const results = await whatsappService.sendBroadcastMessage(phoneNumbers, personalizedMessage);

      res.json({
        success: results.successCount > 0,
        totalRecipients: customers.length,
        messagesSent: results.successCount,
        messagesFailed: results.failureCount,
        results: results.results,
        summary: `${results.successCount} WhatsApp messages sent successfully, ${results.failureCount} failed`
      });
    } catch (error) {
      console.error("Failed to send campaign messages:", error);
      res.status(500).json({ error: "Failed to send campaign messages" });
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

  // Generate coupon for customer
  app.post("/api/customers/:id/generate-coupon", async (req, res) => {
    try {
      const { campaignId } = req.body;
      // Generate unique coupon code
      const couponCode = await storage.generateUniqueCode();

      // Create coupon for customer
      const coupon = await storage.createCoupon({
        code: couponCode,
        customerId: req.params.id,
        campaignId: campaignId || null,
        value: 50, // Default value, could be configurable
        usageLimit: 100,
        isActive: true,
      });

      // Send WhatsApp message with coupon code
      const customer = await storage.getCustomer(req.params.id);
      if (customer) {
        triggerCouponMessage(customer, coupon.code, coupon.value);
      }

      res.status(201).json(coupon);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate coupon" });
    }
  });

  // Coupon verification
  app.get("/api/coupons/verify/:code", async (req, res) => {
    try {
      const referrer = await storage.getCustomerByCouponCode(req.params.code);
      if (!referrer) {
        return res.status(404).json({ message: "Invalid coupon code" });
      }

      res.json({
        code: req.params.code,
        referrerId: referrer.id,
        referrerName: referrer.name,
        referrerPhone: referrer.phoneNumber,
        referrerCurrentPoints: referrer.points,
        referrerPointsEarned: referrer.pointsEarned,
        referrerPointsRedeemed: referrer.pointsRedeemed,
        referrerRemainingPoints: referrer.points,
        totalReferrals: referrer.totalReferrals,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify coupon" });
    }
  });

  // Coupon redemption
  app.post("/api/coupons/:code/redeem", async (req, res) => {
    try {
      const { referredCustomerName, referredCustomerPhone, saleAmount, pointsToAssign } = req.body;

      const customer = await storage.getCustomerByCouponCode(req.params.code);
      if (!customer) {
        return res.status(404).json({ message: "Invalid coupon code" });
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

      // Use provided points or calculate from sale amount (1 point per $10)
      const finalPointsEarned = pointsToAssign || Math.floor((saleAmount || 0) / 10) || 10;

      // Create referral record
      const referral = await storage.createReferral({
        referrerId: customer.id,
        referredCustomerId: referredCustomer?.id || null,
        campaignId: null,
        couponCode: req.params.code,
        pointsEarned: finalPointsEarned,
        status: "completed",
        saleAmount: saleAmount || 0,
      });

      // Update customer points and referral count
      await storage.updateCustomer(customer.id, {
        points: customer.points + finalPointsEarned,
        pointsEarned: customer.pointsEarned + finalPointsEarned,
        totalReferrals: customer.totalReferrals + 1,
      });

      // Send SMS notification
      const message = `Congratulations! You've earned ${finalPointsEarned} points for your referral. Your total points: ${customer.points + finalPointsEarned}. Thank you for spreading the word!`;
      const smsResult = await sendSMS(customer.phoneNumber, message);

      // Log SMS
      await storage.createSmsMessage({
        customerId: customer.id,
        phoneNumber: customer.phoneNumber,
        message,
        type: "reward_earned",
        status: smsResult.success ? "sent" : "failed",
      });

      res.json({
        success: true,
        pointsEarned: finalPointsEarned,
        totalPoints: customer.points + finalPointsEarned,
        saleAmount: saleAmount || 0,
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

  // WhatsApp message routes
  app.get("/api/whatsapp", async (req, res) => {
    try {
      const messages = await storage.getAllWhatsappMessages();
      // Sort by most recent first and limit to 100
      const sortedMessages = messages
        .sort((a, b) => (b.sentAt ? new Date(b.sentAt).getTime() : 0) - (a.sentAt ? new Date(a.sentAt).getTime() : 0))
        .slice(0, 100);
      res.json(sortedMessages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch WhatsApp messages" });
    }
  });

  // WhatsApp connection status
  app.get("/api/whatsapp/status", async (req, res) => {
    try {
      const status = whatsappService.getConnectionStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get WhatsApp status" });
    }
  });

  // Register business WhatsApp number
  app.post("/api/whatsapp/register", async (req, res) => {
    try {
      const { phoneNumber, businessName } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const result = whatsappService.registerBusinessNumber(phoneNumber, businessName);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  // Unregister business WhatsApp
  app.post("/api/whatsapp/unregister", async (req, res) => {
    try {
      const result = whatsappService.unregisterBusiness();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to unregister" });
    }
  });

  // Send broadcast WhatsApp to all customers
  app.post("/api/whatsapp/broadcast", async (req, res) => {
    try {
      const { message, recipients = "all" } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      if (message.length > 1600) {
        return res.status(400).json({ error: "Message too long. Maximum 1600 characters allowed." });
      }

      let customers = [];

      if (recipients === "all") {
        customers = await storage.getAllCustomers();
      } else if (Array.isArray(recipients)) {
        // Custom recipient list by phone numbers
        for (const phoneNumber of recipients) {
          const customer = await storage.getCustomerByPhone(phoneNumber);
          if (customer) {
            customers.push(customer);
          }
        }
      }

      if (customers.length === 0) {
        return res.status(400).json({ error: "No valid recipients found" });
      }

      // Prepare WhatsApp broadcast
      const phoneNumbers = customers.map(customer => customer.phoneNumber);
      const personalizedMessage = message.replace(/\[COUPON_CODE\]/g, 'your referral code').replace(/\[NAME\]/g, 'valued customer');

      // Send WhatsApp broadcast
      const results = await whatsappService.sendBroadcastMessage(phoneNumbers, personalizedMessage);

      const successCount = results.successCount;
      const failureCount = results.failureCount;

      res.json({
        success: successCount > 0,
        totalRecipients: customers.length,
        messagesSent: successCount,
        messagesFailed: failureCount,
        results: results.results,
        summary: `${successCount} messages sent successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`
      });

    } catch (error) {
      console.error("Failed to send broadcast WhatsApp:", error);
      res.status(500).json({ error: "Failed to send broadcast messages" });
    }
  });

  // WhatsApp statistics
  app.get("/api/whatsapp/stats", async (req, res) => {
    try {
      const messages = await storage.getAllWhatsappMessages();
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const todayMessages = messages.filter(msg => msg.sentAt && new Date(msg.sentAt) >= startOfDay);
      const sentToday = todayMessages.filter(msg => msg.status === "sent").length;
      const failedToday = todayMessages.filter(msg => msg.status === "failed").length;

      const totalSent = messages.filter(msg => msg.status === "sent").length;
      const totalFailed = messages.filter(msg => msg.status === "failed").length;

      const messagesByType = messages.reduce((acc, msg) => {
        acc[msg.type] = (acc[msg.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        today: {
          sent: sentToday,
          failed: failedToday,
          total: todayMessages.length
        },
        allTime: {
          sent: totalSent,
          failed: totalFailed,
          total: messages.length
        },
        messagesByType,
        deliveryRate: totalSent + totalFailed > 0 ? Math.round((totalSent / (totalSent + totalFailed)) * 100) : 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch WhatsApp statistics" });
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