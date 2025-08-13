import { z } from "zod";

// Common customer data structure from POS systems
export const posCustomerSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  totalSpent: z.number().optional(),
  lastPurchase: z.string().optional(),
  source: z.string() // POS system name
});

export type POSCustomer = z.infer<typeof posCustomerSchema>;

// POS webhook payload schema
export const posWebhookSchema = z.object({
  event: z.enum(["sale", "customer_created", "customer_updated"]),
  customer: posCustomerSchema,
  transaction: z.object({
    id: z.string(),
    amount: z.number(),
    date: z.string(),
    items: z.array(z.object({
      name: z.string(),
      price: z.number(),
      quantity: z.number()
    })).optional()
  }).optional()
});

export type POSWebhook = z.infer<typeof posWebhookSchema>;

// Generic POS integration interface
export interface POSIntegration {
  name: string;
  authenticate(): Promise<boolean>;
  getCustomers(): Promise<POSCustomer[]>;
  syncCustomer(customer: POSCustomer): Promise<void>;
  setupWebhook(url: string): Promise<string>; // Returns webhook ID
}

// Square POS Integration
export class SquareIntegration implements POSIntegration {
  name = "Square";
  private apiKey: string;
  private environment: string;

  constructor(apiKey: string, environment: string = "sandbox") {
    this.apiKey = apiKey;
    this.environment = environment;
  }

  async authenticate(): Promise<boolean> {
    try {
      const baseUrl = this.environment === "production" 
        ? "https://connect.squareup.com" 
        : "https://connect.squareupsandbox.com";
      
      const response = await fetch(`${baseUrl}/v2/locations`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Square-Version": "2023-10-18"
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error("Square authentication failed:", error);
      return false;
    }
  }

  async getCustomers(): Promise<POSCustomer[]> {
    const baseUrl = this.environment === "production" 
      ? "https://connect.squareup.com" 
      : "https://connect.squareupsandbox.com";
    
    const response = await fetch(`${baseUrl}/v2/customers`, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Square-Version": "2023-10-18"
      }
    });

    const data = await response.json();
    
    return data.customers?.map((customer: any) => ({
      id: customer.id,
      name: `${customer.given_name || ""} ${customer.family_name || ""}`.trim(),
      phone: customer.phone_number,
      email: customer.email_address,
      source: "Square"
    })) || [];
  }

  async syncCustomer(customer: POSCustomer): Promise<void> {
    // Implementation for syncing customer back to Square if needed
    console.log(`Syncing customer ${customer.name} to Square`);
  }

  async setupWebhook(url: string): Promise<string> {
    const baseUrl = this.environment === "production" 
      ? "https://connect.squareup.com" 
      : "https://connect.squareupsandbox.com";
    
    const response = await fetch(`${baseUrl}/v2/webhooks/subscriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Square-Version": "2023-10-18",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subscription: {
          name: "Fruitbox Customer Sync",
          event_types: ["customer.created", "customer.updated"],
          notification_url: url,
          api_version: "2023-10-18"
        }
      })
    });

    const data = await response.json();
    return data.subscription?.id || "";
  }
}

// Shopify POS Integration
export class ShopifyIntegration implements POSIntegration {
  name = "Shopify";
  private shopUrl: string;
  private accessToken: string;

  constructor(shopUrl: string, accessToken: string) {
    this.shopUrl = shopUrl;
    this.accessToken = accessToken;
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`https://${this.shopUrl}/admin/api/2023-10/shop.json`, {
        headers: {
          "X-Shopify-Access-Token": this.accessToken
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error("Shopify authentication failed:", error);
      return false;
    }
  }

  async getCustomers(): Promise<POSCustomer[]> {
    const response = await fetch(`https://${this.shopUrl}/admin/api/2023-10/customers.json`, {
      headers: {
        "X-Shopify-Access-Token": this.accessToken
      }
    });

    const data = await response.json();
    
    return data.customers?.map((customer: any) => ({
      id: customer.id.toString(),
      name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
      phone: customer.phone,
      email: customer.email,
      totalSpent: parseFloat(customer.total_spent || "0"),
      source: "Shopify"
    })) || [];
  }

  async syncCustomer(customer: POSCustomer): Promise<void> {
    console.log(`Syncing customer ${customer.name} to Shopify`);
  }

  async setupWebhook(url: string): Promise<string> {
    const response = await fetch(`https://${this.shopUrl}/admin/api/2023-10/webhooks.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        webhook: {
          topic: "customers/create",
          address: url,
          format: "json"
        }
      })
    });

    const data = await response.json();
    return data.webhook?.id?.toString() || "";
  }
}

// Generic POS Integration (for custom APIs)
export class GenericPOSIntegration implements POSIntegration {
  name = "Generic";
  private apiUrl: string;
  private headers: Record<string, string>;

  constructor(apiUrl: string, headers: Record<string, string>) {
    this.apiUrl = apiUrl;
    this.headers = headers;
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        headers: this.headers
      });
      return response.ok;
    } catch (error) {
      console.error("Generic POS authentication failed:", error);
      return false;
    }
  }

  async getCustomers(): Promise<POSCustomer[]> {
    const response = await fetch(`${this.apiUrl}/customers`, {
      headers: this.headers
    });

    const data = await response.json();
    return data.map((customer: any) => ({
      ...customer,
      source: "Generic"
    }));
  }

  async syncCustomer(customer: POSCustomer): Promise<void> {
    console.log(`Syncing customer ${customer.name} to Generic POS`);
  }

  async setupWebhook(url: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}/webhooks`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        events: ["customer.created", "customer.updated"]
      })
    });

    const data = await response.json();
    return data.id || "";
  }
}

// POS Manager - handles multiple integrations
export class POSManager {
  private integrations: Map<string, POSIntegration> = new Map();

  addIntegration(integration: POSIntegration) {
    this.integrations.set(integration.name, integration);
  }

  async syncAllCustomers(): Promise<POSCustomer[]> {
    const allCustomers: POSCustomer[] = [];
    
    for (const [name, integration] of Array.from(this.integrations.entries())) {
      try {
        console.log(`Syncing customers from ${name}...`);
        const customers = await integration.getCustomers();
        allCustomers.push(...customers);
      } catch (error) {
        console.error(`Failed to sync customers from ${name}:`, error);
      }
    }
    
    return allCustomers;
  }

  async setupWebhooks(baseUrl: string): Promise<Record<string, string>> {
    const webhookIds: Record<string, string> = {};
    
    for (const [name, integration] of Array.from(this.integrations.entries())) {
      try {
        const webhookId = await integration.setupWebhook(`${baseUrl}/api/pos/webhook/${name.toLowerCase()}`);
        webhookIds[name] = webhookId;
      } catch (error) {
        console.error(`Failed to setup webhook for ${name}:`, error);
      }
    }
    
    return webhookIds;
  }

  getIntegration(name: string): POSIntegration | undefined {
    return this.integrations.get(name);
  }

  getAllIntegrations(): POSIntegration[] {
    return Array.from(this.integrations.values());
  }
}

export const posManager = new POSManager();