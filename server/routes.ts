import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCustomerSchema,
  insertCampaignSchema,
  insertCouponSchema,
  insertReferralSchema,
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
import { posManager, posWebhookSchema, SquareIntegration, ShopifyIntegration, GenericPOSIntegration } from "./posIntegration";
import { PointsCalculator } from "./pointsCalculator";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";

// Logging setup
const routeLogger = {
  info: (type: string, message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] [ROUTE-INFO] [${type}] ${message}`, data ? JSON.stringify(data) : '');
  },
  debug: (type: string, message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] [ROUTE-DEBUG] [${type}] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (type: string, message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] [ROUTE-ERROR] [${type}] ${message}`, data ? JSON.stringify(data) : '');
  }
};

// Session middleware
function setupAuth(app: Express) {
  routeLogger.info("AUTH-SETUP", "Configuring session middleware", {
    hasSessionSecret: !!process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV
  });

  const SessionStore = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fruitbox-dev-secret-key-' + Math.random().toString(36),
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
    const requestId = Math.random().toString(36).substring(2, 8);
    req.requestId = requestId;
    next();
  });

  routeLogger.info("AUTH-SETUP", "Session middleware configured successfully");
}

// Request logging middleware
function setupLogging(app: Express) {
  app.use((req: any, res, next) => {
    const start = Date.now();
    
    // Log incoming request
    routeLogger.debug("Incoming request", req.method + " " + req.path, {
      requestId: req.requestId,
      headers: req.headers,
      query: req.query
    });

    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: duration + 'ms',
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        session: {
          userId: req.session?.user?.id,
          username: req.session?.user?.username
        }
      };

      if (res.statusCode >= 400) {
        routeLogger.error("Request failed", req.method + " " + req.path, {
          ...logData,
          response: res.locals.responseData,
          query: req.query,
          body: req.method === 'POST' || req.method === 'PATCH' ? req.body : undefined
        });
      } else {
        const logLevel = req.path.startsWith('/api/') ? 'INFO' : 'DEBUG';
        console.log(`[${new Date().toISOString()}] [${logLevel}] ${logLevel === 'INFO' ? 'API Request' : 'Static Request'}: ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`, JSON.stringify(logData));
      }
    });

    next();
  });
}

// Authentication middleware - TEMPORARILY DISABLED FOR TESTING
function requireAuth(req: any, res: any, next: any) {
  // BYPASS AUTH CHECK - ALLOW ALL REQUESTS
  next();
}

export function setupRoutes(app: Express): Server {
  setupAuth(app);
  setupLogging(app);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.get("/api/auth/user", async (req: any, res) => {
    routeLogger.debug("GET /api/auth/user", "Session info", {
      requestId: req.requestId,
      sessionID: req.sessionID,
      hasSession: !!req.session,
      sessionUser: req.session?.user || null,
      cookies: req.headers.cookie ? "Present" : "None"
    });

    routeLogger.debug("GET /api/auth/user", "User session check started", {
      requestId: req.requestId,
      sessionId: req.sessionID,
      hasSession: !!req.session,
      hasUser: !!req.session?.user
    });

    if (!req.session?.user) {
      routeLogger.debug("GET /api/auth/user", "No valid session found", {
        requestId: req.requestId,
        sessionId: req.sessionID,
        sessionExists: !!req.session
      });
      res.locals.responseData = { message: "Not authenticated" };
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.user.id);
      if (!user) {
        routeLogger.debug("GET /api/auth/user", "User not found in database", {
          requestId: req.requestId,
          userId: req.session.user.id
        });
        req.session.destroy(() => {});
        res.locals.responseData = { message: "User not found" };
        return res.status(401).json({ message: "User not found" });
      }

      routeLogger.info("GET /api/auth/user", "User session validated successfully", {
        requestId: req.requestId,
        userId: user.id,
        username: user.username,
        isOnboarded: user.isOnboarded
      });

      const userData = {
        id: user.id,
        username: user.username,
        adminName: user.adminName,
        shopName: user.shopName,
        industry: user.industry,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt
      };

      res.json(userData);
    } catch (error) {
      routeLogger.error("GET /api/auth/user", "Database error during user lookup", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.session?.user?.id
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req: any, res) => {
    routeLogger.debug("POST /api/auth/register", "Session info", {
      requestId: req.requestId,
      sessionID: req.sessionID,
      hasSession: !!req.session,
      sessionUser: req.session?.user || null,
      cookies: req.headers.cookie ? "Present" : "None"
    });

    try {
      const { username, password } = req.body;
      
      routeLogger.info("POST /api/auth/register", "Registration attempt started", {
        requestId: req.requestId,
        username,
        hasPassword: !!password
      });

      const validatedData = insertUserSchema.pick({ username: true, password: true }).parse({ username, password });
      
      routeLogger.debug("POST /api/auth/register", "Data validation successful", {
        requestId: req.requestId,
        username: validatedData.username
      });

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        routeLogger.info("POST /api/auth/register", "Registration failed - user exists", {
          requestId: req.requestId,
          username: validatedData.username
        });
        res.locals.responseData = { message: "Username already exists" };
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword
      });

      // Set session
      req.session.user = {
        id: user.id,
        username: user.username,
        isOnboarded: user.isOnboarded
      };

      routeLogger.info("POST /api/auth/register", "Registration successful", {
        requestId: req.requestId,
        userId: user.id,
        username: user.username,
        sessionId: req.sessionID
      });

      const userData = {
        id: user.id,
        username: user.username,
        adminName: user.adminName,
        shopName: user.shopName,
        industry: user.industry,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt
      };

      res.status(201).json(userData);
    } catch (error) {
      routeLogger.error("POST /api/auth/register", "Unexpected error during registration", {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { requestId: req.requestId }
      });
      
      if (error instanceof z.ZodError) {
        res.locals.responseData = { message: "Invalid data", errors: error.errors };
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.locals.responseData = { message: "Failed to register user" };
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req: any, res) => {
    routeLogger.debug("POST /api/auth/login", "Session info", {
      requestId: req.requestId,
      sessionID: req.sessionID,
      hasSession: !!req.session,
      sessionUser: req.session?.user || null,
      cookies: req.headers.cookie ? "Present" : "None"
    });

    try {
      const { username, password } = req.body;
      
      routeLogger.info("POST /api/auth/login", "Login attempt started", {
        requestId: req.requestId,
        username,
        hasPassword: !!password
      });

      const validatedData = loginUserSchema.parse({ username, password });
      
      routeLogger.debug("POST /api/auth/login", "Data validation successful", {
        requestId: req.requestId,
        username: validatedData.username
      });

      // Find user
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        routeLogger.info("POST /api/auth/login", "Login failed - user not found", {
          requestId: req.requestId,
          username: validatedData.username
        });
        res.locals.responseData = { message: "Invalid credentials" };
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        routeLogger.info("POST /api/auth/login", "Login failed - invalid password", {
          requestId: req.requestId,
          username: validatedData.username,
          userId: user.id
        });
        res.locals.responseData = { message: "Invalid credentials" };
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.user = {
        id: user.id,
        username: user.username,
        isOnboarded: user.isOnboarded
      };

      routeLogger.info("POST /api/auth/login", "Login successful", {
        requestId: req.requestId,
        userId: user.id,
        username: user.username,
        sessionId: req.sessionID,
        isOnboarded: user.isOnboarded
      });

      const userData = {
        id: user.id,
        username: user.username,
        adminName: user.adminName,
        shopName: user.shopName,
        industry: user.industry,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt
      };

      res.json(userData);
    } catch (error) {
      routeLogger.error("POST /api/auth/login", "Unexpected error during login", {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { requestId: req.requestId }
      });
      
      if (error instanceof z.ZodError) {
        res.locals.responseData = { message: "Invalid data", errors: error.errors };
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.locals.responseData = { message: "Failed to login" };
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    routeLogger.info("POST /api/auth/logout", "Logout attempt", {
      requestId: req.requestId,
      userId: req.session?.user?.id,
      username: req.session?.user?.username
    });

    req.session.destroy((err: any) => {
      if (err) {
        routeLogger.error("POST /api/auth/logout", "Session destruction failed", {
          requestId: req.requestId,
          error: err.message
        });
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      routeLogger.info("POST /api/auth/logout", "Logout successful", {
        requestId: req.requestId
      });
      res.json({ message: "Logged out successfully" });
    });
  });

  // Onboarding route
  app.post("/api/auth/onboard", requireAuth, async (req: any, res) => {
    try {
      const validatedData = onboardingSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(req.session.user.id, {
        adminName: validatedData.adminName,
        shopName: validatedData.shopName,
        industry: validatedData.industry,
        isOnboarded: true
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update session
      req.session.user = {
        id: updatedUser.id,
        username: updatedUser.username,
        isOnboarded: updatedUser.isOnboarded
      };

      const userData = {
        id: updatedUser.id,
        username: updatedUser.username,
        adminName: updatedUser.adminName,
        shopName: updatedUser.shopName,
        industry: updatedUser.industry,
        isOnboarded: updatedUser.isOnboarded,
        createdAt: updatedUser.createdAt
      };

      res.json(userData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Settings route
  app.patch("/api/auth/settings", requireAuth, async (req: any, res) => {
    try {
      const allowedFields = ['adminName', 'shopName', 'industry'];
      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
      );

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updatedUser = await storage.updateUser(req.session.user.id, updateData);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData = {
        id: updatedUser.id,
        username: updatedUser.username,
        adminName: updatedUser.adminName,
        shopName: updatedUser.shopName,
        industry: updatedUser.industry,
        isOnboarded: updatedUser.isOnboarded,
        createdAt: updatedUser.createdAt
      };

      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Customer routes
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

  // Get customer by phone number (for bill scanner)
  app.get("/api/customers/phone/:phoneNumber", async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
      
      const customer = await storage.getCustomerByPhone(cleanPhone);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json({
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        points: customer.points,
        pointsEarned: customer.pointsEarned,
        pointsRedeemed: customer.pointsRedeemed,
        totalReferrals: customer.totalReferrals,
        referralCode: customer.referralCode,
        isActive: customer.isActive,
        createdAt: customer.createdAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to find customer" });
    }
  });

  // Get customer points history
  app.get("/api/customers/:id/points-history", async (req, res) => {
    try {
      const { id } = req.params;
      
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Mock points history - in a real implementation, you'd query a points_transactions table
      const pointsHistory = [
        {
          id: "1",
          type: "earned",
          points: customer.pointsEarned > 0 ? Math.floor(customer.pointsEarned * 0.7) : 0,
          description: "Bill scan points earned",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "2",
          type: "earned",
          points: customer.pointsEarned > 0 ? Math.floor(customer.pointsEarned * 0.3) : 0,
          description: "Referral bonus points",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      if (customer.pointsRedeemed > 0) {
        pointsHistory.push({
          id: "3",
          type: "redeemed",
          points: -customer.pointsRedeemed,
          description: "Coupon redemption",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      res.json(pointsHistory.filter(h => h.points !== 0));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch points history" });
    }
  });

  // Get customer coupon usage
  app.get("/api/customers/:id/coupon-usage", async (req, res) => {
    try {
      const { id } = req.params;
      
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Mock coupon usage - in a real implementation, you'd query a coupon_usage table
      const couponUsage = [];
      
      if (customer.pointsRedeemed > 0) {
        couponUsage.push({
          id: "1",
          code: "SAVE20",
          pointsUsed: customer.pointsRedeemed,
          discountAmount: (customer.pointsRedeemed * 0.1).toString(), // 1 point = ₹0.1 discount
          usedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: "used"
        });
      }

      res.json(couponUsage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coupon usage" });
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

      // Customer created successfully
      console.log(`✅ Customer created successfully: ${customer.name} (${customer.phoneNumber}) with referral code: ${referralCode}`);
      
      res.status(201).json({
        customer,
        referralCode,
        message: "Customer created successfully!"
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
      
      // Check if points were manually updated (no messaging needed)
      if (req.body.points && req.body.points !== existingCustomer.points) {
        const pointsDifference = req.body.points - existingCustomer.points;
        console.log(`✅ Points updated for ${customer.name}: ${pointsDifference > 0 ? '+' : ''}${pointsDifference} points`);
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Delete customer
  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Failed to delete customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
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

  app.post("/api/campaigns", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Points redemption
  app.post("/api/customers/:id/redeem-points", requireAuth, async (req, res) => {
    try {
      const { pointsToRedeem, rewardDescription } = req.body;

      if (!pointsToRedeem || pointsToRedeem <= 0) {
        return res.status(400).json({ message: "Invalid points amount" });
      }

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

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      const campaigns = await storage.getAllCampaigns();
      const referrals = await storage.getAllReferrals();

      const stats = {
        totalCustomers: customers.length,
        activeCustomers: customers.filter((c: any) => c.isActive).length,
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c: any) => c.isActive).length,
        totalReferrals: referrals.length,
        totalPointsDistributed: customers.reduce((sum: number, c: any) => sum + c.pointsEarned, 0),
        totalPointsRedeemed: customers.reduce((sum: number, c: any) => sum + c.pointsRedeemed, 0)
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // OCR Bill Processing endpoints
  
  // Upload bill image for OCR processing
  app.post("/api/bills/upload", async (req, res) => {
    try {
      const { customerId, referralCode, imageData } = req.body;

      if (!customerId || !imageData) {
        return res.status(400).json({ message: "Customer ID and image data are required" });
      }

      // Verify customer exists
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Process OCR data
      const ocrResult = await (storage as any).processOCRData(imageData);

      // Check for duplicate bills using hash
      const billHash = Buffer.from(`${ocrResult.invoiceNumber}-${ocrResult.storeName}-${ocrResult.billDate.split('T')[0]}`).toString('base64').replace(/[+/=]/g, '');
      const existingBill = await (storage as any).getBillByHash(billHash);
      
      if (existingBill) {
        return res.status(409).json({ 
          message: "This bill has already been processed",
          existingBill: {
            id: existingBill.id,
            processedAt: existingBill.processedAt
          }
        });
      }

      // Calculate points based on bill amount (₹100 = 10 points)
      const pointsEarned = Math.floor(ocrResult.totalAmount / 10);
      
      // Handle referral if provided
      let referrer = null;
      let referrerPointsEarned = 0;
      if (referralCode) {
        referrer = await storage.getCustomerByCouponCode(referralCode);
        if (referrer) {
          referrerPointsEarned = Math.floor(pointsEarned * 0.1); // 10% bonus for referrer
        }
      }

      // Create bill record
      const billData = {
        customerId,
        invoiceNumber: ocrResult.invoiceNumber,
        storeId: ocrResult.storeId,
        storeName: ocrResult.storeName,
        billDate: new Date(ocrResult.billDate),
        billTime: ocrResult.billTime,
        totalAmount: ocrResult.totalAmount.toString(),
        originalImageUrl: null, // Would store in cloud storage in production
        ocrRawData: ocrResult.rawData,
        pointsEarned,
        referralCode: referralCode || null,
        referrerId: referrer?.id || null,
        referrerPointsEarned,
        status: "processed",
        isValid: true
      };

      const bill = await (storage as any).createBill(billData);

      // Create bill items if available
      if (ocrResult.items && ocrResult.items.length > 0) {
        for (const item of ocrResult.items) {
          await (storage as any).createBillItem({
            billId: bill.id,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice?.toString(),
            totalPrice: item.totalPrice.toString()
          });
        }
      }

      // Update customer points
      await storage.updateCustomer(customerId, {
        points: customer.points + pointsEarned,
        pointsEarned: customer.pointsEarned + pointsEarned
      });

      // Update referrer points if applicable
      if (referrer && referrerPointsEarned > 0) {
        await storage.updateCustomer(referrer.id, {
          points: referrer.points + referrerPointsEarned,
          pointsEarned: referrer.pointsEarned + referrerPointsEarned
        });
      }

      res.json({
        success: true,
        bill: {
          id: bill.id,
          invoiceNumber: bill.invoiceNumber,
          storeName: bill.storeName,
          totalAmount: bill.totalAmount,
          pointsEarned: bill.pointsEarned,
          processedAt: bill.processedAt
        },
        customer: {
          id: customer.id,
          name: customer.name,
          newPointsBalance: customer.points + pointsEarned
        },
        referrer: referrer ? {
          id: referrer.id,
          name: referrer.name,
          bonusPointsEarned: referrerPointsEarned
        } : null
      });
    } catch (error) {
      console.error("OCR processing error:", error);
      res.status(500).json({ message: "Failed to process bill" });
    }
  });

  // Get customer's bill history
  app.get("/api/bills/customer/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;
      
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const bills = await (storage as any).getBillsByCustomer(customerId);
      
      res.json({
        customer: {
          id: customer.id,
          name: customer.name,
          totalPoints: customer.points
        },
        bills: bills.map((bill: any) => ({
          id: bill.id,
          invoiceNumber: bill.invoiceNumber,
          storeName: bill.storeName,
          totalAmount: bill.totalAmount,
          pointsEarned: bill.pointsEarned,
          billDate: bill.billDate,
          processedAt: bill.processedAt,
          status: bill.status
        }))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bill history" });
    }
  });

  // Cashier endpoints
  
  // Get customer points balance (for cashier)
  app.get("/api/cashier/customer/:customerId/points", async (req, res) => {
    try {
      const { customerId } = req.params;
      
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json({
        customer: {
          id: customer.id,
          name: customer.name,
          phoneNumber: customer.phoneNumber,
          points: customer.points,
          pointsEarned: customer.pointsEarned,
          pointsRedeemed: customer.pointsRedeemed
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer points" });
    }
  });

  // Apply discount (for cashier)
  app.post("/api/cashier/apply-discount", async (req, res) => {
    try {
      const { customerId, cashierId, pointsToUse, discountPercent, originalAmount, notes } = req.body;

      if (!customerId || !cashierId || !pointsToUse) {
        return res.status(400).json({ message: "Customer ID, cashier ID, and points to use are required" });
      }

      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      if (customer.points < pointsToUse) {
        return res.status(400).json({ message: "Insufficient points" });
      }

      const cashier = await (storage as any).getCashier(cashierId);
      if (!cashier) {
        return res.status(404).json({ message: "Cashier not found" });
      }

      // Calculate discount amount (example: 1 point = ₹1 discount)
      const discountAmount = pointsToUse;
      const finalAmount = originalAmount ? Math.max(0, originalAmount - discountAmount) : null;

      // Create discount transaction
      const discountTransaction = await (storage as any).createDiscountTransaction({
        customerId,
        cashierId,
        pointsUsed: pointsToUse,
        discountPercent: discountPercent ? discountPercent.toString() : null,
        discountAmount: discountAmount.toString(),
        originalAmount: originalAmount ? originalAmount.toString() : null,
        finalAmount: finalAmount ? finalAmount.toString() : null,
        notes: notes || null,
        transactionType: "discount",
        status: "completed"
      });

      // Update customer points
      await storage.updateCustomer(customerId, {
        points: customer.points - pointsToUse,
        pointsRedeemed: customer.pointsRedeemed + pointsToUse
      });

      res.json({
        success: true,
        transaction: {
          id: discountTransaction.id,
          pointsUsed: discountTransaction.pointsUsed,
          discountAmount: discountTransaction.discountAmount,
          finalAmount: discountTransaction.finalAmount,
          appliedAt: discountTransaction.appliedAt
        },
        customer: {
          id: customer.id,
          name: customer.name,
          newPointsBalance: customer.points - pointsToUse
        },
        cashier: {
          id: cashier.id,
          name: cashier.name
        }
      });
    } catch (error) {
      console.error("Apply discount error:", error);
      res.status(500).json({ message: "Failed to apply discount" });
    }
  });

  // Get all cashiers
  app.get("/api/cashiers", async (req, res) => {
    try {
      const cashiers = await (storage as any).getActiveCashiers();
      res.json(cashiers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cashiers" });
    }
  });

  // Create cashier
  app.post("/api/cashiers", async (req, res) => {
    try {
      const { name, employeeId, phoneNumber } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Cashier name is required" });
      }

      const cashier = await (storage as any).createCashier({
        name,
        employeeId: employeeId || null,
        phoneNumber: phoneNumber || null,
        isActive: true
      });

      res.json({
        success: true,
        cashier
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create cashier" });
    }
  });

  // Admin audit endpoints
  
  // Get audit report - all bills and transactions
  app.get("/api/admin/audit-report", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const bills = await (storage as any).getAllBills();
      const discountTransactions = await (storage as any).getAllDiscountTransactions();
      
      // Filter by date range if provided
      let filteredBills = bills;
      let filteredTransactions = discountTransactions;
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        filteredBills = bills.filter((bill: any) => {
          const billDate = new Date(bill.processedAt);
          return billDate >= start && billDate <= end;
        });
        
        filteredTransactions = discountTransactions.filter((transaction: any) => {
          const transactionDate = new Date(transaction.appliedAt);
          return transactionDate >= start && transactionDate <= end;
        });
      }

      // Calculate summary statistics
      const totalBillsScanned = filteredBills.length;
      const totalPointsDistributed = filteredBills.reduce((sum: number, bill: any) => sum + (bill.pointsEarned || 0), 0);
      const totalDiscountsGiven = filteredTransactions.length;
      const totalDiscountAmount = filteredTransactions.reduce((sum: number, transaction: any) => sum + parseFloat(transaction.discountAmount || 0), 0);
      const totalPointsRedeemed = filteredTransactions.reduce((sum: number, transaction: any) => sum + (transaction.pointsUsed || 0), 0);

      res.json({
        summary: {
          totalBillsScanned,
          totalPointsDistributed,
          totalDiscountsGiven,
          totalDiscountAmount,
          totalPointsRedeemed,
          dateRange: { startDate, endDate }
        },
        bills: filteredBills.map((bill: any) => ({
          id: bill.id,
          customerId: bill.customerId,
          invoiceNumber: bill.invoiceNumber,
          storeName: bill.storeName,
          totalAmount: bill.totalAmount,
          pointsEarned: bill.pointsEarned,
          processedAt: bill.processedAt,
          status: bill.status
        })),
        discountTransactions: filteredTransactions.map((transaction: any) => ({
          id: transaction.id,
          customerId: transaction.customerId,
          cashierId: transaction.cashierId,
          pointsUsed: transaction.pointsUsed,
          discountAmount: transaction.discountAmount,
          appliedAt: transaction.appliedAt,
          status: transaction.status
        }))
      });
    } catch (error) {
      console.error("Audit report error:", error);
      res.status(500).json({ message: "Failed to generate audit report" });
    }
  });

  // QR Code customer registration endpoint (PWA)
  app.post("/api/register-customer", async (req, res) => {
    try {
      const { name, phoneNumber } = req.body;

      if (!name || !phoneNumber) {
        return res.status(400).json({ message: "Name and phone number are required" });
      }

      // Clean and validate phone number
      const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
      if (cleanPhone.length < 10) {
        return res.status(400).json({ message: "Invalid phone number" });
      }

      // Check if customer already exists
      const existingCustomer = await storage.getCustomerByPhone(cleanPhone);
      if (existingCustomer) {
        return res.json({
          customer: existingCustomer,
          referralCode: existingCustomer.referralCode,
          message: "Welcome back! Here's your coupon code.",
          isExistingCustomer: true
        });
      }

      // Generate unique referral code
      const referralCode = await storage.generateUniqueCode();

      // Create new customer
      const customer = await storage.createCustomer({
        name,
        phoneNumber: cleanPhone,
        referralCode
      });

      console.log(`✅ PWA Customer registered: ${customer.name} (${customer.phoneNumber}) with code: ${referralCode}`);

      res.status(201).json({
        customer,
        referralCode,
        message: "Registration successful! Here's your coupon code.",
        isExistingCustomer: false
      });
    } catch (error) {
      console.error("Failed to register customer via PWA:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // PWA manifest endpoint
  app.get("/api/pwa/manifest", (req, res) => {
    const manifest = {
      name: "Fruitbox Rewards",
      short_name: "Fruitbox",
      description: "Your loyalty rewards in your pocket - scan, earn, redeem!",
      start_url: "/register?utm_source=pwa",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#6366f1",
      scope: "/",
      orientation: "portrait-primary",
      categories: ["shopping", "business", "lifestyle"],
      lang: "en",
      dir: "ltr",
      prefer_related_applications: false,
      display_override: ["standalone", "minimal-ui"],
      icons: [
        {
          src: "/pwa-icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/pwa-icon-512.png",
          sizes: "512x512", 
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      shortcuts: [
        {
          name: "Track My Points",
          short_name: "Track",
          description: "View your points, rewards and coupon history",
          url: "/track",
          icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }]
        },
        {
          name: "Register",
          short_name: "Register", 
          description: "New customer registration",
          url: "/register",
          icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }]
        }
      ],
      related_applications: [],
      screenshots: []
    };

    res.setHeader('Content-Type', 'application/manifest+json');
    res.json(manifest);
  });

  const httpServer = createServer(app);
  return httpServer;
}