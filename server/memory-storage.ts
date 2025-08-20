import {
  type Customer,
  type InsertCustomer,
  type Campaign,
  type InsertCampaign,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Referral,
  type InsertReferral
} from "@shared/schema";
import { randomUUID } from "crypto";

export class MemoryStorage {
  private customers: Map<string, Customer> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private referrals: Map<string, Referral> = new Map();

  // Helper to generate sequential numbers for customer referral codes
  private codeCounter = 1000;

  async generateUniqueCode(): Promise<string> {
    let code: string;
    do {
      code = `FB${this.codeCounter++}`;
    } while (Array.from(this.customers.values()).some(c => c.referralCode === code));
    return code;
  }

  // Customer operations
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(c => c.phoneNumber === phoneNumber);
  }

  async getCustomerByCouponCode(couponCode: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(c => c.referralCode === couponCode);
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const now = new Date();
    
    const customer: Customer = {
      id,
      name: data.name,
      email: data.email || null,
      phoneNumber: data.phoneNumber,
      points: data.points || 0,
      totalReferrals: data.totalReferrals || 0,
      referralCode: data.referralCode || await this.generateUniqueCode(),
      pointsEarned: data.pointsEarned || 0,
      pointsRedeemed: data.pointsRedeemed || 0,
      isActive: data.isActive ?? true,
      lastActivity: data.lastActivity || now,
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer = {
      ...customer,
      ...updates,
      updatedAt: new Date()
    };

    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    
    const user: User = {
      id,
      username: data.username,
      password: data.password,
      adminName: data.adminName || null,
      shopName: data.shopName || null,
      industry: data.industry || null,
      isOnboarded: data.isOnboarded || false,
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Campaign operations
  async getAllCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.isActive);
  }

  async createCampaign(data: InsertCampaign): Promise<Campaign> {
    const id = randomUUID();
    const now = new Date();
    
    const campaign: Campaign = {
      id,
      name: data.name,
      description: data.description || null,
      pointCalculationType: data.pointCalculationType || "fixed",
      rewardPerReferral: data.rewardPerReferral,
      percentageRate: data.percentageRate || null,
      minimumPurchase: data.minimumPurchase || "0",
      maximumPoints: data.maximumPoints || null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive ?? true,
      participantCount: data.participantCount || 0,
      referralsCount: data.referralsCount || 0,
      goalCount: data.goalCount || 100,
      budget: data.budget || null,
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    this.campaigns.set(id, campaign);
    return campaign;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getActiveProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const now = new Date();
    
    const product: Product = {
      id,
      name: data.name,
      productCode: data.productCode,
      price: data.price?.toString() || "0",
      description: data.description || null,
      category: data.category || null,
      sku: data.sku || null,
      imageUrl: data.imageUrl || null,
      isActive: data.isActive ?? true,
      stockQuantity: data.stockQuantity || 0,
      pointCalculationType: data.pointCalculationType || "inherit",
      fixedPoints: data.fixedPoints || null,
      percentageRate: data.percentageRate || null,
      minimumQuantity: data.minimumQuantity || 1,
      bonusMultiplier: data.bonusMultiplier || "1.0",
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    this.products.set(id, product);
    return product;
  }

  // Referral operations
  async getAllReferrals(): Promise<Referral[]> {
    return Array.from(this.referrals.values());
  }

  async createReferral(data: InsertReferral): Promise<Referral> {
    const id = randomUUID();
    const now = new Date();
    
    const referral: Referral = {
      id,
      referrerId: data.referrerId,
      referredId: data.referredId,
      campaignId: data.campaignId || null,
      status: data.status || "pending",
      pointsEarned: data.pointsEarned || 0,
      referralDate: data.referralDate || now,
      completionDate: data.completionDate || null,
      metadata: data.metadata || null,
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    this.referrals.set(id, referral);
    return referral;
  }

  // Placeholder methods for interface compatibility
  async getCampaign(): Promise<Campaign | undefined> { return undefined; }
  async updateCampaign(): Promise<Campaign | undefined> { return undefined; }
  async deleteCampaign(): Promise<boolean> { return false; }
  async getCoupon(): Promise<any> { return undefined; }
  async getCouponByCode(): Promise<any> { return undefined; }
  async getCouponsByCustomer(): Promise<any[]> { return []; }
  async getAllCoupons(): Promise<any[]> { return []; }
  async getActiveCoupons(): Promise<any[]> { return []; }
  async createCoupon(): Promise<any> { throw new Error("Not implemented"); }
  async updateCoupon(): Promise<any> { return undefined; }
  async deleteCoupon(): Promise<boolean> { return false; }
  async getReferral(): Promise<any> { return undefined; }
  async getReferralsByCustomer(): Promise<any[]> { return []; }
  async getReferralsByCampaign(): Promise<any[]> { return []; }
  async updateReferral(): Promise<any> { return undefined; }
  async deleteReferral(): Promise<boolean> { return false; }
  async createWhatsappMessage(): Promise<any> { throw new Error("WhatsApp removed"); }
  async getAllWhatsappMessages(): Promise<any[]> { return []; }
  async getWhatsappMessagesByCustomer(): Promise<any[]> { return []; }
  async updateWhatsappMessage(): Promise<any> { return undefined; }
  async deleteWhatsappMessage(): Promise<boolean> { return false; }
  async createPointsTransaction(): Promise<any> { throw new Error("Not implemented"); }
  async getPointsTransactionsByCustomer(): Promise<any[]> { return []; }
  async getAllPointsTransactions(): Promise<any[]> { return []; }
  async updatePointsTransaction(): Promise<any> { return undefined; }
  async deletePointsTransaction(): Promise<boolean> { return false; }
  async createReward(): Promise<any> { throw new Error("Not implemented"); }
  async getAllRewards(): Promise<any[]> { return []; }
  async getActiveRewards(): Promise<any[]> { return []; }
  async updateReward(): Promise<any> { return undefined; }
  async deleteReward(): Promise<boolean> { return false; }
  async createRewardRedemption(): Promise<any> { throw new Error("Not implemented"); }
  async getRewardRedemptionsByCustomer(): Promise<any[]> { return []; }
  async getAllRewardRedemptions(): Promise<any[]> { return []; }
  async updateRewardRedemption(): Promise<any> { return undefined; }
  async deleteRewardRedemption(): Promise<boolean> { return false; }
  async getSystemConfig(): Promise<any> { return undefined; }
  async updateSystemConfig(): Promise<any> { return undefined; }
  async createSystemConfig(): Promise<any> { throw new Error("Not implemented"); }
  async deleteSystemConfig(): Promise<boolean> { return false; }
  async getProduct(): Promise<Product | undefined> { return undefined; }
  async getProductBySku(): Promise<Product | undefined> { return undefined; }
  async getProductByCode(): Promise<Product | undefined> { return undefined; }
  async getProductsByCategory(): Promise<Product[]> { return []; }
  async updateProduct(): Promise<Product | undefined> { return undefined; }
  async deleteProduct(): Promise<boolean> { return false; }
  async createPointTier(): Promise<any> { throw new Error("Not implemented"); }
  async getPointTiersByProduct(): Promise<any[]> { return []; }
  async getPointTiersByCampaign(): Promise<any[]> { return []; }
  async getAllPointTiers(): Promise<any[]> { return []; }
  async updatePointTier(): Promise<any> { return undefined; }
  async deletePointTier(): Promise<boolean> { return false; }
  async createSale(): Promise<any> { throw new Error("Not implemented"); }
  async getSale(): Promise<any> { return undefined; }
  async getSalesByCustomer(): Promise<any[]> { return []; }
  async getAllSales(): Promise<any[]> { return []; }
  async updateSale(): Promise<any> { return undefined; }
  async deleteSale(): Promise<boolean> { return false; }
  async createSaleItem(): Promise<any> { throw new Error("Not implemented"); }
  async getSaleItemsBySale(): Promise<any[]> { return []; }
  async deleteSaleItem(): Promise<boolean> { return false; }
  async getDashboardStats(): Promise<any> {
    const customers = await this.getAllCustomers();
    const campaigns = await this.getAllCampaigns();
    const referrals = await this.getAllReferrals();

    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.isActive).length,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.isActive).length,
      totalReferrals: referrals.length,
      totalPointsDistributed: customers.reduce((sum, c) => sum + c.pointsEarned, 0),
      totalPointsRedeemed: customers.reduce((sum, c) => sum + c.pointsRedeemed, 0)
    };
  }
}