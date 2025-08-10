import { 
  type Customer, 
  type InsertCustomer,
  type Campaign,
  type InsertCampaign,
  type Coupon,
  type InsertCoupon,
  type Referral,
  type InsertReferral,
  type SmsMessage,
  type InsertSmsMessage
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Customer operations
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined>;
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

  // SMS operations
  getSmsMessage(id: string): Promise<SmsMessage | undefined>;
  getAllSmsMessages(): Promise<SmsMessage[]>;
  getSmsMessagesByCustomer(customerId: string): Promise<SmsMessage[]>;
  createSmsMessage(smsMessage: InsertSmsMessage): Promise<SmsMessage>;

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

export class MemStorage implements IStorage {
  private customers: Map<string, Customer>;
  private campaigns: Map<string, Campaign>;
  private coupons: Map<string, Coupon>;
  private referrals: Map<string, Referral>;
  private smsMessages: Map<string, SmsMessage>;

  constructor() {
    this.customers = new Map();
    this.campaigns = new Map();
    this.coupons = new Map();
    this.referrals = new Map();
    this.smsMessages = new Map();
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

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      ...insertCustomer,
      id,
      points: insertCustomer.points || 0,
      totalReferrals: 0,
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

  // SMS operations
  async getSmsMessage(id: string): Promise<SmsMessage | undefined> {
    return this.smsMessages.get(id);
  }

  async getAllSmsMessages(): Promise<SmsMessage[]> {
    return Array.from(this.smsMessages.values());
  }

  async getSmsMessagesByCustomer(customerId: string): Promise<SmsMessage[]> {
    return Array.from(this.smsMessages.values()).filter(
      sms => sms.customerId === customerId
    );
  }

  async createSmsMessage(insertSmsMessage: InsertSmsMessage): Promise<SmsMessage> {
    const id = randomUUID();
    const smsMessage: SmsMessage = {
      ...insertSmsMessage,
      id,
      customerId: insertSmsMessage.customerId || null,
      status: insertSmsMessage.status || "sent",
      sentAt: new Date(),
    };
    this.smsMessages.set(id, smsMessage);
    return smsMessage;
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

export const storage = new MemStorage();