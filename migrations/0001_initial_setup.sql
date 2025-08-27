
-- Initial database setup for Fruitbox referral marketing system
-- This migration creates all necessary tables, indexes, and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for admin authentication
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" text UNIQUE NOT NULL,
	"password" text NOT NULL,
	"admin_name" text,
	"shop_name" text,
	"whatsapp_business_number" text,
	"industry" text,
	"is_onboarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text,
	"phone_number" text UNIQUE NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"total_referrals" integer DEFAULT 0 NOT NULL,
	"referral_code" text UNIQUE,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"points_redeemed" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_activity" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"point_calculation_type" text DEFAULT 'fixed' NOT NULL,
	"reward_per_referral" integer NOT NULL,
	"percentage_rate" numeric(5, 2),
	"minimum_purchase" numeric(10, 2) DEFAULT '0',
	"maximum_points" integer,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"participant_count" integer DEFAULT 0 NOT NULL,
	"referrals_count" integer DEFAULT 0 NOT NULL,
	"goal_count" integer DEFAULT 100 NOT NULL,
	"budget" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"product_code" text UNIQUE NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"category" text,
	"sku" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"stock_quantity" integer DEFAULT 0,
	"point_calculation_type" text DEFAULT 'inherit' NOT NULL,
	"fixed_points" integer,
	"percentage_rate" text,
	"minimum_quantity" integer DEFAULT 1,
	"bonus_multiplier" text DEFAULT '1.0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create coupons table
CREATE TABLE IF NOT EXISTS "coupons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text UNIQUE NOT NULL,
	"customer_id" varchar NOT NULL,
	"campaign_id" varchar,
	"value" integer NOT NULL,
	"value_type" text DEFAULT 'percentage' NOT NULL,
	"usage_limit" integer DEFAULT 1 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS "referrals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"referrer_id" varchar NOT NULL,
	"referred_customer_id" varchar,
	"campaign_id" varchar,
	"referral_code" text NOT NULL,
	"points_earned" integer NOT NULL,
	"sale_amount" numeric(10, 2) DEFAULT '0',
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"customer_id" varchar,
	"phone_number" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"interakt_message_id" text,
	"sent_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"read_at" timestamp
);

-- Create point_tiers table
CREATE TABLE IF NOT EXISTS "point_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"campaign_id" varchar,
	"product_id" varchar,
	"min_amount" numeric(10, 2) NOT NULL,
	"max_amount" numeric(10, 2),
	"points" integer NOT NULL,
	"multiplier" numeric(3, 2) DEFAULT '1.00',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS "sales" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"customer_id" varchar,
	"referral_id" varchar,
	"campaign_id" varchar,
	"total_amount" numeric(10, 2) NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"referral_code" text,
	"pos_transaction_id" text,
	"payment_method" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS "sale_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"sale_id" varchar NOT NULL,
	"product_id" varchar,
	"product_name" text NOT NULL,
	"product_sku" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS "points_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"customer_id" varchar NOT NULL,
	"referral_id" varchar,
	"type" text NOT NULL,
	"points" integer NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS "rewards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"points_cost" integer NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"stock_quantity" integer DEFAULT -1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create reward_redemptions table
CREATE TABLE IF NOT EXISTS "reward_redemptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"customer_id" varchar NOT NULL,
	"reward_id" varchar NOT NULL,
	"points_used" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"coupon_code" text,
	"fulfilled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create system_config table
CREATE TABLE IF NOT EXISTS "system_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" text UNIQUE NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now()
);

-- Create sessions table for session management
CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" timestamp NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "coupons" ADD CONSTRAINT IF NOT EXISTS "coupons_customer_id_customers_id_fk" 
	FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "coupons" ADD CONSTRAINT IF NOT EXISTS "coupons_campaign_id_campaigns_id_fk" 
	FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "point_tiers" ADD CONSTRAINT IF NOT EXISTS "point_tiers_campaign_id_campaigns_id_fk" 
	FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "point_tiers" ADD CONSTRAINT IF NOT EXISTS "point_tiers_product_id_products_id_fk" 
	FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "points_transactions" ADD CONSTRAINT IF NOT EXISTS "points_transactions_customer_id_customers_id_fk" 
	FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "points_transactions" ADD CONSTRAINT IF NOT EXISTS "points_transactions_referral_id_referrals_id_fk" 
	FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "referrals" ADD CONSTRAINT IF NOT EXISTS "referrals_referrer_id_customers_id_fk" 
	FOREIGN KEY ("referrer_id") REFERENCES "customers"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "referrals" ADD CONSTRAINT IF NOT EXISTS "referrals_referred_customer_id_customers_id_fk" 
	FOREIGN KEY ("referred_customer_id") REFERENCES "customers"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "referrals" ADD CONSTRAINT IF NOT EXISTS "referrals_campaign_id_campaigns_id_fk" 
	FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "reward_redemptions" ADD CONSTRAINT IF NOT EXISTS "reward_redemptions_customer_id_customers_id_fk" 
	FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "reward_redemptions" ADD CONSTRAINT IF NOT EXISTS "reward_redemptions_reward_id_rewards_id_fk" 
	FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "sale_items" ADD CONSTRAINT IF NOT EXISTS "sale_items_sale_id_sales_id_fk" 
	FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "sale_items" ADD CONSTRAINT IF NOT EXISTS "sale_items_product_id_products_id_fk" 
	FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "sales" ADD CONSTRAINT IF NOT EXISTS "sales_customer_id_customers_id_fk" 
	FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "sales" ADD CONSTRAINT IF NOT EXISTS "sales_referral_id_referrals_id_fk" 
	FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "sales" ADD CONSTRAINT IF NOT EXISTS "sales_campaign_id_campaigns_id_fk" 
	FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "whatsapp_messages" ADD CONSTRAINT IF NOT EXISTS "whatsapp_messages_customer_id_customers_id_fk" 
	FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE set null ON UPDATE no action;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");

CREATE INDEX IF NOT EXISTS "customers_phone_idx" ON "customers"("phone_number");
CREATE INDEX IF NOT EXISTS "customers_referral_code_idx" ON "customers"("referral_code");
CREATE INDEX IF NOT EXISTS "customers_points_idx" ON "customers"("points");

CREATE INDEX IF NOT EXISTS "campaigns_active_idx" ON "campaigns"("is_active");
CREATE INDEX IF NOT EXISTS "campaigns_date_idx" ON "campaigns"("start_date", "end_date");
CREATE INDEX IF NOT EXISTS "campaigns_type_idx" ON "campaigns"("point_calculation_type");

CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products"("name");
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products"("category");
CREATE INDEX IF NOT EXISTS "products_sku_idx" ON "products"("sku");
CREATE INDEX IF NOT EXISTS "products_code_idx" ON "products"("product_code");

CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_customer_idx" ON "coupons"("customer_id");
CREATE INDEX IF NOT EXISTS "coupons_active_idx" ON "coupons"("is_active");
CREATE INDEX IF NOT EXISTS "coupons_expiry_idx" ON "coupons"("expires_at");

CREATE INDEX IF NOT EXISTS "referrals_referrer_idx" ON "referrals"("referrer_id");
CREATE INDEX IF NOT EXISTS "referrals_referred_idx" ON "referrals"("referred_customer_id");
CREATE INDEX IF NOT EXISTS "referrals_status_idx" ON "referrals"("status");
CREATE INDEX IF NOT EXISTS "referrals_date_idx" ON "referrals"("created_at");

CREATE INDEX IF NOT EXISTS "whatsapp_messages_customer_idx" ON "whatsapp_messages"("customer_id");
CREATE INDEX IF NOT EXISTS "whatsapp_messages_phone_idx" ON "whatsapp_messages"("phone_number");
CREATE INDEX IF NOT EXISTS "whatsapp_messages_type_idx" ON "whatsapp_messages"("type");
CREATE INDEX IF NOT EXISTS "whatsapp_messages_status_idx" ON "whatsapp_messages"("status");
CREATE INDEX IF NOT EXISTS "whatsapp_messages_date_idx" ON "whatsapp_messages"("sent_at");

CREATE INDEX IF NOT EXISTS "point_tiers_campaign_idx" ON "point_tiers"("campaign_id");
CREATE INDEX IF NOT EXISTS "point_tiers_product_idx" ON "point_tiers"("product_id");
CREATE INDEX IF NOT EXISTS "point_tiers_amount_idx" ON "point_tiers"("min_amount", "max_amount");

CREATE INDEX IF NOT EXISTS "points_transactions_customer_idx" ON "points_transactions"("customer_id");
CREATE INDEX IF NOT EXISTS "points_transactions_type_idx" ON "points_transactions"("type");
CREATE INDEX IF NOT EXISTS "points_transactions_date_idx" ON "points_transactions"("created_at");

CREATE INDEX IF NOT EXISTS "rewards_active_idx" ON "rewards"("is_active");
CREATE INDEX IF NOT EXISTS "rewards_cost_idx" ON "rewards"("points_cost");

CREATE INDEX IF NOT EXISTS "reward_redemptions_customer_idx" ON "reward_redemptions"("customer_id");
CREATE INDEX IF NOT EXISTS "reward_redemptions_reward_idx" ON "reward_redemptions"("reward_id");
CREATE INDEX IF NOT EXISTS "reward_redemptions_status_idx" ON "reward_redemptions"("status");
CREATE INDEX IF NOT EXISTS "reward_redemptions_date_idx" ON "reward_redemptions"("created_at");

CREATE INDEX IF NOT EXISTS "sale_items_sale_idx" ON "sale_items"("sale_id");
CREATE INDEX IF NOT EXISTS "sale_items_product_idx" ON "sale_items"("product_id");

CREATE INDEX IF NOT EXISTS "sales_customer_idx" ON "sales"("customer_id");
CREATE INDEX IF NOT EXISTS "sales_referral_idx" ON "sales"("referral_id");
CREATE INDEX IF NOT EXISTS "sales_status_idx" ON "sales"("status");
CREATE INDEX IF NOT EXISTS "sales_date_idx" ON "sales"("created_at");
CREATE INDEX IF NOT EXISTS "sales_referral_code_idx" ON "sales"("referral_code");

CREATE INDEX IF NOT EXISTS "system_config_key_idx" ON "system_config"("key");
CREATE INDEX IF NOT EXISTS "system_config_public_idx" ON "system_config"("is_public");

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions"("expire");

-- Insert default system configurations
INSERT INTO "system_config" ("key", "value", "description", "is_public") VALUES 
	('app_name', 'Fruitbox', 'Application name', true),
	('default_points_per_referral', '10', 'Default points awarded per referral', false),
	('max_referral_levels', '3', 'Maximum referral chain levels', false),
	('point_expiry_days', '365', 'Days after which points expire', false),
	('whatsapp_enabled', 'false', 'Whether WhatsApp integration is enabled', false)
ON CONFLICT ("key") DO NOTHING;

-- Create a default campaign
INSERT INTO "campaigns" (
	"name", 
	"description", 
	"point_calculation_type", 
	"reward_per_referral", 
	"start_date", 
	"end_date", 
	"is_active"
) VALUES (
	'Default Referral Campaign',
	'Default campaign for customer referrals',
	'fixed',
	10,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP + INTERVAL '1 year',
	true
) ON CONFLICT DO NOTHING;

-- Create sample product for testing
INSERT INTO "products" (
	"name",
	"product_code",
	"description",
	"price",
	"category",
	"is_active"
) VALUES (
	'Sample Product',
	'SAMPLE001',
	'A sample product for testing the system',
	10.00,
	'General',
	true
) ON CONFLICT ("product_code") DO NOTHING;
