import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, index } from "drizzle-orm/pg-core";
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
  rewardPerReferral: integer("reward_per_referral").notNull(),
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
  type: text("type").notNull(), // welcome_referral, coupon_generated, reward_earned, broadcast
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

// Define relationships using Drizzle relations
export const customersRelations = relations(customers, ({ many }) => ({
  coupons: many(coupons),
  referralsMade: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referred" }),
  whatsappMessages: many(whatsappMessages),
  pointsTransactions: many(pointsTransactions),
  rewardRedemptions: many(rewardRedemptions),
}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  coupons: many(coupons),
  referrals: many(referrals),
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
  type: z.enum(["welcome_referral", "coupon_generated", "reward_earned", "broadcast"]),
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