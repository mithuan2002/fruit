import type { Express, Request, Response } from "express";
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
  insertBillSchema,
  type User,
  type ProcessSale,
  type Customer,
  type Bill
} from "@shared/schema";
import { z } from "zod";
import { posManager, posWebhookSchema, SquareIntegration, ShopifyIntegration, GenericPOSIntegration } from "./posIntegration";
import { PointsCalculator } from "./pointsCalculator";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import { eq } from "drizzle-orm"; // Assuming drizzle-orm is used for database operations

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

  // Seed some sample products for testing (run once)
  app.post("/api/seed-products", async (req, res) => {
    try {
      const sampleProducts = [
        {
          name: "Premium Coffee",
          productCode: "COFFEE001",
          price: "15.99",
          description: "High-quality premium coffee beans",
          category: "Beverages",
          pointCalculationType: "fixed",
          fixedPoints: 5,
          minimumQuantity: 1,
          isActive: true
        },
        {
          name: "Chocolate Cake",
          productCode: "CAKE001",
          price: "25.50",
          description: "Delicious chocolate cake",
          category: "Desserts",
          pointCalculationType: "percentage",
          percentageRate: "10",
          minimumQuantity: 1,
          isActive: true
        },
        {
          name: "Sandwich Combo",
          productCode: "COMBO001",
          price: "12.99",
          description: "Sandwich with fries and drink",
          category: "Meals",
          pointCalculationType: "fixed",
          fixedPoints: 3,
          minimumQuantity: 1,
          isActive: true
        }
      ];

      const createdProducts = [];
      for (const productData of sampleProducts) {
        try {
          // Check if product already exists
          const existing = await storage.getProductByCode(productData.productCode);
          if (!existing) {
            const product = await storage.createProduct(productData);
            createdProducts.push(product);
            console.log(`✅ Sample product created: ${product.name} (${product.productCode})`);
          }
        } catch (error) {
          console.warn(`Could not create product ${productData.name}:`, error.message);
        }
      }

      res.json({
        success: true,
        message: `Created ${createdProducts.length} sample products`,
        products: createdProducts
      });
    } catch (error) {
      console.error("Failed to seed products:", error);
      res.status(500).json({ message: "Failed to seed products" });
    }
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
      console.log("Attempting to fetch customers...");
      const customers = await storage.getAllCustomers();
      console.log("Successfully fetched customers:", customers.length);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers", error: error instanceof Error ? error.message : String(error) });
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
        referralCode: customer.referralCode
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to find customer" });
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

  // Get active campaigns only
  app.get("/api/campaigns/active", async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      const activeCampaigns = campaigns.filter(c => c.isActive);
      res.json(activeCampaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active campaigns" });
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

  // Get active products only
  app.get("/api/products/active", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const activeProducts = products.filter(p => p.isActive);
      res.json(activeProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active products" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);

      // Ensure product code is uppercase for consistency
      if (validatedData.productCode) {
        validatedData.productCode = validatedData.productCode.toUpperCase();
      }

      const product = await storage.createProduct(validatedData);
      console.log(`✅ Product created: ${product.name} with code: ${product.productCode}`);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Failed to create product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Ensure product code is uppercase for consistency
      if (updateData.productCode) {
        updateData.productCode = updateData.productCode.toUpperCase();
      }

      const updatedProduct = await storage.updateProduct(id, updateData);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      console.log(`✅ Product updated: ${updatedProduct.name} with code: ${updatedProduct.productCode}`);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Failed to update product:", error);
      res.status(500).json({ message: "Failed to update product" });
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

  // Point Rules endpoints
  app.get("/api/point-rules", requireAuth, async (req, res) => {
    try {
      // Get all products and campaigns with their point settings
      const products = await storage.getAllProducts();
      const campaigns = await storage.getAllCampaigns();

      const pointRules: any[] = [];

      // Convert products to point rules format
      products.forEach(product => {
        if (product.pointCalculationType !== 'inherit') {
          pointRules.push({
            id: product.id,
            type: 'product',
            targetId: product.id,
            targetName: product.name,
            productCode: product.productCode,
            pointsType: product.pointCalculationType,
            pointsValue: product.pointCalculationType === 'fixed' ? product.fixedPoints : 
                        product.pointCalculationType === 'percentage' ? parseFloat(product.percentageRate || '0') : 0,
            minQuantity: product.minimumQuantity || 1,
            description: product.description || '',
            isActive: product.isActive,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
          });
        }
      });

      // Convert campaigns to point rules format
      campaigns.forEach(campaign => {
        pointRules.push({
          id: campaign.id,
          type: 'campaign',
          targetId: campaign.id,
          targetName: campaign.name,
          pointsType: campaign.pointCalculationType,
          pointsValue: campaign.pointCalculationType === 'fixed' ? campaign.rewardPerReferral : 
                      campaign.pointCalculationType === 'percentage' ? parseFloat(campaign.percentageRate || '0') : 0,
          description: campaign.description || '',
          isActive: campaign.isActive,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt
        });
      });

      res.json(pointRules);
    } catch (error) {
      console.error("Failed to fetch point rules:", error);
      res.status(500).json({ message: "Failed to fetch point rules" });
    }
  });

  app.post("/api/point-rules", requireAuth, async (req, res) => {
    try {
      const ruleData = req.body;

      routeLogger.info("POINT-RULES", "Creating point rule", {
        requestId: req.requestId,
        ruleData
      });

      // Validate required fields
      if (!ruleData.targetName || !ruleData.pointsValue) {
        return res.status(400).json({ message: "Target name and points value are required" });
      }

      let savedRule;

      if (ruleData.type === 'product') {
        // Create or update product with point calculation settings
        if (ruleData.targetId && ruleData.targetId !== 'manual-product') {
          // Update existing product
          routeLogger.debug("POINT-RULES", "Updating existing product", { productId: ruleData.targetId });
          const updatedProduct = await storage.updateProduct(ruleData.targetId, {
            pointCalculationType: ruleData.pointsType,
            fixedPoints: ruleData.pointsType === 'fixed' ? ruleData.pointsValue : null,
            percentageRate: ruleData.pointsType === 'percentage' ? ruleData.pointsValue.toString() : null,
            minimumQuantity: ruleData.minQuantity || 1
          });
          savedRule = updatedProduct;
        } else {
          // Create new product for manual entry
          routeLogger.debug("POINT-RULES", "Creating new product for manual entry");
          const productData = {
            name: ruleData.targetName,
            productCode: ruleData.productCode || ruleData.targetName.toUpperCase().replace(/\s+/g, ''),
            description: ruleData.description || `Points rule for ${ruleData.targetName}`,
            price: "0.00", // Default price, can be updated later
            category: "General",
            pointCalculationType: ruleData.pointsType,
            fixedPoints: ruleData.pointsType === 'fixed' ? ruleData.pointsValue : null,
            percentageRate: ruleData.pointsType === 'percentage' ? ruleData.pointsValue.toString() : null,
            minimumQuantity: ruleData.minQuantity || 1,
            isActive: true
          };

          routeLogger.debug("POINT-RULES", "Product data prepared", { productData });
          const newProduct = await storage.createProduct(productData);
          savedRule = newProduct;
        }
      } else {
        // Create or update campaign
        if (ruleData.targetId) {
          // Update existing campaign
          routeLogger.debug("POINT-RULES", "Updating existing campaign", { campaignId: ruleData.targetId });
          const updatedCampaign = await storage.updateCampaign(ruleData.targetId, {
            pointCalculationType: ruleData.pointsType,
            rewardPerReferral: ruleData.pointsType === 'fixed' ? ruleData.pointsValue : 0,
            percentageRate: ruleData.pointsType === 'percentage' ? ruleData.pointsValue.toString() : null
          });
          savedRule = updatedCampaign;
        } else {
          // Create new campaign
          routeLogger.debug("POINT-RULES", "Creating new campaign");
          const newCampaign = await storage.createCampaign({
            name: ruleData.targetName,
            description: ruleData.description || `Campaign for ${ruleData.targetName}`,
            pointCalculationType: ruleData.pointsType,
            rewardPerReferral: ruleData.pointsType === 'fixed' ? ruleData.pointsValue : 0,
            percentageRate: ruleData.pointsType === 'percentage' ? ruleData.pointsValue.toString() : null,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            isActive: true
          });
          savedRule = newCampaign;
        }
      }

      if (!savedRule) {
        throw new Error("Failed to create or update rule - no result returned");
      }

      routeLogger.info("POINT-RULES", "Points rule created successfully", {
        requestId: req.requestId,
        ruleId: savedRule.id,
        ruleName: ruleData.targetName
      });

      res.status(201).json({
        success: true,
        rule: {
          id: savedRule.id,
          type: ruleData.type,
          targetId: savedRule.id,
          targetName: savedRule.name,
          ...ruleData,
          createdAt: savedRule.createdAt,
          updatedAt: savedRule.updatedAt
        },
        message: `Points rule created successfully for ${ruleData.targetName}`
      });
    } catch (error) {
      routeLogger.error("POINT-RULES", "Failed to create point rule", {
        requestId: req.requestId,
        error: error.message,
        stack: error.stack,
        ruleData: req.body
      });
      res.status(500).json({ 
        message: "Failed to create point rule",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.put("/api/point-rules/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const ruleData = req.body;

      // Validate required fields
      if (!ruleData.targetName || !ruleData.pointsValue) {
        return res.status(400).json({ message: "Target name and points value are required" });
      }

      let updatedRule;

      if (ruleData.type === 'product') {
        updatedRule = await storage.updateProduct(id, {
          pointCalculationType: ruleData.pointsType,
          fixedPoints: ruleData.pointsType === 'fixed' ? ruleData.pointsValue : null,
          percentageRate: ruleData.pointsType === 'percentage' ? ruleData.pointsValue.toString() : null,
          minimumQuantity: ruleData.minQuantity || 1
        });
      } else {
        updatedRule = await storage.updateCampaign(id, {
          pointCalculationType: ruleData.pointsType,
          rewardPerReferral: ruleData.pointsType === 'fixed' ? ruleData.pointsValue : 0,
          percentageRate: ruleData.pointsType === 'percentage' ? ruleData.pointsValue.toString() : null
        });
      }

      console.log(`✅ Points rule updated: ${ruleData.targetName} - ${ruleData.pointsValue} points (${ruleData.pointsType})`);

      res.json({
        success: true,
        rule: {
          id: updatedRule.id,
          ...ruleData,
          updatedAt: updatedRule.updatedAt
        },
        message: `Points rule updated successfully for ${ruleData.targetName}`
      });
    } catch (error) {
      console.error("Failed to update point rule:", error);
      res.status(500).json({ message: "Failed to update point rule" });
    }
  });

  app.delete("/api/point-rules/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Check if it's a product or campaign first
      const product = await storage.getProduct(id);
      if (product) {
        // Reset product point calculation to inherit
        await storage.updateProduct(id, {
          pointCalculationType: 'inherit',
          fixedPoints: null,
          percentageRate: null
        });
      } else {
        // Try to find campaign and deactivate it
        const campaigns = await storage.getAllCampaigns();
        const campaign = campaigns.find(c => c.id === id);
        if (campaign) {
          await storage.updateCampaign(id, { isActive: false });
        }
      }

      console.log(`✅ Points rule deleted: ${id}`);

      res.json({
        success: true,
        message: "Points rule deleted successfully"
      });
    } catch (error) {
      console.error("Failed to delete point rule:", error);
      res.status(500).json({ message: "Failed to delete point rule" });
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

  // Submit bill for admin verification
  app.post("/api/bills/submit-verification", async (req: Request, res: Response) => {
    try {
      console.log("[ROUTE-DEBUG] Bill verification submission:", req.body);

      const { 
        customerPhone, 
        customerName, 
        customerId,
        referralCode,
        totalAmount, 
        invoiceNumber, 
        storeName,
        extractedText,
        ocrConfidence,
        imageData
      } = req.body;

      if (!customerPhone || !totalAmount) {
        return res.status(400).json({ 
          message: "Customer phone and total amount are required" 
        });
      }

      // Create or get customer
      let customer;
      if (customerId) {
        customer = await storage.getCustomerById(customerId);
      } else {
        customer = await storage.getCustomerByPhone(customerPhone);
      }

      if (!customer) {
        // Create new customer
        const newCustomer = await storage.createCustomer({
          name: customerName || `Customer ${customerPhone}`,
          phoneNumber: customerPhone,
          email: null,
        });
        customer = newCustomer;
      }

      // Create pending bill record
      const billData = {
        customerId: customer.id,
        totalAmount,
        invoiceNumber: invoiceNumber || null,
        storeName: storeName || null,
        extractedText: extractedText || '',
        ocrConfidence: ocrConfidence || 0,
        imageData: imageData || null,
        referralCode: referralCode || null,
        status: 'PENDING_VERIFICATION',
        submittedAt: new Date().toISOString(),
      };

      const pendingBill = await storage.createPendingBill(billData);

      // TODO: Send notification to admin (WhatsApp/Email)
      console.log(`[NOTIFICATION] New bill submitted for verification: ${pendingBill.id}`);

      res.json({
        success: true,
        message: "Bill submitted for verification successfully",
        bill: {
          id: pendingBill.id,
          status: 'PENDING_VERIFICATION',
          submittedAt: pendingBill.submittedAt,
        },
        customer: {
          id: customer.id,
          name: customer.name,
        }
      });

    } catch (error) {
      console.error("Bill verification submission error:", error);
      res.status(500).json({ 
        message: "Failed to submit bill for verification",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Process bill with OCR and assign points (for admin use)
  app.post("/api/bills/process", async (req: Request, res: Response) => {
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
      const ocrResult = await storage.processOCRData(imageData);

      // Check for duplicate bills using hash
      const billHash = Buffer.from(`${ocrResult.invoiceNumber}-${ocrResult.storeName}-${ocrResult.billDate.split('T')[0]}`).toString('base64').replace(/[+/=]/g, '');
      const existingBill = await storage.getBillByHash(billHash);

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
        status: "processed" as const,
        isValid: true,
        billHash
      };

      const bill = await storage.createBill(billData);

      // Create bill items if available
      if (ocrResult.items && ocrResult.items.length > 0) {
        for (const item of ocrResult.items) {
          await storage.createBillItem({
            billId: bill.id,
            itemName: item.name,
            quantity: item.quantity,
            unitPrice: item.price.toString(),
            totalPrice: item.total.toString()
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

      const bills = await storage.getBillsByCustomer(customerId);

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

  // Get pending bills for admin verification
  app.get("/api/admin/pending-bills", async (req: Request, res: Response) => {
    try {
      const pendingBills = await storage.getPendingBills();
      res.json(pendingBills);
    } catch (error) {
      console.error("Failed to fetch pending bills:", error);
      res.status(500).json({ message: "Failed to fetch pending bills" });
    }
  });

  // Admin approve bill
  app.post("/api/admin/approve-bill/:billId", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      console.log(`[ADMIN] Approving bill: ${billId}`);

      // Fetch pending bill details to process points
      const pendingBill = await storage.getPendingBill(billId);
      if (!pendingBill) {
        return res.status(404).json({ message: "Pending bill not found" });
      }

      // Process the bill: calculate points, update customer, create bill record
      const { customerId, referralCode, totalAmount, invoiceNumber, storeName, extractedText, ocrConfidence } = pendingBill;

      // Calculate points based on bill amount (₹100 = 10 points)
      const pointsEarned = Math.floor(parseFloat(totalAmount) / 10);

      // Handle referral if provided
      let referrer = null;
      let referrerPointsEarned = 0;
      if (referralCode) {
        referrer = await storage.getCustomerByCouponCode(referralCode);
        if (referrer) {
          referrerPointsEarned = Math.floor(pointsEarned * 0.1); // 10% bonus for referrer
        }
      }

      // Update customer points
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

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

      // Create the final bill record and mark pending bill as processed
      const billData = {
        customerId,
        invoiceNumber: invoiceNumber || null,
        storeName: storeName || null,
        billDate: new Date(pendingBill.submittedAt), // Use submission date or date from extracted text if available
        billTime: null, // Time not explicitly captured in pending bill
        totalAmount: totalAmount,
        originalImageUrl: null, // URL from cloud storage in production
        ocrRawData: extractedText, // Store extracted text as raw data
        pointsEarned,
        referralCode: referralCode || null,
        referrerId: referrer?.id || null,
        referrerPointsEarned,
        status: "processed" as const,
        isValid: true,
        billHash: null // Hash calculation might need invoiceNumber, storeName, billDate from extracted text
      };

      // Calculate hash if possible
      if (invoiceNumber && storeName && pendingBill.submittedAt) {
        billData.billHash = Buffer.from(`${invoiceNumber}-${storeName}-${new Date(pendingBill.submittedAt).toISOString().split('T')[0]}`).toString('base64').replace(/[+/=]/g, '');
      }

      const bill = await storage.createBill(billData);

      // Mark pending bill as processed
      await storage.updatePendingBillStatus(billId, 'APPROVED', bill.id);

      console.log(`[ADMIN] Bill ${billId} approved successfully. Points awarded: ${pointsEarned}`);
      res.json({
        success: true,
        message: "Bill approved and points awarded successfully",
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
      console.error(`Failed to approve bill ${req.params.billId}:`, error);
      res.status(500).json({ 
        message: "Failed to approve bill",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin reject bill
  app.post("/api/admin/reject-bill/:billId", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const { reason } = req.body;

      console.log(`[ADMIN] Rejecting bill: ${billId}, reason: ${reason}`);

      // Update pending bill status to rejected
      await storage.updatePendingBillStatus(billId, 'REJECTED', null, reason);

      console.log(`[ADMIN] Bill ${billId} rejected successfully`);
      res.json({
        success: true,
        message: "Bill rejected successfully",
      });
    } catch (error) {
      console.error(`Failed to reject bill ${req.params.billId}:`, error);
      res.status(500).json({ 
        message: "Failed to reject bill",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get customer dashboard data
  app.get("/api/customer/dashboard/:customerId", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Get customer's transaction history (sales where they used their coupon)
      const transactions = await storage.getCustomerTransactions?.(customer.id) || [];

      res.json({
        customer: {
          id: customer.id,
          name: customer.name,
          phoneNumber: customer.phoneNumber,
          points: customer.points,
          pointsRedeemed: customer.pointsRedeemed,
          totalPurchases: customer.totalPurchases || 0,
          referralCode: customer.referralCode,
          createdAt: customer.createdAt
        },
        transactions,
        totalPointsEarned: customer.points + customer.pointsRedeemed
      });
    } catch (error) {
      console.error("Failed to fetch customer dashboard data:", error);
      res.status(500).json({ message: "Failed to load dashboard" });
    }
  });

  // PWA manifest endpoint
  app.get("/api/pwa/manifest", (req, res) => {
    const manifest = {
      name: "Fruitbox Rewards",
      short_name: "Fruitbox",
      description: "Your loyalty rewards in your pocket - scan, earn, redeem!",
      start_url: "/customer-app",
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
          name: "My Rewards",
          short_name: "Rewards",
          description: "View your coupon and points",
          url: "/customer-app",
          icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }]
        },
        {
          name: "Register",
          short_name: "Register",
          description: "Quick customer registration",
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