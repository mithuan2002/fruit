import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  points: integer("points").notNull().default(0),
  totalReferrals: integer("total_referrals").notNull().default(0),
  couponCode: text("coupon_code").unique(),
  pointsEarned: integer("points_earned").notNull().default(0),
  pointsRedeemed: integer("points_redeemed").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  createdAt: timestamp("created_at").defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  value: integer("value").notNull(),
  usageLimit: integer("usage_limit").notNull().default(100),
  usageCount: integer("usage_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => customers.id),
  referredCustomerId: varchar("referred_customer_id").references(() => customers.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  couponCode: text("coupon_code").references(() => coupons.code),
  pointsEarned: integer("points_earned").notNull(),
  saleAmount: integer("sale_amount").default(0),
  status: text("status").notNull().default("pending"), // pending, completed, expired
  createdAt: timestamp("created_at").defaultNow(),
});

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  phoneNumber: text("phone_number").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // welcome_referral, coupon_generated, reward_earned, broadcast
  status: text("status").notNull().default("pending"), // pending, sent, delivered, failed
  sentAt: timestamp("sent_at").defaultNow(),
});

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  totalReferrals: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  participantCount: true,
  referralsCount: true,
  createdAt: true,
}).extend({
  startDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
  endDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usageCount: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  sentAt: true,
}).extend({
  type: z.enum(["welcome_referral", "coupon_generated", "reward_earned", "broadcast"]),
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

// WATI WhatsApp service types
export const watiConfigSchema = z.object({
  apiToken: z.string(),
  businessPhoneNumber: z.string(),
  businessName: z.string(),
  isConfigured: z.boolean()
});

export const whatsappStatusSchema = z.object({
  connected: z.boolean(),
  businessNumber: z.string(),
  businessName: z.string(),
  configured: z.boolean()
});

export type WatiConfig = z.infer<typeof watiConfigSchema>;
export type WhatsappStatus = z.infer<typeof whatsappStatusSchema>;

// Points redemption schema
export const redeemPointsSchema = z.object({
  pointsToRedeem: z.number().min(1, "Must redeem at least 1 point"),
  rewardDescription: z.string().optional()
});

export type RedeemPoints = z.infer<typeof redeemPointsSchema>;