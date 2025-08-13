import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCustomerSchema,
  insertCampaignSchema,
  insertCouponSchema,
  insertReferralSchema,
  insertWhatsappMessageSchema,
  insertUserSchema,
  loginUserSchema,
  onboardingSchema,
  insertProductSchema,
  insertSaleSchema,
  processSaleSchema,
  type User,
  type ProcessSale
} from "@shared/schema";
import { z } from "zod";
import { interaktService } from "./interaktService";
import { posManager, posWebhookSchema, SquareIntegration, ShopifyIntegration, GenericPOSIntegration } from "./posIntegration";
import { PointsCalculator } from "./pointsCalculator";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";





// Session middleware
function setupAuth(app: Express) {
  routeLogger.info("AUTH-SETUP", "Configuring session middleware", {
    hasSessionSecret: !!process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV
  });

  const SessionStore = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Session debugging middleware
  app.use((req: any, res, next) => {
    if (req.path.startsWith('/api/')) {
      routeLogger.debug(`${req.method} ${req.path}`, "Session info", {
        requestId: req.requestId,
        sessionID: req.sessionID,
        hasSession: !!req.session,
        sessionUser: req.session?.user ? {
          id: req.session.user.id,
          username: req.session.user.username,
          isOnboarded: req.session.user.isOnboarded
        } : null,
        cookies: req.headers.cookie ? 'Present' : 'None'
      });
    }
    next();
  });

  routeLogger.info("AUTH-SETUP", "Session middleware configured successfully");
}

// Route logging utility
const routeLogger = {
  info: (route: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ROUTE-INFO] [${route}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (route: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [ROUTE-WARN] [${route}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (route: string, message: string, error: any, data?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ROUTE-ERROR] [${route}] ${message}`, { error: error.message || error, data });
  },
  debug: (route: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${timestamp}] [ROUTE-DEBUG] [${route}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  const route = `${req.method} ${req.path}`;
  
  routeLogger.debug(route, "Checking authentication", {
    requestId: req.requestId,
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    userId: req.session?.user?.id,
    sessionId: req.sessionID
  });

  if (req.session?.user) {
    routeLogger.debug(route, "Authentication successful", {
      userId: req.session.user.id,
      username: req.session.user.username
    });
    return next();
  }
  
  routeLogger.warn(route, "Authentication failed - no valid session", {
    requestId: req.requestId,
    sessionExists: !!req.session,
    sessionId: req.sessionID
  });
  
  return res.status(401).json({ message: "Authentication required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    const route = "POST /api/auth/register";
    const requestId = (req as any).requestId;
    
    try {
      routeLogger.info(route, "Registration attempt started", { 
        requestId,
        username: req.body.username,
        hasPassword: !!req.body.password
      });

      const validatedData = insertUserSchema.parse(req.body);
      routeLogger.debug(route, "Data validation successful", { requestId, username: validatedData.username });
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        routeLogger.warn(route, "Registration failed - username already exists", { 
          requestId, 
          username: validatedData.username 
        });
        return res.status(400).json({ message: "Username already exists" });
      }
      
      routeLogger.debug(route, "Username available, proceeding with registration", { requestId });
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      routeLogger.debug(route, "Password hashed successfully", { requestId });
      
      // Create user
      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword
      });
      
      routeLogger.info(route, "User created successfully", { 
        requestId, 
        userId: user.id, 
        username: user.username 
      });
      
      // Create session with complete user data (new users have isOnboarded = false by default)
      (req as any).session.user = {
        id: user.id,
        username: user.username,
        adminName: user.adminName,
        shopName: user.shopName,
        whatsappBusinessNumber: user.whatsappBusinessNumber,
        industry: user.industry,
        isOnboarded: user.isOnboarded || false
      };
      
      routeLogger.info(route, "Session created for new user", { 
        requestId, 
        userId: user.id,
        sessionId: (req as any).sessionID,
        isOnboarded: user.isOnboarded || false
      });
      
      res.status(201).json({
        user: (req as any).session.user,
        message: "User registered successfully"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        routeLogger.error(route, "Validation error during registration", error, { 
          requestId, 
          validationErrors: error.errors 
        });
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      routeLogger.error(route, "Unexpected error during registration", error, { requestId });
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const route = "POST /api/auth/login";
    const requestId = (req as any).requestId;
    
    try {
      routeLogger.info(route, "Login attempt started", { 
        requestId,
        username: req.body.username,
        hasPassword: !!req.body.password,
        sessionId: (req as any).sessionID
      });

      const validatedData = loginUserSchema.parse(req.body);
      routeLogger.debug(route, "Login data validation successful", { requestId, username: validatedData.username });
      
      // Find user
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        routeLogger.warn(route, "Login failed - user not found", { 
          requestId, 
          username: validatedData.username 
        });
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      routeLogger.debug(route, "User found, checking password", { 
        requestId, 
        userId: user.id,
        username: user.username 
      });
      
      // Check password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        routeLogger.warn(route, "Login failed - invalid password", { 
          requestId, 
          userId: user.id,
          username: user.username 
        });
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      routeLogger.debug(route, "Password validated successfully", { requestId, userId: user.id });
      
      // Create session with complete user data
      (req as any).session.user = {
        id: user.id,
        username: user.username,
        adminName: user.adminName,
        shopName: user.shopName,
        whatsappBusinessNumber: user.whatsappBusinessNumber,
        industry: user.industry,
        isOnboarded: user.isOnboarded
      };
      
      routeLogger.info(route, "Login successful - session created", { 
        requestId, 
        userId: user.id,
        username: user.username,
        sessionId: (req as any).sessionID,
        isOnboarded: user.isOnboarded
      });
      
      res.json({
        user: (req as any).session.user,
        message: "Login successful"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        routeLogger.error(route, "Validation error during login", error, { 
          requestId, 
          validationErrors: error.errors 
        });
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      routeLogger.error(route, "Unexpected error during login", error, { requestId });
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    const route = "GET /api/auth/user";
    const requestId = (req as any).requestId;
    
    routeLogger.debug(route, "User session check started", { 
      requestId,
      sessionId: (req as any).sessionID,
      hasSession: !!(req as any).session,
      hasUser: !!(req as any).session?.user,
      sessionUserId: (req as any).session?.user?.id
    });

    if ((req as any).session?.user) {
      const sessionUserId = (req as any).session.user.id;
      routeLogger.debug(route, "Valid session found, fetching fresh user data", { 
        requestId, 
        sessionUserId 
      });

      try {
        // Get fresh user data from database to include onboarding status
        const user = await storage.getUser(sessionUserId);
        if (user) {
          routeLogger.info(route, "User data retrieved successfully", { 
            requestId,
            userId: user.id,
            username: user.username,
            isOnboarded: user.isOnboarded,
            onboardedType: typeof user.isOnboarded
          });

          res.json({ 
            user: { 
              id: user.id, 
              username: user.username,
              adminName: user.adminName,
              shopName: user.shopName,
              whatsappBusinessNumber: user.whatsappBusinessNumber,
              industry: user.industry,
              isOnboarded: user.isOnboarded
            } 
          });
        } else {
          routeLogger.warn(route, "User not found in database despite valid session", { 
            requestId, 
            sessionUserId 
          });
          res.status(401).json({ message: "User not found" });
        }
      } catch (error) {
        routeLogger.error(route, "Error fetching user data", error, { requestId, sessionUserId });
        res.status(500).json({ message: "Error fetching user data" });
      }
    } else {
      routeLogger.debug(route, "No valid session found", { 
        requestId,
        sessionId: (req as any).sessionID,
        sessionExists: !!(req as any).session
      });
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post("/api/auth/onboard", async (req, res) => {
    try {
      if (!(req as any).session?.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validatedData = onboardingSchema.parse(req.body);
      const userId = (req as any).session.user.id;

      console.log("Onboarding user:", userId, "with data:", validatedData);

      const updatedUser = await storage.updateUser(userId, {
        ...validatedData,
        isOnboarded: true
      });

      console.log("Updated user after onboarding:", { 
        id: updatedUser?.id, 
        isOnboarded: updatedUser?.isOnboarded,
        adminName: updatedUser?.adminName,
        shopName: updatedUser?.shopName
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update session with new user data
      (req as any).session.user = {
        id: updatedUser.id,
        username: updatedUser.username,
        adminName: updatedUser.adminName,
        shopName: updatedUser.shopName,
        whatsappBusinessNumber: updatedUser.whatsappBusinessNumber,
        industry: updatedUser.industry,
        isOnboarded: updatedUser.isOnboarded
      };

      console.log("Session updated with:", (req as any).session.user);

      res.json({
        user: (req as any).session.user,
        message: "Onboarding completed successfully"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Onboarding error:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Protected routes (require authentication)
  app.get("/api/customers", requireAuth, async (req, res) => {
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

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);

      // Check if phone number already exists
      const existingCustomer = await storage.getCustomerByPhone(validatedData.phoneNumber);
      if (existingCustomer) {
        return res.status(400).json({ message: "Customer with this phone number already exists" });
      }

      // Generate unique referral code for the new customer
      const referralCode = await storage.generateUniqueCode();

      // Create customer with referral code
      const customer = await storage.createCustomer({
        ...validatedData,
        referralCode
      });

      // No separate coupon creation - referral code IS the coupon code

      // Send welcome message via Interakt with referral code
      try {
        await interaktService.sendWelcomeMessage(
          customer.phoneNumber,
          customer.name,
          referralCode,
          referralCode // Same code for both referral and coupon
        );

        await storage.createWhatsappMessage({
          customerId: customer.id,
          phoneNumber: customer.phoneNumber,
          message: `Welcome message with referral code: ${referralCode}`,
          type: "welcome_referral",
          status: "sent"
        });
      } catch (error) {
        console.error("Failed to send welcome message:", error);
      }

      res.status(201).json({
        customer,
        referralCode,
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
        pointCalculationType: req.body.pointCalculationType || "fixed",
        percentageRate: req.body.percentageRate ? String(req.body.percentageRate) : null,
        minimumPurchase: req.body.minimumPurchase ? String(req.body.minimumPurchase) : "0",
        maximumPoints: req.body.maximumPoints ? Number(req.body.maximumPoints) : null,
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

  // Get coupons for a specific customer
  app.get("/api/customers/:id/coupons", async (req, res) => {
    try {
      const coupons = await storage.getCouponsByCustomer(req.params.id);
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer coupons" });
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
        referralCode: req.params.code,
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

  // ===========================================
  // PRODUCTS MANAGEMENT ROUTES
  // ===========================================

  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/active", requireAuth, async (req, res) => {
    try {
      const products = await storage.getActiveProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active products" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // ===========================================
  // SALES PROCESSING ROUTES
  // ===========================================

  app.post("/api/sales/process", requireAuth, async (req, res) => {
    try {
      const validatedData = processSaleSchema.parse(req.body);
      
      // Get campaign and products for point calculation
      const campaign = validatedData.campaignId ? await storage.getCampaign(validatedData.campaignId) : null;
      const productIds = validatedData.items.map(item => item.productId).filter(Boolean);
      const products = productIds.length > 0 ? await Promise.all(productIds.map(id => storage.getProduct(id!))) : [];
      const validProducts = products.filter((p): p is NonNullable<typeof p> => p !== undefined);

      // Calculate points using the PointsCalculator
      const pointCalculation = await PointsCalculator.calculatePoints(
        validatedData, 
        campaign, 
        validProducts, 
        campaign ? await storage.getPointTiersByCampaign(campaign.id) : []
      );

      // Find referrer customer if referral code provided
      let referrerCustomer = null;
      let referral = null;
      if (validatedData.referralCode) {
        referrerCustomer = await storage.getCustomerByCouponCode(validatedData.referralCode);
      }

      // Create sale record
      const sale = await storage.createSale({
        customerId: validatedData.customerId || null,
        referralId: referral?.id || null,
        campaignId: validatedData.campaignId || campaign?.id || null,
        totalAmount: validatedData.totalAmount.toString(),
        pointsEarned: pointCalculation.totalPoints,
        referralCode: validatedData.referralCode || null,
        posTransactionId: validatedData.posTransactionId || null,
        paymentMethod: validatedData.paymentMethod || null,
        status: "completed",
      });

      // Create sale items
      for (let i = 0; i < validatedData.items.length; i++) {
        const item = validatedData.items[i];
        await storage.createSaleItem({
          saleId: sale.id,
          productId: item.productId || null,
          productName: item.productName,
          productSku: item.productSku || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          pointsEarned: pointCalculation.itemPoints[i]?.points || 0,
        });
      }

      // If referral code was used, process the referral
      if (referrerCustomer && pointCalculation.totalPoints > 0) {
        // Create referral record
        referral = await storage.createReferral({
          referrerId: referrerCustomer.id,
          referredCustomerId: validatedData.customerId || null,
          campaignId: campaign?.id || null,
          referralCode: validatedData.referralCode || "",
          pointsEarned: pointCalculation.totalPoints,
          saleAmount: validatedData.totalAmount.toString(),
          status: "completed",
        });

        // Update sale with referral ID
        await storage.updateSale(sale.id, { referralId: referral.id });

        // Update referrer customer points and referral count
        await storage.updateCustomer(referrerCustomer.id, {
          points: referrerCustomer.points + pointCalculation.totalPoints,
          pointsEarned: referrerCustomer.pointsEarned + pointCalculation.totalPoints,
          totalReferrals: referrerCustomer.totalReferrals + 1,
        });

        // Create points transaction record
        await storage.createPointsTransaction({
          customerId: referrerCustomer.id,
          referralId: referral.id,
          type: "earned",
          points: pointCalculation.totalPoints,
          description: `Points earned from sale: $${validatedData.totalAmount}`,
        });

        // Send WhatsApp notification
        try {
          await interaktService.sendPointsEarnedMessage(
            referrerCustomer.phoneNumber,
            referrerCustomer.name,
            pointCalculation.totalPoints,
            referrerCustomer.points + pointCalculation.totalPoints
          );

          await storage.createWhatsappMessage({
            customerId: referrerCustomer.id,
            phoneNumber: referrerCustomer.phoneNumber,
            message: `Points earned: ${pointCalculation.totalPoints} points from $${validatedData.totalAmount} sale`,
            type: "reward_earned",
            status: "sent"
          });
        } catch (error) {
          console.error("Failed to send points earned message:", error);
        }
      }

      res.json({
        success: true,
        sale,
        pointsEarned: pointCalculation.totalPoints,
        pointCalculation: {
          totalPoints: pointCalculation.totalPoints,
          itemBreakdown: pointCalculation.itemPoints,
          appliedRules: pointCalculation.appliedRules,
        },
        referral,
        message: referrerCustomer ? 
          `Sale processed successfully! ${referrerCustomer.name} earned ${pointCalculation.totalPoints} points.` :
          "Sale processed successfully!"
      });
    } catch (error) {
      console.error("Sale processing error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process sale" });
    }
  });

  app.post("/api/sales/preview-points", requireAuth, async (req, res) => {
    try {
      const validatedData = processSaleSchema.parse(req.body);
      
      // Get campaign and products for point calculation
      const campaign = validatedData.campaignId ? await storage.getCampaign(validatedData.campaignId) : null;
      const productIds = validatedData.items.map(item => item.productId).filter(Boolean);
      const products = productIds.length > 0 ? await Promise.all(productIds.map(id => storage.getProduct(id!))) : [];
      const validProducts = products.filter((p): p is NonNullable<typeof p> => p !== undefined);

      // Preview points calculation
      const pointCalculation = await PointsCalculator.previewPoints(
        validatedData, 
        campaign, 
        validProducts, 
        campaign ? await storage.getPointTiersByCampaign(campaign.id) : []
      );

      res.json({
        totalPoints: pointCalculation.totalPoints,
        itemBreakdown: pointCalculation.itemPoints,
        appliedRules: pointCalculation.appliedRules,
        campaignName: campaign?.name || "No active campaign",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to preview points calculation" });
    }
  });

  app.get("/api/sales", requireAuth, async (req, res) => {
    try {
      const sales = await storage.getAllSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  // ===========================================
  // PRODUCTS ROUTES
  // ===========================================

  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get active products
  app.get("/api/products/active", async (req, res) => {
    try {
      const products = await storage.getActiveProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active products" });
    }
  });

  // Create product
  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product
  app.put("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // ===========================================
  // SALES PROCESSING ROUTES
  // ===========================================

  // Preview points calculation for a sale
  app.post("/api/sales/preview-points", requireAuth, async (req, res) => {
    try {
      const saleData = processSaleSchema.parse(req.body);
      
      // Get campaign and products for calculation
      const campaign = saleData.campaignId ? await storage.getCampaign(saleData.campaignId) : null;
      const productIds = saleData.items.map(item => item.productId).filter(Boolean) as string[];
      const products = productIds.length > 0 ? 
        await Promise.all(productIds.map(id => storage.getProduct(id))) : [];
      
      // Calculate points
      const calculation = await PointsCalculator.previewPoints(
        saleData,
        campaign,
        products.filter(p => p !== undefined),
        // Point tiers would be fetched here if needed
      );
      
      res.json(calculation);
    } catch (error) {
      console.error("Points preview error:", error);
      res.status(500).json({ message: "Failed to preview points calculation" });
    }
  });

  // Process a complete sale with referral points
  app.post("/api/sales/process", requireAuth, async (req, res) => {
    try {
      const saleData = processSaleSchema.parse(req.body);
      
      // Find customer and campaign
      let customer = null;
      if (saleData.customerId) {
        customer = await storage.getCustomer(saleData.customerId);
      } else if (saleData.referralCode) {
        customer = await storage.getCustomerByCouponCode(saleData.referralCode);
      }

      const campaign = saleData.campaignId ? await storage.getCampaign(saleData.campaignId) : null;
      
      // Get products for calculation
      const productIds = saleData.items.map(item => item.productId).filter(Boolean) as string[];
      const products = productIds.length > 0 ? 
        await Promise.all(productIds.map(id => storage.getProduct(id))) : [];
      
      // Calculate points
      const pointCalculation = await PointsCalculator.calculatePoints(
        saleData,
        campaign,
        products.filter(p => p !== undefined),
      );

      // Create sale record
      const sale = await storage.createSale({
        customerId: customer?.id || null,
        campaignId: campaign?.id || null,
        totalAmount: saleData.totalAmount.toString(),
        pointsEarned: pointCalculation.totalPoints,
        referralCode: saleData.referralCode || null,
        posTransactionId: saleData.posTransactionId || null,
        paymentMethod: saleData.paymentMethod || null,
        status: "completed"
      });

      // Create sale items
      const saleItems = await Promise.all(
        saleData.items.map((item, index) => 
          storage.createSaleItem({
            saleId: sale.id,
            productId: item.productId || null,
            productName: item.productName,
            productSku: item.productSku || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            totalPrice: item.totalPrice.toString(),
            pointsEarned: pointCalculation.itemPoints[index]?.points || 0
          })
        )
      );

      // Update customer points if found
      if (customer && pointCalculation.totalPoints > 0) {
        await storage.updateCustomer(customer.id, {
          points: customer.points + pointCalculation.totalPoints,
          pointsEarned: customer.pointsEarned + pointCalculation.totalPoints,
          totalReferrals: customer.totalReferrals + 1,
        });

        // Create referral record
        const referral = await storage.createReferral({
          referrerId: customer.id,
          referredCustomerId: null, // Could be set if known
          campaignId: campaign?.id || null,
          referralCode: saleData.referralCode || customer.referralCode || "",
          pointsEarned: pointCalculation.totalPoints,
          saleAmount: saleData.totalAmount.toString(),
          status: "completed",
        });

        // Send WhatsApp notification
        try {
          await interaktService.sendPointsEarnedMessage(
            customer.phoneNumber,
            customer.name,
            pointCalculation.totalPoints,
            customer.points + pointCalculation.totalPoints
          );

          await storage.createWhatsappMessage({
            customerId: customer.id,
            phoneNumber: customer.phoneNumber,
            message: `Points earned: ${pointCalculation.totalPoints} points for sale`,
            type: "reward_earned",
            status: "sent"
          });
        } catch (error) {
          console.error("Failed to send points earned message:", error);
        }
      }

      res.status(201).json({
        success: true,
        sale,
        saleItems,
        pointCalculation,
        customer: customer ? {
          id: customer.id,
          name: customer.name,
          newPointsBalance: customer.points + pointCalculation.totalPoints
        } : null
      });
    } catch (error) {
      console.error("Sale processing error:", error);
      res.status(500).json({ message: "Failed to process sale" });
    }
  });

  // Get all sales
  app.get("/api/sales", requireAuth, async (req, res) => {
    try {
      const sales = await storage.getAllSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  // Get sales by customer
  app.get("/api/sales/customer/:customerId", requireAuth, async (req, res) => {
    try {
      const sales = await storage.getSalesByCustomer(req.params.customerId);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer sales" });
    }
  });

  // ===========================================
  // POS INTEGRATION ROUTES
  // ===========================================

  // POS setup request form submission
  app.post("/api/pos/setup-request", requireAuth, async (req, res) => {
    try {
      const { name, phone, email, businessType, message } = req.body;

      if (!name || !phone || !email || !businessType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create email content
      const emailContent = `
        New POS Integration Setup Request
        
        Name: ${name}
        Phone: ${phone}
        Email: ${email}
        Business Type: ${businessType}
        Message: ${message || 'No additional message'}
        
        Request submitted at: ${new Date().toISOString()}
      `;

      // For now, we'll just log the request
      // In a real implementation, you would integrate with an email service like SendGrid, Nodemailer, etc.
      console.log("POS Setup Request:", {
        name,
        phone,
        email,
        businessType,
        message,
        timestamp: new Date().toISOString()
      });

      console.log("Email would be sent to mithuan137@gmail.com with content:");
      console.log(emailContent);

      res.json({ 
        success: true, 
        message: "POS integration request submitted successfully" 
      });
    } catch (error) {
      console.error("Failed to process POS setup request:", error);
      res.status(500).json({ message: "Failed to submit POS setup request" });
    }
  });

  // Get all available POS integrations
  app.get("/api/pos/integrations", requireAuth, async (req, res) => {
    try {
      const integrations = posManager.getAllIntegrations().map(integration => ({
        name: integration.name,
        connected: true // We'll implement connection status later
      }));
      
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get POS integrations" });
    }
  });

  // Add POS integration
  app.post("/api/pos/integrations", requireAuth, async (req, res) => {
    try {
      const { type, config } = req.body;
      
      let integration;
      switch (type.toLowerCase()) {
        case 'square':
          integration = new SquareIntegration(config.apiKey, config.environment || 'sandbox');
          break;
        case 'shopify':
          integration = new ShopifyIntegration(config.shopUrl, config.accessToken);
          break;
        case 'generic':
          integration = new GenericPOSIntegration(config.apiUrl, config.headers || {});
          break;
        default:
          return res.status(400).json({ message: "Unsupported POS type" });
      }

      // Test authentication
      const isAuthenticated = await integration.authenticate();
      if (!isAuthenticated) {
        return res.status(400).json({ message: "Failed to authenticate with POS system" });
      }

      posManager.addIntegration(integration);
      
      res.json({ 
        message: `${integration.name} integration added successfully`,
        name: integration.name
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to add POS integration" });
    }
  });

  // Sync customers from POS systems
  app.post("/api/pos/sync", requireAuth, async (req, res) => {
    try {
      console.log("Starting POS customer sync...");
      
      const posCustomers = await posManager.syncAllCustomers();
      let imported = 0;
      let skipped = 0;

      for (const posCustomer of posCustomers) {
        try {
          // Check if customer already exists by phone
          if (posCustomer.phone) {
            const existing = await storage.getCustomerByPhone(posCustomer.phone);
            if (existing) {
              skipped++;
              continue;
            }
          }

          // Generate referral code
          const referralCode = await storage.generateUniqueCode();

          // Create customer in our system
          await storage.createCustomer({
            name: posCustomer.name,
            phoneNumber: posCustomer.phone || "",
            email: posCustomer.email || null,
            points: 2, // Default welcome points
            referralCode
          });

          imported++;
          console.log(`Imported customer: ${posCustomer.name} from ${posCustomer.source}`);
        } catch (error) {
          console.error(`Failed to import customer ${posCustomer.name}:`, error);
          skipped++;
        }
      }

      res.json({
        message: "Customer sync completed",
        imported,
        skipped,
        total: posCustomers.length
      });
    } catch (error) {
      console.error("POS sync failed:", error);
      res.status(500).json({ message: "Failed to sync customers from POS" });
    }
  });

  // Webhook endpoint for POS systems
  app.post("/api/pos/webhook/:provider", async (req, res) => {
    try {
      const provider = req.params.provider;
      console.log(`Received webhook from ${provider}:`, req.body);

      // Process different webhook formats
      let customer, event;
      
      if (provider === 'square') {
        // Square webhook format
        const squareData = req.body.data?.object?.customer;
        if (squareData) {
          customer = {
            name: `${squareData.given_name || ""} ${squareData.family_name || ""}`.trim(),
            phone: squareData.phone_number,
            email: squareData.email_address,
            source: "Square"
          };
          event = req.body.type?.includes('created') ? 'customer_created' : 'customer_updated';
        }
      } else if (provider === 'shopify') {
        // Shopify webhook format
        const shopifyCustomer = req.body;
        customer = {
          name: `${shopifyCustomer.first_name || ""} ${shopifyCustomer.last_name || ""}`.trim(),
          phone: shopifyCustomer.phone,
          email: shopifyCustomer.email,
          source: "Shopify"
        };
        event = 'customer_created';
      } else {
        // Generic webhook format - will be validated
        const validatedData = posWebhookSchema.parse(req.body);
        customer = validatedData.customer;
        event = validatedData.event;
      }

      if (customer && event === 'customer_created') {
        // Check if customer already exists
        if (customer.phone) {
          const existing = await storage.getCustomerByPhone(customer.phone);
          if (!existing) {
            // Generate referral code and create customer
            const referralCode = await storage.generateUniqueCode();
            
            await storage.createCustomer({
              name: customer.name,
              phoneNumber: customer.phone || "",
              email: customer.email || null,
              points: 2, // Default welcome points
              referralCode
            });

            console.log(`Auto-created customer from ${provider}: ${customer.name}`);
            
            // Send welcome message if phone number is available
            if (customer.phone) {
              try {
                await interaktService.sendWelcomeMessage(
                  customer.phone,
                  customer.name,
                  referralCode,
                  referralCode
                );
              } catch (error) {
                console.error("Failed to send welcome message:", error);
              }
            }
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook processing failed:", error);
      res.status(400).json({ message: "Invalid webhook data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}