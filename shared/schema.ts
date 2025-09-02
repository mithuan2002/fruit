import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, index, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number").notNull().unique(),
  points: integer("points").notNull().default(0),
  totalReferrals: integer("total_referrals").notNull().default(0),
  referralCode: text("referral_code").unique(), // Their unique referral code
  pointsEarned: integer("points_earned").notNull().default(0),
  pointsRedeemed: integer("points_redeemed").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  phoneIdx: index("customers_phone_idx").on(table.phoneNumber),
  referralCodeIdx: index("customers_referral_code_idx").on(table.referralCode),
  pointsIdx: index("customers_points_idx").on(table.points),
}));

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  // Point calculation rules
  pointCalculationType: text("point_calculation_type").notNull().default("fixed"), // fixed, percentage, tier
  rewardPerReferral: integer("reward_per_referral").notNull(), // Fixed points per referral
  percentageRate: decimal("percentage_rate", { precision: 5, scale: 2 }), // Percentage of sale amount
  minimumPurchase: decimal("minimum_purchase", { precision: 10, scale: 2 }).default("0"), // Minimum purchase for points
  maximumPoints: integer("maximum_points"), // Maximum points per referral
  // Campaign details
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  participantCount: integer("participant_count").notNull().default(0),
  referralsCount: integer("referrals_count").notNull().default(0),
  goalCount: integer("goal_count").notNull().default(100),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  activeIdx: index("campaigns_active_idx").on(table.isActive),
  dateIdx: index("campaigns_date_idx").on(table.startDate, table.endDate),
  typeIdx: index("campaigns_type_idx").on(table.pointCalculationType),
}));

export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  value: integer("value").notNull(), // Points value or percentage
  valueType: text("value_type").notNull().default("percentage"), // percentage, fixed_amount, points
  usageLimit: integer("usage_limit").notNull().default(1),
  usageCount: integer("usage_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  codeIdx: index("coupons_code_idx").on(table.code),
  customerIdx: index("coupons_customer_idx").on(table.customerId),
  activeIdx: index("coupons_active_idx").on(table.isActive),
  expiryIdx: index("coupons_expiry_idx").on(table.expiresAt),
}));

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  referredCustomerId: varchar("referred_customer_id").references(() => customers.id, { onDelete: "set null" }),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  referralCode: text("referral_code").notNull(), // The code used for this referral
  pointsEarned: integer("points_earned").notNull(),
  saleAmount: decimal("sale_amount", { precision: 10, scale: 2 }).default("0"),
  status: text("status").notNull().default("pending"), // pending, completed, expired, cancelled
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  referrerIdx: index("referrals_referrer_idx").on(table.referrerId),
  referredIdx: index("referrals_referred_idx").on(table.referredCustomerId),
  statusIdx: index("referrals_status_idx").on(table.status),
  dateIdx: index("referrals_date_idx").on(table.createdAt),
}));

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
  phoneNumber: text("phone_number").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // welcome_referral, welcome_ecoupon, coupon_generated, reward_earned, broadcast
  status: text("status").notNull().default("pending"), // pending, sent, delivered, failed, read
  errorMessage: text("error_message"),
  interaktMessageId: text("interakt_message_id"),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
}, (table) => ({
  customerIdx: index("whatsapp_messages_customer_idx").on(table.customerId),
  phoneIdx: index("whatsapp_messages_phone_idx").on(table.phoneNumber),
  typeIdx: index("whatsapp_messages_type_idx").on(table.type),
  statusIdx: index("whatsapp_messages_status_idx").on(table.status),
  dateIdx: index("whatsapp_messages_date_idx").on(table.sentAt),
}));

// Bills table for scanned bill tracking
export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  referralCode: text("referral_code"), // If this was a purchase
  referrerId: varchar("referrer_id").references(() => customers.id, { onDelete: "set null" }),

  // OCR extracted data
  invoiceNumber: text("invoice_number"),
  billNumber: text("bill_number"), // Unique bill identifier
  storeName: text("store_name"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  billDate: timestamp("bill_date"),
  extractedText: text("extracted_text"), // Full OCR text for debugging
  extractedItems: text("extracted_items"), // JSON string of extracted items
  ocrConfidence: decimal("ocr_confidence", { precision: 5, scale: 2 }), // OCR accuracy percentage

  // Processing data
  pointsEarned: integer("points_earned").notNull().default(0),
  referrerBonusPoints: integer("referrer_bonus_points").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending, processed, rejected
  rejectionReason: text("rejection_reason"), // Added for rejection reason
  processedBy: varchar("processed_by"), // Cashier/staff who confirmed
  processedAt: timestamp("processed_at"),

  // Metadata
  imageUrl: text("image_url"), // Store the scanned image
  ocrConfidence: decimal("ocr_confidence", { precision: 5, scale: 2 }), // OCR accuracy percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  customerIdx: index("bills_customer_idx").on(table.customerId),
  referrerIdx: index("bills_referrer_idx").on(table.referrerId),
  statusIdx: index("bills_status_idx").on(table.status),
  dateIdx: index("bills_date_idx").on(table.createdAt),
  invoiceIdx: index("bills_invoice_idx").on(table.invoiceNumber),
}));

// Products table for product-specific point calculations
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  productCode: text("product_code").unique().notNull(), // Unique product code for easy lookup
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category"),
  sku: text("sku"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  stockQuantity: integer("stock_quantity").default(0),
  // Points calculation settings
  pointCalculationType: text("point_calculation_type").notNull().default("inherit"), // inherit, fixed, percentage, tier
  fixedPoints: integer("fixed_points"),
  percentageRate: text("percentage_rate"), // stored as string for precision
  minimumQuantity: integer("minimum_quantity").default(1),
  bonusMultiplier: text("bonus_multiplier").default("1.0"), // stored as string for precision
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("products_name_idx").on(table.name),
  categoryIdx: index("products_category_idx").on(table.category),
  skuIdx: index("products_sku_idx").on(table.sku),
  productCodeIdx: index("products_code_idx").on(table.productCode),
}));

// Point calculation tiers for complex point systems
export const pointTiers = pgTable("point_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }),
  // Tier definition
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }).notNull(),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }),
  points: integer("points").notNull(),
  multiplier: decimal("multiplier", { precision: 3, scale: 2 }).default("1.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  campaignIdx: index("point_tiers_campaign_idx").on(table.campaignId),
  productIdx: index("point_tiers_product_idx").on(table.productId),
  amountIdx: index("point_tiers_amount_idx").on(table.minAmount, table.maxAmount),
}));

// Sales records for tracking actual purchases and point calculation
export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
  referralId: varchar("referral_id").references(() => referrals.id, { onDelete: "set null" }),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  // Sale details
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  referralCode: text("referral_code"),
  // Metadata
  posTransactionId: text("pos_transaction_id"), // From POS integration
  paymentMethod: text("payment_method"), // cash, card, digital
  status: text("status").notNull().default("completed"), // pending, completed, refunded, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  customerIdx: index("sales_customer_idx").on(table.customerId),
  referralIdx: index("sales_referral_idx").on(table.referralId),
  statusIdx: index("sales_status_idx").on(table.status),
  dateIdx: index("sales_date_idx").on(table.createdAt),
  codeIdx: index("sales_referral_code_idx").on(table.referralCode),
}));

// Sale items for detailed product tracking
export const saleItems = pgTable("sale_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  // Item details
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  saleIdx: index("sale_items_sale_idx").on(table.saleId),
  productIdx: index("sale_items_product_idx").on(table.productId),
}));

// New tables for enhanced functionality

// Points transactions for detailed tracking
export const pointsTransactions = pgTable("points_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  referralId: varchar("referral_id").references(() => referrals.id, { onDelete: "set null" }),
  type: text("type").notNull(), // earned, redeemed, expired, adjusted
  points: integer("points").notNull(), // positive for earned, negative for redeemed
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  customerIdx: index("points_transactions_customer_idx").on(table.customerId),
  typeIdx: index("points_transactions_type_idx").on(table.type),
  dateIdx: index("points_transactions_date_idx").on(table.createdAt),
}));

// Rewards catalog
export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  stockQuantity: integer("stock_quantity").default(-1), // -1 for unlimited
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  activeIdx: index("rewards_active_idx").on(table.isActive),
  costIdx: index("rewards_cost_idx").on(table.pointsCost),
}));

// Reward redemptions
export const rewardRedemptions = pgTable("reward_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  rewardId: varchar("reward_id").notNull().references(() => rewards.id, { onDelete: "restrict" }),
  pointsUsed: integer("points_used").notNull(),
  status: text("status").notNull().default("pending"), // pending, fulfilled, cancelled
  couponCode: text("coupon_code"),
  fulfilledAt: timestamp("fulfilled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  customerIdx: index("reward_redemptions_customer_idx").on(table.customerId),
  rewardIdx: index("reward_redemptions_reward_idx").on(table.rewardId),
  statusIdx: index("reward_redemptions_status_idx").on(table.status),
  dateIdx: index("reward_redemptions_date_idx").on(table.createdAt),
}));

// System configuration
export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false), // Whether this config is visible to frontend
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  keyIdx: index("system_config_key_idx").on(table.key),
  publicIdx: index("system_config_public_idx").on(table.isPublic),
}));

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  adminName: text("admin_name"),
  shopName: text("shop_name"),
  whatsappBusinessNumber: text("whatsapp_business_number"),
  industry: text("industry"), // food, fashion, electronics, beauty, services, others
  isOnboarded: boolean("is_onboarded").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  usernameIdx: index("users_username_idx").on(table.username),
}));

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);



// Bill items table for line-item details (if OCR can extract them)
export const billItems = pgTable("bill_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull().references(() => bills.id, { onDelete: "cascade" }),
  // Item details from OCR
  itemName: text("item_name").notNull(),
  itemCode: text("item_code"), // Product code if available
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  // Additional OCR data
  category: text("category"), // If OCR can detect item category
  notes: text("notes"), // Any additional OCR-extracted info
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  billIdx: index("bill_items_bill_idx").on(table.billId),
  nameIdx: index("bill_items_name_idx").on(table.itemName),
  codeIdx: index("bill_items_code_idx").on(table.itemCode),
}));

// Cashier users table for discount redemption tracking
export const cashiers = pgTable("cashiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  employeeId: text("employee_id").unique(),
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  employeeIdx: index("cashiers_employee_idx").on(table.employeeId),
  activeIdx: index("cashiers_active_idx").on(table.isActive),
}));

// Discount transactions table for cashier discount redemptions
export const discountTransactions = pgTable("discount_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  cashierId: varchar("cashier_id").references(() => cashiers.id, { onDelete: "set null" }),
  billId: varchar("bill_id").references(() => bills.id, { onDelete: "set null" }), // Optional link to bill if discount applied to specific purchase
  // Discount details
  pointsUsed: integer("points_used").notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }),
  // Transaction metadata
  transactionType: text("transaction_type").notNull().default("discount"), // discount, refund, adjustment
  notes: text("notes"),
  status: text("status").notNull().default("completed"), // completed, pending, cancelled, refunded
  appliedAt: timestamp("applied_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  customerIdx: index("discount_transactions_customer_idx").on(table.customerId),
  cashierIdx: index("discount_transactions_cashier_idx").on(table.cashierId),
  billIdx: index("discount_transactions_bill_idx").on(table.billId),
  dateIdx: index("discount_transactions_date_idx").on(table.appliedAt),
  statusIdx: index("discount_transactions_status_idx").on(table.status),
  typeIdx: index("discount_transactions_type_idx").on(table.transactionType),
}));

// Define relationships using Drizzle relations
export const customersRelations = relations(customers, ({ many }) => ({
  coupons: many(coupons),
  referralsMade: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referred" }),
  whatsappMessages: many(whatsappMessages),
  pointsTransactions: many(pointsTransactions),
  rewardRedemptions: many(rewardRedemptions),
  sales: many(sales),
  bills: many(bills),
  discountTransactions: many(discountTransactions),
}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  coupons: many(coupons),
  referrals: many(referrals),
  pointTiers: many(pointTiers),
  sales: many(sales),
}));

export const productsRelations = relations(products, ({ many }) => ({
  pointTiers: many(pointTiers),
  saleItems: many(saleItems),
}));

export const pointTiersRelations = relations(pointTiers, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [pointTiers.campaignId],
    references: [campaigns.id],
  }),
  product: one(products, {
    fields: [pointTiers.productId],
    references: [products.id],
  }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  referral: one(referrals, {
    fields: [sales.referralId],
    references: [referrals.id],
  }),
  campaign: one(campaigns, {
    fields: [sales.campaignId],
    references: [campaigns.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ one }) => ({
  customer: one(customers, {
    fields: [coupons.customerId],
    references: [customers.id],
  }),
  campaign: one(campaigns, {
    fields: [coupons.campaignId],
    references: [campaigns.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(customers, {
    fields: [referrals.referrerId],
    references: [customers.id],
    relationName: "referrer",
  }),
  referredCustomer: one(customers, {
    fields: [referrals.referredCustomerId],
    references: [customers.id],
    relationName: "referred",
  }),
  campaign: one(campaigns, {
    fields: [referrals.campaignId],
    references: [campaigns.id],
  }),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  customer: one(customers, {
    fields: [whatsappMessages.customerId],
    references: [customers.id],
  }),
}));

export const pointsTransactionsRelations = relations(pointsTransactions, ({ one }) => ({
  customer: one(customers, {
    fields: [pointsTransactions.customerId],
    references: [customers.id],
  }),
  referral: one(referrals, {
    fields: [pointsTransactions.referralId],
    references: [referrals.id],
  }),
}));

export const rewardsRelations = relations(rewards, ({ many }) => ({
  redemptions: many(rewardRedemptions),
}));

export const rewardRedemptionsRelations = relations(rewardRedemptions, ({ one }) => ({
  customer: one(customers, {
    fields: [rewardRedemptions.customerId],
    references: [customers.id],
  }),
  reward: one(rewards, {
    fields: [rewardRedemptions.rewardId],
    references: [rewards.id],
  }),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bills.customerId],
    references: [customers.id],
  }),
  referrer: one(customers, {
    fields: [bills.referrerId],
    references: [customers.id],
  }),
  items: many(billItems),
  discountTransactions: many(discountTransactions),
}));

export const billItemsRelations = relations(billItems, ({ one }) => ({
  bill: one(bills, {
    fields: [billItems.billId],
    references: [bills.id],
  }),
}));

export const cashiersRelations = relations(cashiers, ({ many }) => ({
  discountTransactions: many(discountTransactions),
}));

export const discountTransactionsRelations = relations(discountTransactions, ({ one }) => ({
  customer: one(customers, {
    fields: [discountTransactions.customerId],
    references: [customers.id],
  }),
  cashier: one(cashiers, {
    fields: [discountTransactions.cashierId],
    references: [cashiers.id],
  }),
  bill: one(bills, {
    fields: [discountTransactions.billId],
    references: [bills.id],
  }),
}));

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  totalReferrals: true,
  isActive: true,
  lastActivity: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  participantCount: true,
  referralsCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
  endDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
  pointCalculationType: z.enum(["fixed", "percentage", "tier"]).default("fixed"),
  maximumPoints: z.union([
    z.string().transform((val) => val === "" ? undefined : parseInt(val)),
    z.number(),
    z.undefined()
  ]).optional(),
  minimumPurchase: z.union([
    z.string().transform((val) => val === "" ? "0" : val),
    z.number().transform((val) => val.toString())
  ]).optional(),
  percentageRate: z.union([
    z.string().transform((val) => val === "" ? null : val),
    z.null(),
    z.undefined()
  ]).optional(),
  budget: z.union([
    z.string().transform((val) => val === "" ? null : val),
    z.number().transform((val) => val.toString()),
    z.null(),
    z.undefined()
  ]).optional(),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  readAt: true,
}).extend({
  type: z.enum(["welcome_referral", "welcome_ecoupon", "coupon_generated", "reward_earned", "broadcast"]),
});

// Product and Sales schemas
export const insertProductSchema = createInsertSchema(products, {
  productCode: z.string().min(1, "Product code is required"),
  price: z.union([
    z.string().transform((val) => parseFloat(val)),
    z.number()
  ]).transform((val) => typeof val === 'string' ? parseFloat(val) : val),
  stockQuantity: z.number().optional(),
  fixedPoints: z.number().optional(),
  minimumQuantity: z.number().min(1).optional(),
});

export const insertPointTierSchema = createInsertSchema(pointTiers).omit({
  id: true,
  createdAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["pending", "completed", "refunded", "cancelled"]).default("completed"),
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
  createdAt: true,
});

// New schema exports
export const insertPointsTransactionSchema = createInsertSchema(pointsTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRewardRedemptionSchema = createInsertSchema(rewardRedemptions).omit({
  id: true,
  fulfilledAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const onboardingSchema = z.object({
  adminName: z.string().min(1, "Admin name is required"),
  shopName: z.string().min(1, "Shop name is required"),
  whatsappBusinessNumber: z.string().min(10, "Valid WhatsApp business number is required"),
  industry: z.enum(["food", "fashion", "electronics", "beauty", "services", "others"], {
    required_error: "Please select an industry",
  }),
});

// OCR Bill Processing schemas are defined above

export const insertCashierSchema = createInsertSchema(cashiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillItemSchema = createInsertSchema(billItems).omit({
  id: true,
  createdAt: true,
});

export const insertDiscountTransactionSchema = createInsertSchema(discountTransactions).omit({
  id: true,
  appliedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  transactionType: z.enum(["discount", "refund", "adjustment"]).default("discount"),
  status: z.enum(["completed", "pending", "cancelled", "refunded"]).default("completed"),
});

// OCR processing schema for bill upload
export const ocrBillUploadSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  referralCode: z.string().optional(), // If uploaded with referral code
  imageData: z.string().min(1, "Bill image is required"), // Base64 encoded image
});

// Cashier discount application schema
export const applyDiscountSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  cashierId: z.string().min(1, "Cashier ID is required"),
  pointsToUse: z.number().min(1, "Points to use must be positive"),
  discountPercent: z.number().min(0).max(100).optional(),
  originalAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;

export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type InsertPointsTransaction = z.infer<typeof insertPointsTransactionSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertRewardRedemption = z.infer<typeof insertRewardRedemptionSchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type OnboardingData = z.infer<typeof onboardingSchema>;

// New table types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type PointTier = typeof pointTiers.$inferSelect;
export type InsertPointTier = z.infer<typeof insertPointTierSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;

export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;

export type BillItem = typeof billItems.$inferSelect;
export type InsertBillItem = z.infer<typeof insertBillItemSchema>;

export type Cashier = typeof cashiers.$inferSelect;
export type InsertCashier = z.infer<typeof insertCashierSchema>;

export type DiscountTransaction = typeof discountTransactions.$inferSelect;
export type InsertDiscountTransaction = z.infer<typeof insertDiscountTransactionSchema>;

// OCR Bill Processing types
export type OCRBillUpload = z.infer<typeof ocrBillUploadSchema>;
export type ApplyDiscount = z.infer<typeof applyDiscountSchema>;

// Updated business logic schemas
export const redeemPointsSchema = z.object({
  pointsToRedeem: z.number().min(1, "Must redeem at least 1 point"),
  rewardId: z.string().optional(),
  rewardDescription: z.string().optional()
});

export type RedeemPoints = z.infer<typeof redeemPointsSchema>;

// Additional validation schemas
export const referralCodeSchema = z.object({
  code: z.string().min(3, "Referral code must be at least 3 characters"),
});

export const couponRedemptionSchema = z.object({
  couponCode: z.string().min(1, "Coupon code is required"),
  customerId: z.string().optional(),
  saleAmount: z.number().min(0, "Sale amount must be positive").optional(),
});

// Process sale schema for point calculation
export const processSaleSchema = z.object({
  customerId: z.string().optional(),
  referralCode: z.string().optional(),
  campaignId: z.string().optional(),
  totalAmount: z.number().min(0, "Sale amount must be positive"),
  items: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().min(1, "Product name is required"),
    productSku: z.string().optional(),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be positive"),
    totalPrice: z.number().min(0, "Total price must be positive"),
  })),
  posTransactionId: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export type ProcessSale = z.infer<typeof processSaleSchema>;