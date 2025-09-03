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
  type Bill,
  type InsertBill,
  type BillSubmission,
  type InsertBillSubmission,
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
  bills,
  billSubmissions,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, count, sum, sql } from "drizzle-orm";

// Define PendingBill type if not already defined in shared/schema
interface PendingBill {
  bill: {
    id: string;
    billNumber: string | null;
    totalAmount: string;
    extractedItems: string;
    extractedText: string | null;
    ocrConfidence: string | null;
    imageUrl: string | null;
    referralCode: string | null;
    submittedAt: string;
    createdAt: string;
  };
  customer: {
    id: string;
    name: string;
    phoneNumber: string | null;
    points: number;
  };
}

export class StorageService {
  async submitPendingBill(billData: {
    customerId: string;
    totalAmount: string;
    billNumber?: string | null;
    invoiceNumber?: string | null;
    storeName?: string | null;
    extractedText?: string;
    extractedItems?: string;
    ocrConfidence?: number;
    imageData?: string | null;
    referralCode?: string | null;
    status: string;
    submittedAt: string;
  }): Promise<any> {
    const id = randomUUID();
    const pendingBill = {
      id,
      ...billData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in bills table with pending status
    const [insertedBill] = await db.insert(bills).values({
      id,
      customerId: billData.customerId,
      totalAmount: billData.totalAmount,
      billNumber: billData.billNumber,
      invoiceNumber: billData.invoiceNumber,
      storeName: billData.storeName,
      extractedText: billData.extractedText || '',
      extractedItems: billData.extractedItems || '[]',
      ocrConfidence: billData.ocrConfidence?.toString() || '0',
      imageUrl: billData.imageData, // Store base64 image data temporarily
      referralCode: billData.referralCode,
      status: 'PENDING',
      pointsEarned: 0, // Will be calculated upon approval
      processedAt: null,
      createdAt: pendingBill.createdAt,
      updatedAt: pendingBill.updatedAt,
    }).returning();

    return insertedBill;
  }

  async getPendingBills() {
    return await db.select({
      bill: {
        id: bills.id,
        billNumber: bills.billNumber,
        totalAmount: bills.totalAmount,
        extractedItems: bills.extractedItems,
        extractedText: bills.extractedText,
        ocrConfidence: bills.ocrConfidence,
        imageUrl: bills.imageUrl,
        referralCode: bills.referralCode,
        submittedAt: bills.createdAt,
        createdAt: bills.createdAt,
      },
      customer: {
        id: customers.id,
        name: customers.name,
        phoneNumber: customers.phoneNumber,
        points: customers.points,
      }
    })
    .from(bills)
    .leftJoin(customers, eq(bills.customerId, customers.id))
    .where(eq(bills.status, 'PENDING'))
    .orderBy(desc(bills.createdAt));
  }

  async approveBill(billId: string, adminId?: string) {
    const bill = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
    if (!bill.length) {
      throw new Error('Bill not found');
    }

    const billData = bill[0];
    const customer = await this.getCustomerById(billData.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate points (₹100 = 10 points)
    const pointsEarned = Math.floor(parseFloat(billData.totalAmount) / 10);

    // Handle referral bonus if applicable
    let referrerPointsEarned = 0;
    let referrer = null;
    if (billData.referralCode) {
      referrer = await this.getCustomerByCouponCode(billData.referralCode);
      if (referrer && referrer.id !== customer.id) {
        referrerPointsEarned = Math.floor(pointsEarned * 0.1); // 10% bonus

        // Award referrer points
        await db.update(customers)
          .set({
            points: referrer.points + referrerPointsEarned,
            pointsEarned: referrer.pointsEarned + referrerPointsEarned,
            updatedAt: new Date()
          })
          .where(eq(customers.id, referrer.id));

        // Record referrer transaction
        await this.createPointsTransaction({
          customerId: referrer.id,
          points: referrerPointsEarned,
          type: 'EARNED',
          description: `Referral bonus from ${customer.name}'s bill`,
          billId: billId,
        });
      }
    }

    // Update customer points
    await db.update(customers)
      .set({
        points: customer.points + pointsEarned,
        pointsEarned: customer.pointsEarned + pointsEarned,
        lastActivity: new Date(),
        updatedAt: new Date()
      })
      .where(eq(customers.id, customer.id));

    // Update bill status
    await db.update(bills)
      .set({
        status: 'PROCESSED',
        pointsEarned,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bills.id, billId));

    // Record customer transaction
    await this.createPointsTransaction({
      customerId: customer.id,
      points: pointsEarned,
      type: 'EARNED',
      description: `Bill processing: ₹${billData.totalAmount}`,
      billId: billId,
    });

    return {
      success: true,
      bill: {
        id: billId,
        pointsEarned,
        processedAt: new Date(),
      },
      customer: {
        id: customer.id,
        name: customer.name,
        newPointsBalance: customer.points + pointsEarned,
      },
      referrer: referrer ? {
        id: referrer.id,
        name: referrer.name,
        bonusPointsEarned: referrerPointsEarned,
      } : undefined,
    };
  }

  // Add missing methods for the class
  async getCustomerById(id: string): Promise<Customer | undefined> {
    const customers_result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return customers_result[0];
  }

  async getCustomerByCouponCode(couponCode: string): Promise<Customer | null> {
    try {
      const result = await this.db
        .select()
        .from(customers)
        .where(eq(customers.referralCode, couponCode))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Failed to get customer by coupon code:", error);
      return null;
    }
  }

  async getCustomerByReferralCode(referralCode: string): Promise<Customer | null> {
    try {
      const result = await this.db
        .select()
        .from(customers)
        .where(eq(customers.referralCode, referralCode))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Failed to get customer by referral code:", error);
      return null;
    }
  }

  async createPointsTransaction(transaction: {
    customerId: string;
    points: number;
    type: string;
    description?: string;
    billId?: string;
  }) {
    return await db.insert(pointsTransactions).values({
      customerId: transaction.customerId,
      points: transaction.points,
      type: transaction.type,
      description: transaction.description || null,
    }).returning();
  }
}

// OCR functionality removed - bills are now simple photo uploads

export interface IStorage {
  // Customer operations
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerById(id: string): Promise<Customer | undefined>; // Added for clarity, assuming getCustomer also serves this purpose
  getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined>;
  getCustomerByCouponCode(couponCode: string): Promise<Customer | null>;
  getCustomerByReferralCode(referralCode: string): Promise<Customer | null>;
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
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
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

  // Bill operations (OCR processing)
  getBill(id: string): Promise<Bill | undefined>;
  getAllBills(): Promise<Bill[]>;
  getBillsByCustomer(customerId: string): Promise<Bill[]>;
  getBillsByReferrer(referrerId: string): Promise<Bill[]>;
  getBillByHash(billHash: string): Promise<Bill | undefined>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBill(id: string, updates: Partial<Bill>): Promise<Bill | undefined>;
  getBillsForVerification(): Promise<PendingBill[]>;
  createPendingBill(billData: any): Promise<any>;
  getPendingBill(billId: string): Promise<any>;
  updatePendingBillStatus(billId: string, status: string, processedBillId?: string | null, rejectionReason?: string): Promise<void>;
  getPendingBills(): Promise<any>;
  approveBill(billId: string, adminId?: string): Promise<any>;

  // Bill Item operations
  getBillItem(id: string): Promise<BillItem | undefined>;
  getBillItemsByBill(billId: string): Promise<BillItem[]>;
  createBillItem(billItem: InsertBillItem): Promise<BillItem>;
  updateBillItem(id: string, updates: Partial<BillItem>): Promise<BillItem | undefined>;

  // OCR processing removed - bills are now photo uploads only
  
  // Bill submissions for dashboard
  getBillSubmissionsByCustomer(customerId: string): Promise<any[]>;
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

  async getCustomerById(id: string): Promise<Customer | undefined> {
    return this.getCustomer(id);
  }

  async getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phoneNumber, phoneNumber));
    return customer || undefined;
  }

  async getCustomerByCouponCode(couponCode: string): Promise<Customer | null> {
    const [customer] = await db.select().from(customers).where(eq(customers.referralCode, couponCode));
    return customer || undefined;
  }

  async getCustomerByReferralCode(referralCode: string): Promise<Customer | null> {
    const [customer] = await db.select().from(customers).where(eq(customers.referralCode, referralCode));
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

  async createCampaign(campaignData: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(campaignData).returning();
    return campaign;
  }

  async updateCampaign(id: string, updateData: Partial<Campaign>): Promise<Campaign | null> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, id))
      .returning();

    return updatedCampaign || null;
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
      const result = await db
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
      const [product] = await db.insert(products).values(productData).returning();
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
      const [product] = await db
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
      const result = await db.delete(products).where(eq(products.id, id));
      return (result.rowCount ?? 0) > 0;
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

  async getAllSales(): Promise<Sale[]>{
    return await db.select().from(sales).orderBy(desc(sales.createdAt));
  }

  async getSalesByCustomer(customerId: string): Promise<Sale[]>{
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

  // Bill operations (OCR processing)
  async getBill(id: string): Promise<Bill | undefined> {
    const [bill] = await db.select().from(bills).where(eq(bills.id, id));
    return bill || undefined;
  }

  async getAllBills(): Promise<Bill[]> {
    return await db.select().from(bills).orderBy(desc(bills.createdAt));
  }

  async getBillsByCustomer(customerId: string): Promise<Bill[]> {
    return await db.select().from(bills).where(eq(bills.customerId, customerId));
  }

  async getBillsByReferrer(referrerId: string): Promise<Bill[]> {
    return await db.select().from(bills).where(eq(bills.referrerId, referrerId));
  }

  async getBillByHash(billHash: string): Promise<Bill | undefined> {
    const [bill] = await db.select().from(bills).where(eq(bills.billHash, billHash));
    return bill || undefined;
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const [newBill] = await db
      .insert(bills)
      .values(bill)
      .returning();
    return newBill;
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<Bill | undefined> {
    const [bill] = await db
      .update(bills)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bills.id, id))
      .returning();
    return bill || undefined;
  }

  async getBillsForVerification(): Promise<PendingBill[]> {
    const result = await db
      .select({
        bill: {
          id: bills.id,
          billNumber: bills.billNumber,
          totalAmount: bills.totalAmount,
          extractedItems: bills.extractedItems,
          extractedText: bills.extractedText,
          ocrConfidence: bills.ocrConfidence,
          imageUrl: bills.imageUrl,
          referralCode: bills.referralCode,
          submittedAt: bills.createdAt,
          createdAt: bills.createdAt,
        },
        customer: {
          id: customers.id,
          name: customers.name,
          phoneNumber: customers.phoneNumber,
          points: customers.points,
        },
      })
      .from(bills)
      .innerJoin(customers, eq(bills.customerId, customers.id))
      .where(eq(bills.status, 'pending'))
      .orderBy(desc(bills.submittedAt));

    return result; // Assuming result is already in the format of PendingBill[]
  }

  async getPendingBill(billId: string): Promise<any> {
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
    return bill;
  }

  async updatePendingBillStatus(billId: string, status: string, processedBillId?: string | null, rejectionReason?: string): Promise<void> {
    await db.update(bills)
      .set({
        status,
        processedAt: status === 'APPROVED' || status === 'REJECTED' ? new Date().toISOString() : null,
        rejectionReason: rejectionReason || null,
        updatedAt: new Date()
      })
      .where(eq(bills.id, billId));
  }

  // Bill submission operations
  async submitBill(data: InsertBillSubmission): Promise<BillSubmission> {
    const [submission] = await db
      .insert(billSubmissions)
      .values(data)
      .returning();
    return submission;
  }

  async getBillSubmission(id: string): Promise<BillSubmission | undefined> {
    const [submission] = await db.select().from(billSubmissions).where(eq(billSubmissions.id, id));
    return submission || undefined;
  }

  async getBillSubmissionsByStatus(status: string): Promise<BillSubmission[]> {
    return await db.select().from(billSubmissions).where(eq(billSubmissions.verificationStatus, status));
  }

  async updateBillSubmissionStatus(id: string, data: {
    verificationStatus: string;
    adminNotes?: string;
    pointsAwarded?: number;
    verifiedBy?: string;
    verifiedAt?: Date;
  }): Promise<BillSubmission | undefined> {
    const [submission] = await db
      .update(billSubmissions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(billSubmissions.id, id))
      .returning();
    return submission || undefined;
  }

  // Campaign-specific referral tracking methods
  async checkExistingReferral(referrerId: string, referredCustomerId: string, campaignId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, referrerId),
          eq(referrals.referredCustomerId, referredCustomerId),
          eq(referrals.campaignId, campaignId)
        )
      )
      .limit(1);
    return !!existing;
  }

  async createCampaignReferral(data: {
    referrerId: string;
    referredCustomerId: string;
    campaignId: string;
    referralCode: string;
    pointsEarned: number;
    saleAmount: number;
  }): Promise<any> {
    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId: data.referrerId,
        referredCustomerId: data.referredCustomerId,
        campaignId: data.campaignId,
        referralCode: data.referralCode,
        pointsEarned: data.pointsEarned,
        saleAmount: data.saleAmount.toString(),
        status: 'completed',
        completedAt: new Date(),
      })
      .returning();
    return referral;
  }

  // Pending Bill operations
  async createPendingBill(billData: {
    customerId: string;
    totalAmount: string;
    billNumber?: string | null;
    invoiceNumber?: string | null;
    storeName?: string | null;
    extractedText?: string;
    extractedItems?: string;
    ocrConfidence?: number;
    imageData?: string | null;
    referralCode?: string | null;
    status: string;
    submittedAt: string;
  }): Promise<any> {
    const id = randomUUID();
    const pendingBill = {
      id,
      ...billData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in bills table with pending status
    const [insertedBill] = await db.insert(bills).values({
      id,
      customerId: billData.customerId,
      totalAmount: billData.totalAmount,
      billNumber: billData.billNumber,
      invoiceNumber: billData.invoiceNumber,
      storeName: billData.storeName,
      extractedText: billData.extractedText || '',
      extractedItems: billData.extractedItems || '[]',
      ocrConfidence: billData.ocrConfidence?.toString() || '0',
      imageUrl: billData.imageData, // Store base64 image data temporarily
      referralCode: billData.referralCode,
      status: 'PENDING',
      pointsEarned: 0, // Will be calculated upon approval
      processedAt: null,
      createdAt: pendingBill.createdAt,
      updatedAt: pendingBill.updatedAt,
    }).returning();

    return insertedBill;
  }

  async getPendingBills() {
    return await db.select({
      bill: bills,
      customer: customers
    })
    .from(bills)
    .leftJoin(customers, eq(bills.customerId, customers.id))
    .where(eq(bills.status, 'PENDING'))
    .orderBy(desc(bills.createdAt));
  }

  async getPendingBill(billId: string): Promise<any> {
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
    return bill;
  }

  async updatePendingBillStatus(billId: string, status: string, processedBillId?: string | null, rejectionReason?: string): Promise<void> {
    await db.update(bills)
      .set({
        status,
        processedAt: status === 'APPROVED' || status === 'REJECTED' ? new Date().toISOString() : null,
        rejectionReason: rejectionReason || null,
        updatedAt: new Date()
      })
      .where(eq(bills.id, billId));
  }

  async approveBill(billId: string, adminId?: string) {
    const bill = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
    if (!bill.length) {
      throw new Error('Bill not found');
    }

    const billData = bill[0];
    const customer = await this.getCustomerById(billData.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate points (₹100 = 10 points)
    const pointsEarned = Math.floor(parseFloat(billData.totalAmount) / 10);

    // Handle referral bonus if applicable
    let referrerPointsEarned = 0;
    let referrer = null;
    if (billData.referralCode) {
      referrer = await this.getCustomerByCouponCode(billData.referralCode);
      if (referrer && referrer.id !== customer.id) {
        referrerPointsEarned = Math.floor(pointsEarned * 0.1); // 10% bonus

        // Award referrer points
        await db.update(customers)
          .set({
            points: referrer.points + referrerPointsEarned,
            pointsEarned: referrer.pointsEarned + referrerPointsEarned,
            updatedAt: new Date()
          })
          .where(eq(customers.id, referrer.id));

        // Record referrer transaction
        await this.createPointsTransaction({
          customerId: referrer.id,
          points: referrerPointsEarned,
          type: 'EARNED',
          description: `Referral bonus from ${customer.name}'s bill`,
          billId: billId,
        });
      }
    }

    // Update customer points
    await db.update(customers)
      .set({
        points: customer.points + pointsEarned,
        pointsEarned: customer.pointsEarned + pointsEarned,
        lastActivity: new Date(),
        updatedAt: new Date()
      })
      .where(eq(customers.id, customer.id));

    // Update bill status
    await db.update(bills)
      .set({
        status: 'PROCESSED',
        pointsEarned,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bills.id, billId));

    // Record customer transaction
    await this.createPointsTransaction({
      customerId: customer.id,
      points: pointsEarned,
      type: 'EARNED',
      description: `Bill processing: ₹${billData.totalAmount}`,
      billId: billId,
    });

    return {
      success: true,
      bill: {
        id: billId,
        pointsEarned,
        processedAt: new Date(),
      },
      customer: {
        id: customer.id,
        name: customer.name,
        newPointsBalance: customer.points + pointsEarned,
      },
      referrer: referrer ? {
        id: referrer.id,
        name: referrer.name,
        bonusPointsEarned: referrerPointsEarned,
      } : undefined,
    };
  }

  // OCR functionality completely removed - using simple photo uploads now

  // Bill submissions for customer dashboard
  async getBillSubmissionsByCustomer(customerId: string) {
    try {
      // Try to fetch from billSubmissions table first
      try {
        const submissions = await db.select({
          id: billSubmissions.id,
          billNumber: billSubmissions.billNumber,
          shopName: billSubmissions.shopName,
          totalAmount: billSubmissions.totalAmount,
          imageUrl: billSubmissions.imageUrl,
          verificationStatus: billSubmissions.verificationStatus,
          pointsAwarded: billSubmissions.pointsAwarded,
          adminNotes: billSubmissions.adminNotes,
          createdAt: billSubmissions.createdAt,
          campaignId: billSubmissions.campaignId,
          campaignName: campaigns.name
        })
        .from(billSubmissions)
        .leftJoin(campaigns, eq(billSubmissions.campaignId, campaigns.id))
        .where(eq(billSubmissions.customerId, customerId))
        .orderBy(desc(billSubmissions.createdAt));
        
        return submissions;
      } catch (billSubmissionsError) {
        console.log('billSubmissions table not available, falling back to bills table');
        
        // Fallback to regular bills table
        const regularBills = await db.select({
          id: bills.id,
          billNumber: bills.invoiceNumber,
          shopName: bills.storeName,
          totalAmount: bills.totalAmount,
          imageUrl: sql`''`, // No image URL in old bills
          verificationStatus: sql`'approved'`, // Assume old bills are approved
          pointsAwarded: bills.pointsEarned,
          adminNotes: sql`null`,
          createdAt: bills.createdAt,
          campaignId: sql`null`,
          campaignName: sql`'Legacy'`
        })
        .from(bills)
        .where(eq(bills.customerId, customerId))
        .orderBy(desc(bills.createdAt));
        
        return regularBills;
      }
    } catch (error) {
      console.error('Error fetching bill submissions:', error);
      return [];
    }
  }

  // Add missing methods
  async getCustomerTransactions(customerId: string) {
    return await db.select().from(pointsTransactions).where(eq(pointsTransactions.customerId, customerId)).orderBy(desc(pointsTransactions.createdAt));
  }
}

// Use database storage with PostgreSQL
export const storage = new DatabaseStorage();