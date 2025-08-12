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
  
  // Utility operations
  generateUniqueCode(): Promise<string>;

  // Analytics
  getTopReferrers(limit?: number): Promise<Customer[]>;
  getCampaignStats(campaignId: string): Promise<{
    participantCount: number;
    referralsCount: number;
    conversionRate: number;
    totalRewards: number;
  }>;
  getDashboardStats(): Promise<{
    totalCustomers: number;
    activeReferrals: number;
    rewardsDistributed: number;
    conversionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Customer operations
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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

  async getAllRewards(): Promise<Reward[]> {
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
    return result.rowCount > 0;
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
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Utility operations
  async generateUniqueCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    
    while (!isUnique) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
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
}

export class MemStorage implements IStorage {
  private customers: Map<string, Customer>;
  private campaigns: Map<string, Campaign>;
  private coupons: Map<string, Coupon>;
  private referrals: Map<string, Referral>;
  private whatsappMessages: Map<string, WhatsappMessage>;

  constructor() {
    this.customers = new Map();
    this.campaigns = new Map();
    this.coupons = new Map();
    this.referrals = new Map();
    this.whatsappMessages = new Map();
  }

  // Customer operations
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      customer => customer.phoneNumber === phoneNumber
    );
  }

  async getCustomerByCouponCode(couponCode: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      customer => customer.couponCode === couponCode
    );
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async createCustomer(insertCustomer: InsertCustomer & { couponCode?: string }): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      ...insertCustomer,
      id,
      totalReferrals: 0,
      points: insertCustomer.points || 0,
      couponCode: insertCustomer.couponCode || null,
      pointsEarned: 0,
      pointsRedeemed: 0,
      createdAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer = { ...customer, ...updates };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Campaign operations
  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(campaign => campaign.isActive);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = randomUUID();
    const campaign: Campaign = {
      ...insertCampaign,
      id,
      description: insertCampaign.description || null,
      isActive: insertCampaign.isActive ?? true,
      goalCount: insertCampaign.goalCount || 100,
      participantCount: 0,
      referralsCount: 0,
      createdAt: new Date(),
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;

    const updatedCampaign = { ...campaign, ...updates };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  // Coupon operations
  async getCoupon(id: string): Promise<Coupon | undefined> {
    return this.coupons.get(id);
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    return Array.from(this.coupons.values()).find(coupon => coupon.code === code);
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return Array.from(this.coupons.values());
  }

  async getActiveCoupons(): Promise<Coupon[]> {
    return Array.from(this.coupons.values()).filter(coupon => coupon.isActive);
  }

  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const id = randomUUID();
    const coupon: Coupon = {
      ...insertCoupon,
      id,
      campaignId: insertCoupon.campaignId || null,
      isActive: insertCoupon.isActive ?? true,
      usageLimit: insertCoupon.usageLimit || 100,
      usageCount: 0,
      createdAt: new Date(),
    };
    this.coupons.set(id, coupon);
    return coupon;
  }

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon | undefined> {
    const coupon = this.coupons.get(id);
    if (!coupon) return undefined;

    const updatedCoupon = { ...coupon, ...updates };
    this.coupons.set(id, updatedCoupon);
    return updatedCoupon;
  }

  async deleteCoupon(id: string): Promise<boolean> {
    return this.coupons.delete(id);
  }

  // Referral operations
  async getReferral(id: string): Promise<Referral | undefined> {
    return this.referrals.get(id);
  }

  async getAllReferrals(): Promise<Referral[]> {
    return Array.from(this.referrals.values());
  }

  async getReferralsByCustomer(customerId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(
      referral => referral.referrerId === customerId
    );
  }

  async getReferralsByCampaign(campaignId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(
      referral => referral.campaignId === campaignId
    );
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = randomUUID();
    const referral: Referral = {
      ...insertReferral,
      id,
      referredCustomerId: insertReferral.referredCustomerId || null,
      campaignId: insertReferral.campaignId || null,
      couponCode: insertReferral.couponCode || null,
      status: insertReferral.status || "pending",
      saleAmount: insertReferral.saleAmount || 0,
      createdAt: new Date(),
    };
    this.referrals.set(id, referral);
    return referral;
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral | undefined> {
    const referral = this.referrals.get(id);
    if (!referral) return undefined;

    const updatedReferral = { ...referral, ...updates };
    this.referrals.set(id, updatedReferral);
    return updatedReferral;
  }

  // WhatsApp operations
  async getWhatsappMessage(id: string): Promise<WhatsappMessage | undefined> {
    return this.whatsappMessages.get(id);
  }

  async getAllWhatsappMessages(): Promise<WhatsappMessage[]> {
    return Array.from(this.whatsappMessages.values());
  }

  async getWhatsappMessagesByCustomer(customerId: string): Promise<WhatsappMessage[]> {
    return Array.from(this.whatsappMessages.values()).filter(
      msg => msg.customerId === customerId
    );
  }

  async createWhatsappMessage(insertWhatsappMessage: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const id = randomUUID();
    const whatsappMessage: WhatsappMessage = {
      ...insertWhatsappMessage,
      id,
      customerId: insertWhatsappMessage.customerId || null,
      status: insertWhatsappMessage.status || "pending",
      sentAt: new Date(),
    };
    this.whatsappMessages.set(id, whatsappMessage);
    return whatsappMessage;
  }

  async updateWhatsappMessage(id: string, updates: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined> {
    const message = this.whatsappMessages.get(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, ...updates };
    this.whatsappMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Utility methods
  async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      // Generate a unique code with timestamp and random elements
      code = `REF${randomUUID().slice(0, 8).toUpperCase()}${Date.now().toString().slice(-4)}`;
      const existingCoupon = await this.getCouponByCode(code);
      exists = !!existingCoupon;
    }

    return code!;
  }

  // Analytics
  async getTopReferrers(limit: number = 10): Promise<Customer[]> {
    const customers = Array.from(this.customers.values());
    return customers
      .sort((a, b) => b.totalReferrals - a.totalReferrals)
      .slice(0, limit);
  }

  async getCampaignStats(campaignId: string): Promise<{
    participantCount: number;
    referralsCount: number;
    conversionRate: number;
    totalRewards: number;
  }> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return { participantCount: 0, referralsCount: 0, conversionRate: 0, totalRewards: 0 };
    }

    const referrals = Array.from(this.referrals.values()).filter(
      ref => ref.campaignId === campaignId
    );

    const totalRewards = referrals.reduce((sum, ref) => sum + ref.pointsEarned, 0);
    const conversionRate = campaign.participantCount > 0
      ? (referrals.length / campaign.participantCount) * 100
      : 0;

    return {
      participantCount: campaign.participantCount,
      referralsCount: referrals.length,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalRewards,
    };
  }

  async getDashboardStats(): Promise<{
    totalCustomers: number;
    activeReferrals: number;
    rewardsDistributed: number;
    conversionRate: number;
  }> {
    const totalCustomers = this.customers.size;
    const activeReferrals = Array.from(this.referrals.values()).filter(
      ref => ref.status === "pending" || ref.status === "completed"
    ).length;

    const allReferrals = Array.from(this.referrals.values());
    const rewardsDistributed = allReferrals.reduce((sum, ref) => sum + ref.pointsEarned, 0);

    const completedReferrals = allReferrals.filter(ref => ref.status === "completed").length;
    const conversionRate = totalCustomers > 0 ? (completedReferrals / totalCustomers) * 100 : 0;

    return {
      totalCustomers,
      activeReferrals,
      rewardsDistributed,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }
}

export const storage = new DatabaseStorage();