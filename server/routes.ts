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
import { interaktService } from "./interaktService";





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

      // Send welcome message via Interakt
      try {
        await interaktService.sendWelcomeMessage(
          customer.phoneNumber,
          customer.name,
          couponCode
        );

        await storage.createWhatsappMessage({
          customerId: customer.id,
          phoneNumber: customer.phoneNumber,
          message: `Welcome message with referral code: ${couponCode}`,
          type: "welcome_referral",
          status: "sent"
        });
      } catch (error) {
        console.error("Failed to send welcome message:", error);
      }

      res.status(201).json({
        customer,
        couponCode,
        message: `Customer created successfully.`
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
      const existingCustomer = await storage.getCustomer(req.params.id);
      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found after update" });
      }
      
      // Check if points were manually updated and send notification
      if (req.body.points && req.body.points !== existingCustomer.points) {
        const pointsDifference = req.body.points - existingCustomer.points;
        
        try {
          if (pointsDifference > 0) {
            // Points increased - send points earned message
            await interaktService.sendPointsEarnedMessage(
              customer.phoneNumber,
              customer.name,
              pointsDifference,
              customer.points
            );
            
            await storage.createWhatsappMessage({
              customerId: customer.id,
              phoneNumber: customer.phoneNumber,
              message: `Manual points adjustment: +${pointsDifference} points`,
              type: "reward_earned",
              status: "sent"
            });
          }
        } catch (error) {
          console.error("Failed to send points update message:", error);
        }
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

      res.json({
        success: true,
        totalRecipients: customers.length,
        messagesSent: 0,
        messagesFailed: 0,
        summary: `Campaign message prepared for ${customers.length} customers`
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
        try {
          await interaktService.sendTextMessage(
            customer.phoneNumber,
            `🎁 New Coupon Generated!\n\nHi ${customer.name},\n\nYour new coupon code: *${couponCode}*\n\nUse this code for your next purchase and save!\n\nValid for 100 uses. Don't miss out! 🛍️`
          );

          await storage.createWhatsappMessage({
            customerId: customer.id,
            phoneNumber: customer.phoneNumber,
            message: `Coupon generated notification: ${couponCode}`,
            type: "coupon_generated",
            status: "sent"
          });
        } catch (error) {
          console.error("Failed to send coupon generation message:", error);
        }
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

      // Send points earned message via Interakt
      try {
        await interaktService.sendPointsEarnedMessage(
          customer.phoneNumber,
          customer.name,
          finalPointsEarned,
          customer.points + finalPointsEarned
        );

        await storage.createWhatsappMessage({
          customerId: customer.id,
          phoneNumber: customer.phoneNumber,
          message: `Points earned notification: ${finalPointsEarned} points`,
          type: "reward_earned",
          status: "sent"
        });
      } catch (error) {
        console.error("Failed to send points earned message:", error);
      }

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

  // Points redemption endpoint
  app.post("/api/customers/:id/redeem-points", async (req, res) => {
    try {
      const { pointsToRedeem, rewardDescription } = req.body;

      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      if (customer.points < pointsToRedeem) {
        return res.status(400).json({ message: "Insufficient points" });
      }

      // Update customer points
      await storage.updateCustomer(customer.id, {
        points: customer.points - pointsToRedeem,
        pointsRedeemed: customer.pointsRedeemed + pointsToRedeem,
      });

      // Send points redeemed message via Interakt
      try {
        await interaktService.sendPointsRedeemedMessage(
          customer.phoneNumber,
          customer.name,
          pointsToRedeem,
          customer.points - pointsToRedeem,
          rewardDescription || "Points redeemed successfully"
        );

        await storage.createWhatsappMessage({
          customerId: customer.id,
          phoneNumber: customer.phoneNumber,
          message: `Points redeemed notification: ${pointsToRedeem} points`,
          type: "reward_earned",
          status: "sent"
        });
      } catch (error) {
        console.error("Failed to send points redeemed message:", error);
      }

      res.json({
        success: true,
        pointsRedeemed: pointsToRedeem,
        remainingPoints: customer.points - pointsToRedeem,
        rewardDescription: rewardDescription || "Points redeemed successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to redeem points" });
    }
  });

  



  // Interakt WhatsApp routes
  app.get("/api/interakt/config", async (req, res) => {
    try {
      const config = interaktService.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to get Interakt configuration" });
    }
  });

  app.post("/api/interakt/configure", async (req, res) => {
    try {
      const { apiKey, apiUrl, phoneNumber, businessName } = req.body;

      if (!apiKey || !phoneNumber || !businessName) {
        return res.status(400).json({ message: "Missing required configuration fields" });
      }

      const success = interaktService.configure({
        apiKey,
        apiUrl: apiUrl || 'https://api.interakt.ai/v1',
        phoneNumber,
        businessName
      });

      if (success) {
        res.json({ success: true, message: "Interakt configured successfully" });
      } else {
        res.status(500).json({ message: "Failed to configure Interakt" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to configure Interakt service" });
    }
  });

  app.post("/api/interakt/send-test", async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Phone number and message are required" });
      }

      const result = await interaktService.sendTextMessage(phoneNumber, message);

      if (result.success) {
        // Log the message in database
        await storage.createWhatsappMessage({
          phoneNumber,
          message,
          type: "broadcast",
          status: "sent"
        });

        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to send test message" });
    }
  });

  app.post("/api/interakt/broadcast", async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const customers = await storage.getAllCustomers();
      if (customers.length === 0) {
        return res.status(400).json({ message: "No customers found to send messages to" });
      }

      const phoneNumbers = customers.map(customer => customer.phoneNumber);
      const result = await interaktService.sendBroadcastMessage(phoneNumbers, message);

      // Log broadcast messages
      for (const customer of customers) {
        await storage.createWhatsappMessage({
          customerId: customer.id,
          phoneNumber: customer.phoneNumber,
          message,
          type: "broadcast",
          status: "sent"
        });
      }

      res.json({
        success: true,
        total: result.total,
        sent: result.sent,
        failed: result.failed
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send broadcast message" });
    }
  });

  app.get("/api/interakt/stats", async (req, res) => {
    try {
      const messages = await storage.getAllWhatsappMessages();
      const totalSent = messages.length;
      const delivered = messages.filter(msg => msg.status === "sent").length;
      const failed = messages.filter(msg => msg.status === "failed").length;
      const successRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMessages = messages.filter(msg => msg.sentAt && new Date(msg.sentAt) >= today);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekMessages = messages.filter(msg => msg.sentAt && new Date(msg.sentAt) >= weekAgo);

      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthMessages = messages.filter(msg => msg.sentAt && new Date(msg.sentAt) >= monthAgo);

      const lastSent = messages.length > 0 ? 
        Math.max(...messages.filter(msg => msg.sentAt).map(msg => new Date(msg.sentAt!).getTime())) : null;

      res.json({
        totalSent,
        delivered,
        failed,
        successRate,
        todayCount: todayMessages.length,
        weekCount: weekMessages.length,
        monthCount: monthMessages.length,
        lastSent: lastSent ? new Date(lastSent).toISOString() : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get message statistics" });
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