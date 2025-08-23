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
  type InsertReferral,
  type Bill,
  type InsertBill,
  type BillItem,
  type InsertBillItem,
  type Cashier,
  type InsertCashier,
  type DiscountTransaction,
  type InsertDiscountTransaction
} from "@shared/schema";
import { randomUUID } from "crypto";

export class MemoryStorage {
  private customers: Map<string, Customer> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private referrals: Map<string, Referral> = new Map();
  private bills: Map<string, Bill> = new Map();
  private billItems: Map<string, BillItem> = new Map();
  private cashiers: Map<string, Cashier> = new Map();
  private discountTransactions: Map<string, DiscountTransaction> = new Map();

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

  // Bill operations
  async getBill(id: string): Promise<Bill | undefined> {
    return this.bills.get(id);
  }

  async getBillByHash(billHash: string): Promise<Bill | undefined> {
    return Array.from(this.bills.values()).find(b => b.billHash === billHash);
  }

  async getAllBills(): Promise<Bill[]> {
    return Array.from(this.bills.values());
  }

  async getBillsByCustomer(customerId: string): Promise<Bill[]> {
    return Array.from(this.bills.values()).filter(b => b.customerId === customerId);
  }

  async createBill(data: InsertBill): Promise<Bill> {
    const id = randomUUID();
    const now = new Date();
    
    // Generate bill hash for duplicate prevention
    const billHash = this.generateBillHash(data.invoiceNumber, data.storeName, data.billDate);
    
    const bill: Bill = {
      id,
      customerId: data.customerId,
      invoiceNumber: data.invoiceNumber,
      storeId: data.storeId || null,
      storeName: data.storeName,
      billDate: new Date(data.billDate),
      billTime: data.billTime || null,
      totalAmount: data.totalAmount,
      billHash,
      originalImageUrl: data.originalImageUrl || null,
      ocrRawData: data.ocrRawData || null,
      pointsEarned: data.pointsEarned || 0,
      referralCode: data.referralCode || null,
      referrerId: data.referrerId || null,
      referrerPointsEarned: data.referrerPointsEarned || 0,
      status: data.status || "processed",
      isValid: data.isValid ?? true,
      validationNotes: data.validationNotes || null,
      processedAt: now,
      createdAt: now,
      updatedAt: now
    };

    this.bills.set(id, bill);
    return bill;
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<Bill | undefined> {
    const bill = this.bills.get(id);
    if (!bill) return undefined;

    const updatedBill = { ...bill, ...updates, updatedAt: new Date() };
    this.bills.set(id, updatedBill);
    return updatedBill;
  }

  // Bill item operations
  async getBillItem(id: string): Promise<BillItem | undefined> {
    return this.billItems.get(id);
  }

  async getBillItemsByBill(billId: string): Promise<BillItem[]> {
    return Array.from(this.billItems.values()).filter(bi => bi.billId === billId);
  }

  async createBillItem(data: InsertBillItem): Promise<BillItem> {
    const id = randomUUID();
    const now = new Date();
    
    const billItem: BillItem = {
      id,
      billId: data.billId,
      itemName: data.itemName,
      itemCode: data.itemCode || null,
      quantity: data.quantity || 1,
      unitPrice: data.unitPrice || null,
      totalPrice: data.totalPrice,
      category: data.category || null,
      notes: data.notes || null,
      createdAt: now
    };

    this.billItems.set(id, billItem);
    return billItem;
  }

  // Cashier operations
  async getCashier(id: string): Promise<Cashier | undefined> {
    return this.cashiers.get(id);
  }

  async getCashierByEmployeeId(employeeId: string): Promise<Cashier | undefined> {
    return Array.from(this.cashiers.values()).find(c => c.employeeId === employeeId);
  }

  async getAllCashiers(): Promise<Cashier[]> {
    return Array.from(this.cashiers.values());
  }

  async getActiveCashiers(): Promise<Cashier[]> {
    return Array.from(this.cashiers.values()).filter(c => c.isActive);
  }

  async createCashier(data: InsertCashier): Promise<Cashier> {
    const id = randomUUID();
    const now = new Date();
    
    const cashier: Cashier = {
      id,
      name: data.name,
      employeeId: data.employeeId || null,
      phoneNumber: data.phoneNumber || null,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now
    };

    this.cashiers.set(id, cashier);
    return cashier;
  }

  async updateCashier(id: string, updates: Partial<Cashier>): Promise<Cashier | undefined> {
    const cashier = this.cashiers.get(id);
    if (!cashier) return undefined;

    const updatedCashier = { ...cashier, ...updates, updatedAt: new Date() };
    this.cashiers.set(id, updatedCashier);
    return updatedCashier;
  }

  // Discount transaction operations
  async getDiscountTransaction(id: string): Promise<DiscountTransaction | undefined> {
    return this.discountTransactions.get(id);
  }

  async getDiscountTransactionsByCustomer(customerId: string): Promise<DiscountTransaction[]> {
    return Array.from(this.discountTransactions.values()).filter(dt => dt.customerId === customerId);
  }

  async getDiscountTransactionsByCashier(cashierId: string): Promise<DiscountTransaction[]> {
    return Array.from(this.discountTransactions.values()).filter(dt => dt.cashierId === cashierId);
  }

  async getAllDiscountTransactions(): Promise<DiscountTransaction[]> {
    return Array.from(this.discountTransactions.values());
  }

  async createDiscountTransaction(data: InsertDiscountTransaction): Promise<DiscountTransaction> {
    const id = randomUUID();
    const now = new Date();
    
    const discountTransaction: DiscountTransaction = {
      id,
      customerId: data.customerId,
      cashierId: data.cashierId || null,
      billId: data.billId || null,
      pointsUsed: data.pointsUsed,
      discountPercent: data.discountPercent || null,
      discountAmount: data.discountAmount,
      originalAmount: data.originalAmount || null,
      finalAmount: data.finalAmount || null,
      transactionType: data.transactionType || "discount",
      notes: data.notes || null,
      status: data.status || "completed",
      appliedAt: now,
      createdAt: now,
      updatedAt: now
    };

    this.discountTransactions.set(id, discountTransaction);
    return discountTransaction;
  }

  // Helper method to generate bill hash for duplicate prevention
  private generateBillHash(invoiceNumber: string, storeName: string, billDate: Date | string): string {
    const dateStr = billDate instanceof Date ? billDate.toISOString().split('T')[0] : billDate.split('T')[0];
    const hashInput = `${invoiceNumber}-${storeName}-${dateStr}`;
    // Simple hash function for demo - in production, use crypto
    return Buffer.from(hashInput).toString('base64').replace(/[+/=]/g, '');
  }

  // Mock OCR processing method
  async processOCRData(imageData: string): Promise<{
    invoiceNumber: string;
    storeName: string;
    storeId?: string;
    billDate: string;
    billTime?: string;
    totalAmount: number;
    items?: Array<{
      itemName: string;
      quantity: number;
      unitPrice?: number;
      totalPrice: number;
    }>;
    rawData: string;
  }> {
    // Mock OCR processing - replace with actual OCR service integration
    const mockData = {
      invoiceNumber: `INV-${Date.now()}`,
      storeName: "Demo Store",
      storeId: "STORE001",
      billDate: new Date().toISOString(),
      billTime: new Date().toLocaleTimeString(),
      totalAmount: Math.floor(Math.random() * 1000) + 100, // Random amount between 100-1100
      items: [
        {
          itemName: "Sample Product 1",
          quantity: 1,
          unitPrice: 250,
          totalPrice: 250
        },
        {
          itemName: "Sample Product 2", 
          quantity: 2,
          unitPrice: 150,
          totalPrice: 300
        }
      ],
      rawData: `Mock OCR extraction from image data: ${imageData.substring(0, 50)}...`
    };

    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockData;
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