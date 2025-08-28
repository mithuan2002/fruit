import express, { type Request, Response, NextFunction } from "express";
import { setupRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Enhanced logging utility
const logger = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${timestamp}] [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

const app = express();

// Request ID middleware for tracking
app.use((req: any, res, next) => {
  req.requestId = Math.random().toString(36).substring(7);
  logger.debug(`Incoming request: ${req.method} ${req.path}`, {
    requestId: req.requestId,
    headers: req.headers,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req: any, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const method = req.method;

    // Log all requests with detailed information
    const logData = {
      requestId: req.requestId,
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      session: req.session ? { userId: req.session.user?.id, username: req.session.user?.username } : 'No session'
    };

    if (statusCode >= 400) {
      logger.error(`Request failed: ${method} ${path}`, {
        ...logData,
        response: capturedJsonResponse,
        query: req.query,
        body: method !== 'GET' ? req.body : undefined
      });
    } else if (path.startsWith("/api")) {
      logger.info(`API Request: ${method} ${path} ${statusCode} in ${duration}ms`, logData);
    } else {
      logger.debug(`Static Request: ${method} ${path} ${statusCode} in ${duration}ms`, logData);
    }

    // Keep the original short log for API requests
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && Object.keys(capturedJsonResponse).length > 0) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${responseStr.length > 100 ? responseStr.slice(0, 97) + "..." : responseStr}`;
      }
      log(logLine);
    }
  });

  next();
});

// Verify database connection on startup
async function verifyDatabaseConnection() {
  try {
    // Test basic connection
    await sql`SELECT 1 as test`;
    console.log("✅ Database connection verified");
    
    // Test table existence
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    console.log(`✅ Found ${tables.length} tables in database`);
    
    if (tables.length === 0) {
      console.log("⚠️  No tables found. You may need to run database migrations.");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    console.log("Please ensure DATABASE_URL is set and the database is accessible");
    console.log("If using Replit Database, make sure it's properly provisioned");
  }
}


(async () => {
  try {
    logger.info("Starting server initialization...");

    logger.debug("Environment variables check", {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      SESSION_SECRET: process.env.SESSION_SECRET ? 'Set' : 'Not set'
    });

    logger.info("Registering routes...");
    const server = setupRoutes(app);
    logger.info("Routes registered successfully");

    app.use((err: any, req: any, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      logger.error("Express error handler triggered", {
        requestId: req.requestId,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
          status
        },
        request: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.body,
          headers: req.headers
        }
      });

      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      logger.info("Setting up Vite for development...");
      
      // CRITICAL FIX: Serve service worker and PWA assets from public folder BEFORE Vite
      const path = await import('path');
      const express = await import('express');
      const publicPath = path.default.resolve(import.meta.dirname, "../public");
      
      // Explicitly serve service worker and PWA files
      app.get('/sw.js', express.default.static(publicPath));
      app.get('/pwa-icon-*.png', express.default.static(publicPath));
      app.get('/manifest.json', express.default.static(publicPath));
      logger.info("Static PWA assets served from public folder");
      
      await setupVite(app, server);
      logger.info("Vite setup completed");
    } else {
      logger.info("Setting up static file serving for production...");
      serveStatic(app);
      logger.info("Static file serving setup completed");
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);

    logger.info(`Starting server on port ${port}...`);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, async () => {
      logger.info(`Server successfully started and listening on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`serving on port ${port}`);
      await verifyDatabaseConnection();
    });

    server.on('error', (error: any) => {
      logger.error("Server error occurred", error);
    });

  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
})();