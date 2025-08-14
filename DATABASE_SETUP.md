# Database Setup Guide

This document provides comprehensive instructions for setting up the PostgreSQL database for the Fruitbox referral marketing system.

## Prerequisites

- PostgreSQL database (Neon Database recommended for cloud deployment)
- Node.js environment with npm installed
- Environment variables configured

## Database Schema Overview

The system uses 8 core tables with proper relationships and indexes for optimal performance:

### Core Tables

1. **users** - Admin user accounts and shop information
2. **customers** - Customer profiles with referral codes and points
3. **products** - Product catalog with point calculation settings
4. **campaigns** - Marketing campaigns with reward rules
5. **coupons** - Generated discount coupons
6. **referrals** - Referral tracking and rewards
7. **whatsapp_messages** - Message delivery tracking
8. **Additional tables** - Points transactions, rewards, system config

## Quick Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name

# Session Security
SESSION_SECRET=your-secure-session-secret-here

# WhatsApp Integration (Interakt)
INTERAKT_API_TOKEN=your-interakt-api-token
INTERAKT_BUSINESS_NUMBER=your-whatsapp-business-number

# Optional: Development Mode
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Migration

Push the schema to your database:

```bash
npm run db:push
```

This command will:
- Create all tables with proper relationships
- Set up indexes for performance optimization
- Configure foreign key constraints
- Initialize default values

### 4. Verify Setup

Start the application:

```bash
npm run dev
```

The system will automatically verify database connectivity and create initial configurations.

## Detailed Schema Documentation

### Table: users
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  whatsapp_number TEXT,
  industry TEXT,
  is_onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: customers
```sql
CREATE TABLE customers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT UNIQUE NOT NULL,
  points INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX customers_phone_idx ON customers(phone_number);
CREATE INDEX customers_referral_code_idx ON customers(referral_code);
CREATE INDEX customers_points_idx ON customers(points);
```

### Table: products
```sql
CREATE TABLE products (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_code TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  sku TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  point_calculation_type TEXT DEFAULT 'inherit',
  fixed_points INTEGER,
  percentage_rate DECIMAL(5,2),
  minimum_purchase DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX products_code_idx ON products(product_code);
CREATE INDEX products_active_idx ON products(is_active);
CREATE INDEX products_category_idx ON products(category);
```

### Table: campaigns
```sql
CREATE TABLE campaigns (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  point_calculation_type TEXT DEFAULT 'fixed',
  reward_per_referral INTEGER NOT NULL,
  percentage_rate DECIMAL(5,2),
  minimum_purchase DECIMAL(10,2) DEFAULT 0,
  maximum_points INTEGER,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  participant_count INTEGER DEFAULT 0,
  referrals_count INTEGER DEFAULT 0,
  goal_count INTEGER DEFAULT 100,
  budget DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX campaigns_active_idx ON campaigns(is_active);
CREATE INDEX campaigns_date_idx ON campaigns(start_date, end_date);
CREATE INDEX campaigns_type_idx ON campaigns(point_calculation_type);
```

### Table: referrals
```sql
CREATE TABLE referrals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id VARCHAR NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  referred_customer_id VARCHAR REFERENCES customers(id) ON DELETE SET NULL,
  campaign_id VARCHAR REFERENCES campaigns(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  sale_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX referrals_referrer_idx ON referrals(referrer_id);
CREATE INDEX referrals_referred_idx ON referrals(referred_customer_id);
CREATE INDEX referrals_status_idx ON referrals(status);
CREATE INDEX referrals_date_idx ON referrals(created_at);
```

### Table: whatsapp_messages
```sql
CREATE TABLE whatsapp_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR REFERENCES customers(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  interakt_message_id TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP
);

-- Indexes
CREATE INDEX whatsapp_messages_customer_idx ON whatsapp_messages(customer_id);
CREATE INDEX whatsapp_messages_phone_idx ON whatsapp_messages(phone_number);
CREATE INDEX whatsapp_messages_type_idx ON whatsapp_messages(type);
CREATE INDEX whatsapp_messages_status_idx ON whatsapp_messages(status);
CREATE INDEX whatsapp_messages_date_idx ON whatsapp_messages(sent_at);
```

## Key Relationships

1. **customers** ↔ **referrals**: One customer can have many referrals (as referrer)
2. **customers** ↔ **coupons**: One customer can have many coupons
3. **campaigns** ↔ **referrals**: One campaign can have many referrals
4. **products** ↔ **referrals**: Products track point earnings through referrals
5. **customers** ↔ **whatsapp_messages**: Message delivery tracking per customer

## Performance Optimizations

### Indexes Created
- Phone number lookups (customers, messages)
- Referral code lookups (customers)
- Points queries (customers)
- Product code lookups (products)
- Campaign date ranges (campaigns)
- Message type and status filtering (whatsapp_messages)

### Foreign Key Constraints
- **CASCADE DELETE**: When customer is deleted, their referrals are deleted
- **SET NULL**: When campaign/product is deleted, referrals keep historical data
- **UNIQUE CONSTRAINTS**: Phone numbers, referral codes, product codes

## Common Queries and Performance

```sql
-- Find customer by referral code (indexed)
SELECT * FROM customers WHERE referral_code = 'ABC123';

-- Get customer's referral history (indexed)
SELECT * FROM referrals WHERE referrer_id = 'customer-uuid' ORDER BY created_at DESC;

-- Active campaigns (indexed)
SELECT * FROM campaigns WHERE is_active = true AND NOW() BETWEEN start_date AND end_date;

-- Product lookup by code (indexed)
SELECT * FROM products WHERE product_code = 'SKU123' AND is_active = true;

-- Recent WhatsApp messages (indexed)
SELECT * FROM whatsapp_messages WHERE phone_number = '+1234567890' ORDER BY sent_at DESC;
```

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
   - Check network connectivity to database
   - Ensure database exists and user has permissions

2. **Migration Failures**
   - Run `npm run db:push` to apply schema changes
   - Check for existing data conflicts
   - Verify all environment variables are set

3. **Performance Issues**
   - Monitor index usage with EXPLAIN ANALYZE
   - Check for missing indexes on frequently queried columns
   - Consider adding composite indexes for complex queries

### Verification Queries

```sql
-- Check table existence
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verify indexes
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';

-- Check constraints
SELECT conname, contype FROM pg_constraint WHERE connamespace = 'public'::regnamespace;
```

## Security Considerations

1. **Environment Variables**: Never commit DATABASE_URL to version control
2. **User Permissions**: Database user should have minimal required permissions
3. **Connection Encryption**: Use SSL/TLS for database connections in production
4. **Session Security**: Use strong SESSION_SECRET and secure session storage

## Data Backup

For production environments:
1. Regular automated backups of PostgreSQL database
2. Point-in-time recovery configuration
3. Backup verification and restoration testing
4. Monitor backup storage and retention policies

## Migration from Existing Systems

If migrating from an existing system:
1. Export data in CSV format from existing database
2. Map fields to new schema structure
3. Use SQL COPY commands or custom migration scripts
4. Verify data integrity after migration
5. Update referral codes and relationships as needed