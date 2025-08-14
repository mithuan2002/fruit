import {
  type Customer,
  type InsertCustomer,
  type Campaign,
  type InsertCampaign,
  type Coupon,
  type InsertCoupon,
  type Referral,
  type InsertReferral,
  type WhatsappMessage,
  type InsertWhatsappMessage,
  type PointsTransaction,
  type InsertPointsTransaction,
  type Reward,
  type InsertReward,
  type RewardRedemption,
  type InsertRewardRedemption,
  type SystemConfig,
  type InsertSystemConfig,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type PointTier,
  type InsertPointTier,
  type Sale,
  type InsertSale,
  type SaleItem,
  type InsertSaleItem,
  customers,
  campaigns,
  coupons,
  referrals,
  whatsappMessages,
  pointsTransactions,
  rewards,
  rewardRedemptions,
  systemConfig,
  users,
  products,
  pointTiers,
  sales,
  saleItems,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, count, sum, sql } from "drizzle-orm";

export interface IStorage {
  // Customer operations
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined>;
  getCustomerByCouponCode(couponCode: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Campaign operations
  getCampaign(id: string): Promise<Campaign | undefined>;
  getAllCampaigns(): Promise<Campaign[]>;
  getActiveCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;

  // Coupon operations
  getCoupon(id: string): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  getCouponsByCustomer(customerId: string): Promise<Coupon[]>;
  getAllCoupons(): Promise<Coupon[]>;
  getActiveCoupons(): Promise<Coupon[]>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: string): Promise<boolean>;

  // Referral operations
  getReferral(id: string): Promise<Referral | undefined>;
  getAllReferrals(): Promise<Referral[]>;
  getReferralsByCustomer(customerId: string): Promise<Referral[]>;
  getReferralsByCampaign(campaignId: string): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferral(id: string, updates: Partial<Referral>): Promise<Referral | undefined>;

  // WhatsApp operations
  getWhatsappMessage(id: string): Promise<WhatsappMessage | undefined>;
  getAllWhatsappMessages(): Promise<WhatsappMessage[]>;
  getWhatsappMessagesByCustomer(customerId: string): Promise<WhatsappMessage[]>;
  createWhatsappMessage(whatsappMessage: InsertWhatsappMessage): Promise<WhatsappMessage>;
  updateWhatsappMessage(id: string, updates: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined>;

  // Points operations
  getPointsTransaction(id: string): Promise<PointsTransaction | undefined>;
  getPointsTransactionsByCustomer(customerId: string): Promise<PointsTransaction[]>;
  createPointsTransaction(transaction: InsertPointsTransaction): Promise<PointsTransaction>;

  // Rewards operations
  getReward(id: string): Promise<Reward | undefined>;
  getAllRewards(): Promise<Reward[]>;
  getActiveRewards(): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: string, updates: Partial<Reward>): Promise<Reward | undefined>;
  deleteReward(id: string): Promise<boolean>;

  // Reward redemption operations
  getRewardRedemption(id: string): Promise<RewardRedemption | undefined>;
  getRewardRedemptionsByCustomer(customerId: string): Promise<RewardRedemption[]>;
  createRewardRedemption(redemption: InsertRewardRedemption): Promise<RewardRedemption>;
  updateRewardRedemption(id: string, updates: Partial<RewardRedemption>): Promise<RewardRedemption | undefined>;

  // System config operations
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  getAllSystemConfig(): Promise<SystemConfig[]>;
  getPublicSystemConfig(): Promise<SystemConfig[]>;
  upsertSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;

  // User operations (Authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Product operations
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductByCode(productCode: string): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Point Tier operations
  getPointTier(id: string): Promise<PointTier | undefined>;
  getPointTiersByCampaign(campaignId: string): Promise<PointTier[]>;
  getPointTiersByProduct(productId: string): Promise<PointTier[]>;
  createPointTier(tier: InsertPointTier): Promise<PointTier>;
  updatePointTier(id: string, updates: Partial<PointTier>): Promise<PointTier | undefined>;
  deletePointTier(id: string): Promise<boolean>;

  // Sale operations
  getSale(id: string): Promise<Sale | undefined>;
  getAllSales(): Promise<Sale[]>;
  getSalesByCustomer(customerId: string): Promise<Sale[]>;
  getSalesByCampaign(campaignId: string): Promise<Sale[]>;
  getSalesByReferralCode(referralCode: string): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  updateSale(id: string, updates: Partial<Sale>): Promise<Sale | undefined>;

  // Sale Item operations
  getSaleItem(id: string): Promise<SaleItem | undefined>;
  getSaleItemsBySale(saleId: string): Promise<SaleItem[]>;
  createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem>;
  updateSaleItem(id: string, updates: Partial<SaleItem>): Promise<SaleItem | undefined>;
}

// Database logging utility
const dbLogger = {
  info: (operation: string, details?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DB-INFO] ${operation}`, details ? JSON.stringify(details, null, 2) : '');
  },
  error: (operation: string, error: any, details?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [DB-ERROR] ${operation}`, { error: error.message || error, details });
  },
  debug: (operation: string, details?: any) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${timestamp}] [DB-DEBUG] ${operation}`, details ? JSON.stringify(details, null, 2) : '');
    }
  }
};

export class DatabaseStorage implements IStorage {
  // Customer operations
  async getCustomer(id: string): Promise<Customer | undefined> {
    try {
      dbLogger.debug("Getting customer by ID", { id });
      const [customer] = await db.select().from(customers).where(eq(customers.id, id));
      dbLogger.debug("Customer query result", { found: !!customer, customerId: id });
      return customer || undefined;
    } catch (error) {
      dbLogger.error("Failed to get customer", error, { id });
      throw error;
    }
  }

  async getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phoneNumber, phoneNumber));
    return customer || undefined;
  }

  async getCustomerByCouponCode(couponCode: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.referralCode, couponCode));
    return customer || undefined;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async createCustomer(insertCustomer: InsertCustomer & { referralCode?: string }): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values({
        ...insertCustomer,
        referralCode: insertCustomer.referralCode || await this.generateUniqueCode(),
      })
      .returning();
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Campaign operations
  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.isActive, true));
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(insertCampaign).returning();
    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign || undefined;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Coupon operations
  async getCoupon(id: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon || undefined;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
    return coupon || undefined;
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getCouponsByCustomer(customerId: string): Promise<Coupon[]> {
    return await db.select().from(coupons)
      .where(eq(coupons.customerId, customerId))
      .orderBy(desc(coupons.createdAt));
  }

  async getActiveCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).where(eq(coupons.isActive, true));
  }

  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const [coupon] = await db.insert(coupons).values(insertCoupon).returning();
    return coupon;
  }

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon | undefined> {
    const [coupon] = await db
      .update(coupons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    return coupon || undefined;
  }

  async deleteCoupon(id: string): Promise<boolean> {
    const result = await db.delete(coupons).where(eq(coupons.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Referral operations
  async getReferral(id: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id));
    return referral || undefined;
  }

  async getAllReferrals(): Promise<Referral[]> {
    return await db.select().from(referrals).orderBy(desc(referrals.createdAt));
  }

  async getReferralsByCustomer(customerId: string): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.referrerId, customerId));
  }

  async getReferralsByCampaign(campaignId: string): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.campaignId, campaignId));
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db.insert(referrals).values(insertReferral).returning();
    return referral;
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral | undefined> {
    const [referral] = await db
      .update(referrals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(referrals.id, id))
      .returning();
    return referral || undefined;
  }

  // WhatsApp operations
  async getWhatsappMessage(id: string): Promise<WhatsappMessage | undefined> {
    const [message] = await db.select().from(whatsappMessages).where(eq(whatsappMessages.id, id));
    return message || undefined;
  }

  async getAllWhatsappMessages(): Promise<WhatsappMessage[]> {
    return await db.select().from(whatsappMessages).orderBy(desc(whatsappMessages.sentAt));
  }

  async getWhatsappMessagesByCustomer(customerId: string): Promise<WhatsappMessage[]> {
    return await db.select().from(whatsappMessages).where(eq(whatsappMessages.customerId, customerId));
  }

  async createWhatsappMessage(insertMessage: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const [message] = await db.insert(whatsappMessages).values(insertMessage).returning();
    return message;
  }

  async updateWhatsappMessage(id: string, updates: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined> {
    const [message] = await db
      .update(whatsappMessages)
      .set(updates)
      .where(eq(whatsappMessages.id, id))
      .returning();
    return message || undefined;
  }

  // Points operations
  async getPointsTransaction(id: string): Promise<PointsTransaction | undefined> {
    const [transaction] = await db.select().from(pointsTransactions).where(eq(pointsTransactions.id, id));
    return transaction || undefined;
  }

  async getPointsTransactionsByCustomer(customerId: string): Promise<PointsTransaction[]> {
    return await db.select().from(pointsTransactions).where(eq(pointsTransactions.customerId, customerId)).orderBy(desc(pointsTransactions.createdAt));
  }

  async createPointsTransaction(insertTransaction: InsertPointsTransaction): Promise<PointsTransaction> {
    const [transaction] = await db.insert(pointsTransactions).values(insertTransaction).returning();
    return transaction;
  }

  // Rewards operations
  async getReward(id: string): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward || undefined;
  }

  async getAllRewards(): Promise<Reward[]>{
    return await db.select().from(rewards).orderBy(desc(rewards.createdAt));
  }

  async getActiveRewards(): Promise<Reward[]> {
    return await db.select().from(rewards).where(eq(rewards.isActive, true));
  }

  async createReward(insertReward: InsertReward): Promise<Reward> {
    const [reward] = await db.insert(rewards).values(insertReward).returning();
    return reward;
  }

  async updateReward(id: string, updates: Partial<Reward>): Promise<Reward | undefined> {
    const [reward] = await db
      .update(rewards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rewards.id, id))
      .returning();
    return reward || undefined;
  }

  async deleteReward(id: string): Promise<boolean> {
    const result = await db.delete(rewards).where(eq(rewards.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Reward redemption operations
  async getRewardRedemption(id: string): Promise<RewardRedemption | undefined> {
    const [redemption] = await db.select().from(rewardRedemptions).where(eq(rewardRedemptions.id, id));
    return redemption || undefined;
  }

  async getRewardRedemptionsByCustomer(customerId: string): Promise<RewardRedemption[]> {
    return await db.select().from(rewardRedemptions).where(eq(rewardRedemptions.customerId, customerId)).orderBy(desc(rewardRedemptions.createdAt));
  }

  async createRewardRedemption(insertRedemption: InsertRewardRedemption): Promise<RewardRedemption> {
    const [redemption] = await db.insert(rewardRedemptions).values(insertRedemption).returning();
    return redemption;
  }

  async updateRewardRedemption(id: string, updates: Partial<RewardRedemption>): Promise<RewardRedemption | undefined> {
    const [redemption] = await db
      .update(rewardRedemptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rewardRedemptions.id, id))
      .returning();
    return redemption || undefined;
  }

  // System config operations
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfig).where(eq(systemConfig.key, key));
    return config || undefined;
  }

  async getAllSystemConfig(): Promise<SystemConfig[]> {
    return await db.select().from(systemConfig);
  }

  async getPublicSystemConfig(): Promise<SystemConfig[]> {
    return await db.select().from(systemConfig).where(eq(systemConfig.isPublic, true));
  }

  async upsertSystemConfig(insertConfig: InsertSystemConfig): Promise<SystemConfig> {
    const [config] = await db
      .insert(systemConfig)
      .values({ ...insertConfig, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value: insertConfig.value, updatedAt: new Date() }
      })
      .returning();
    return config;
  }

  // User operations (Authentication)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    console.log("UpdateUser called with:", { id, updates });
    try {
      const [user] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      console.log("UpdateUser result:", user);
      return user || undefined;
    } catch (error) {
      console.error("UpdateUser error:", error);
      throw error;
    }
  }

  // Utility operations
  async generateUniqueCode(prefix: string = ""): Promise<string> {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      code = prefix ? `${prefix}${randomCode}` : randomCode;

      // Check if code exists in customers or coupons
      const [existingCustomer] = await db.select().from(customers).where(eq(customers.referralCode, code)).limit(1);
      const [existingCoupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);

      if (!existingCustomer && !existingCoupon) {
        isUnique = true;
        return code;
      }
    }

    return code!;
  }

  // Analytics
  async getTopReferrers(limit: number = 10): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.isActive, true))
      .orderBy(desc(customers.totalReferrals))
      .limit(limit);
  }

  async getCampaignStats(campaignId: string): Promise<{
    participantCount: number;
    referralsCount: number;
    conversionRate: number;
    totalRewards: number;
  }> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      return {
        participantCount: 0,
        referralsCount: 0,
        conversionRate: 0,
        totalRewards: 0,
      };
    }

    const referralsData = await db
      .select({
        count: count(),
        totalRewards: sum(referrals.pointsEarned),
      })
      .from(referrals)
      .where(eq(referrals.campaignId, campaignId));

    const { count: referralsCount, totalRewards } = referralsData[0] || { count: 0, totalRewards: 0 };

    return {
      participantCount: campaign.participantCount,
      referralsCount: referralsCount || 0,
      conversionRate: campaign.participantCount > 0 ? (referralsCount || 0) / campaign.participantCount : 0,
      totalRewards: parseInt(totalRewards?.toString() || "0"),
    };
  }

  async getDashboardStats(): Promise<{
    totalCustomers: number;
    activeReferrals: number;
    rewardsDistributed: number;
    conversionRate: number;
  }> {
    const [customersData] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.isActive, true));

    const [referralsData] = await db
      .select({
        active: count(),
        totalRewards: sum(referrals.pointsEarned),
      })
      .from(referrals)
      .where(eq(referrals.status, "pending"));

    const totalCustomers = customersData?.count || 0;
    const activeReferrals = referralsData?.active || 0;
    const rewardsDistributed = parseInt(referralsData?.totalRewards?.toString() || "0");

    return {
      totalCustomers,
      activeReferrals,
      rewardsDistributed,
      conversionRate: totalCustomers > 0 ? activeReferrals / totalCustomers : 0,
    };
  }

  // Product operations
  async getProduct(id: string): Promise<Product | undefined> {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      return product;
    } catch (error) {
      console.error("Error fetching product:", error);
      return undefined;
    }
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product || undefined;
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.productCode, code))
        .limit(1);
      return product;
    } catch (error) {
      console.error("Error fetching product by code:", error);
      return undefined;
    }
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      const result = await db.select().from(products).orderBy(products.name);
      console.log("Fetched products:", result.length);
      return result;
    } catch (error) {
      console.error("Error fetching products:", error);
      return []; // Return empty array instead of throwing
    }
  }

  async getActiveProducts(): Promise<Product[]> {
    try {
      const result = await this.db
        .select()
        .from(products)
        .where(eq(products.isActive, true))
        .orderBy(products.name);
      console.log("Fetched active products:", result.length);
      return result;
    } catch (error) {
      console.error("Error fetching active products:", error);
      return []; // Return empty array instead of throwing
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category));
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    try {
      // Ensure required fields are present
      const productData = {
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
        bonusMultiplier: data.bonusMultiplier || "1.0"
      };

      console.log("Creating product with data:", productData);
      const [product] = await this.db.insert(products).values(productData).returning();
      console.log("Created product:", product);
      return product;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      // Handle the case where id might be "manual-product" from the form
      if (id === 'manual-product') {
        console.log("Cannot update manual-product ID");
        return undefined;
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.productCode !== undefined) updateData.productCode = data.productCode;
      if (data.price !== undefined) updateData.price = data.price.toString();
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
      if (data.pointCalculationType !== undefined) updateData.pointCalculationType = data.pointCalculationType;
      if (data.fixedPoints !== undefined) updateData.fixedPoints = data.fixedPoints;
      if (data.percentageRate !== undefined) updateData.percentageRate = data.percentageRate;
      if (data.minimumQuantity !== undefined) updateData.minimumQuantity = data.minimumQuantity;
      if (data.bonusMultiplier !== undefined) updateData.bonusMultiplier = data.bonusMultiplier;

      console.log("Updating product:", id, "with data:", updateData);
      const [product] = await this.db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();
      return product;
    } catch (error) {
      console.error("Error updating product:", error);
      return undefined;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const result = await this.db.delete(products).where(eq(products.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  }

  // Point Tier operations
  async getPointTier(id: string): Promise<PointTier | undefined> {
    const [tier] = await db.select().from(pointTiers).where(eq(pointTiers.id, id));
    return tier || undefined;
  }

  async getPointTiersByCampaign(campaignId: string): Promise<PointTier[]> {
    return await db.select().from(pointTiers).where(eq(pointTiers.campaignId, campaignId));
  }

  async getPointTiersByProduct(productId: string): Promise<PointTier[]> {
    return await db.select().from(pointTiers).where(eq(pointTiers.productId, productId));
  }

  async createPointTier(tier: InsertPointTier): Promise<PointTier> {
    const [pointTier] = await db
      .insert(pointTiers)
      .values(tier)
      .returning();
    return pointTier;
  }

  async updatePointTier(id: string, updates: Partial<PointTier>): Promise<PointTier | undefined> {
    const [tier] = await db
      .update(pointTiers)
      .set(updates)
      .where(eq(pointTiers.id, id))
      .returning();
    return tier || undefined;
  }

  async deletePointTier(id: string): Promise<boolean> {
    const result = await db.delete(pointTiers).where(eq(pointTiers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Sale operations
  async getSale(id: string): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
  }

  async getAllSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.createdAt));
  }

  async getSalesByCustomer(customerId: string): Promise<Sale[]> {
    return await db.select().from(sales).where(eq(sales.customerId, customerId));
  }

  async getSalesByCampaign(campaignId: string): Promise<Sale[]> {
    return await db.select().from(sales).where(eq(sales.campaignId, campaignId));
  }

  async getSalesByReferralCode(referralCode: string): Promise<Sale[]> {
    return await db.select().from(sales).where(eq(sales.referralCode, referralCode));
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [newSale] = await db
      .insert(sales)
      .values(sale)
      .returning();
    return newSale;
  }

  async updateSale(id: string, updates: Partial<Sale>): Promise<Sale | undefined> {
    const [sale] = await db
      .update(sales)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sales.id, id))
      .returning();
    return sale || undefined;
  }

  // Sale Item operations
  async getSaleItem(id: string): Promise<SaleItem | undefined> {
    const [item] = await db.select().from(saleItems).where(eq(saleItems.id, id));
    return item || undefined;
  }

  async getSaleItemsBySale(saleId: string): Promise<SaleItem[]> {
    return await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  }

  async createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem> {
    const [item] = await db
      .insert(saleItems)
      .values(saleItem)
      .returning();
    return item;
  }

  async updateSaleItem(id: string, updates: Partial<SaleItem>): Promise<SaleItem | undefined> {
    const [item] = await db
      .update(saleItems)
      .set(updates)
      .where(eq(saleItems.id, id))
      .returning();
    return item || undefined;
  }
}

export const storage = new DatabaseStorage();