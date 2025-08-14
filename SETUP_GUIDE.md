# Fruitbox Setup Guide - Complete Installation Instructions

This guide will help you set up the Fruitbox referral marketing system in a new Replit environment or any Node.js environment.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Detailed Setup](#detailed-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Testing the Installation](#testing-the-installation)
6. [Troubleshooting](#troubleshooting)

## Quick Start

For immediate setup in Replit:

1. **Fork/Import this project** to your Replit workspace
2. **Create PostgreSQL database** using Replit's database panel
3. **Set environment variables** in Replit Secrets
4. **Run the application** using the "Start application" workflow

The system will automatically configure itself on first run.

## Detailed Setup

### 1. Project Structure

```
fruitbox/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility libraries
│   └── package.json
├── server/                 # Express backend
│   ├── db.ts              # Database connection
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Data access layer
│   ├── interaktService.ts # WhatsApp integration
│   └── pointsCalculator.ts # Points calculation logic
├── shared/                 # Shared types and schema
│   └── schema.ts          # Database schema definitions
├── migrations/            # Database migration files
├── .env.example          # Environment variables template
├── package.json          # Main project dependencies
├── drizzle.config.ts     # Database configuration
└── vite.config.ts        # Build configuration
```

### 2. Prerequisites

- Node.js 18+ (automatically available in Replit)
- PostgreSQL database (use Replit Database or external provider)
- Git (for version control)

### 3. Installation Steps

#### Step 1: Clone/Fork Repository

In Replit:
- Use "Import from GitHub" option
- Or fork this project directly

In Local Environment:
```bash
git clone <repository-url>
cd fruitbox
```

#### Step 2: Install Dependencies

Dependencies are automatically installed in Replit, or run:

```bash
npm install
```

#### Step 3: Database Configuration

Create a PostgreSQL database:

**In Replit:**
1. Go to Database panel
2. Create new PostgreSQL database
3. Copy the DATABASE_URL from connection details

**External Database (Neon/Vercel/Railway):**
1. Create account with database provider
2. Create new PostgreSQL database
3. Get connection string

#### Step 4: Environment Variables

Create environment variables in Replit Secrets or `.env` file:

```env
# Required - Database
DATABASE_URL=postgresql://username:password@host:port/database

# Required - Session Security
SESSION_SECRET=your-secure-random-string-here

# Optional - WhatsApp Integration
INTERAKT_API_TOKEN=your-interakt-token
INTERAKT_BUSINESS_NUMBER=your-whatsapp-number

# Optional - Development
NODE_ENV=development
```

#### Step 5: Database Migration

Initialize the database schema:

```bash
npm run db:push
```

This creates all necessary tables with proper relationships and indexes.

#### Step 6: Start Application

In Replit:
- Click "Run" or use the "Start application" workflow

In Local Environment:
```bash
npm run dev
```

The application will be available at `http://localhost:5000` (or your Replit URL).

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret for session encryption | `your-secure-random-string` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `INTERAKT_API_TOKEN` | WhatsApp API token | - |
| `INTERAKT_BUSINESS_NUMBER` | WhatsApp business number | - |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |

### Generating Secure SESSION_SECRET

Use any of these methods:

```bash
# Option 1: OpenSSL
openssl rand -hex 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Online generator
# Visit: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

## Database Setup

### Automatic Setup

The system automatically:
1. Connects to PostgreSQL database
2. Verifies schema exists
3. Creates missing tables
4. Sets up indexes and relationships
5. Initializes default configurations

### Manual Setup (if needed)

If automatic setup fails:

```bash
# Check database connection
npm run db:push

# Force schema reset (CAUTION: deletes all data)
# Only use in development
npm run db:reset
```

### Schema Verification

Check that all tables exist:

```sql
-- Run this query in your database console
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `campaigns`
- `coupons`
- `customers` 
- `products`
- `referrals`
- `users`
- `whatsapp_messages`

## Testing the Installation

### 1. Access the Application

Visit your application URL and verify:
- ✅ Landing page loads correctly
- ✅ Authentication system works
- ✅ Database connection is established

### 2. Create Admin Account

1. Go to `/auth` page
2. Click "Sign Up"
3. Complete onboarding with shop details
4. Verify dashboard loads with your shop information

### 3. Test Core Features

1. **Add a Customer**
   - Go to Customers page
   - Add test customer with phone number
   - Verify referral code is generated

2. **Create a Product**
   - Go to Products page
   - Add test product with code (e.g., "TEST123")
   - Set price and details

3. **Process a Sale**
   - Go to Dashboard
   - Use "Process Referral Sale" section
   - Enter customer's referral code and product code
   - Verify points are awarded

4. **Check WhatsApp Integration** (if configured)
   - Add new customer
   - Check if welcome message is sent
   - Monitor WhatsApp Center for delivery status

### 4. Verify Setup Guides

Navigate to each setup guide:
- `/dashboard-setup-guide`
- `/customers-setup-guide`
- `/campaigns-setup-guide`
- `/whatsapp-setup-guide`
- `/points-setup-guide`

All guides should load without errors.

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Error:** "DATABASE_URL, ensure the database is provisioned"

**Solution:**
- Verify DATABASE_URL is set in environment
- Check database is running and accessible
- Test connection string format

#### 2. Build/Start Failures

**Error:** Module not found or compilation errors

**Solution:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npm run check
```

#### 3. Authentication Issues

**Error:** Session/login problems

**Solution:**
- Verify SESSION_SECRET is set
- Check database connection
- Clear browser cookies and try again

#### 4. WhatsApp Integration

**Error:** Messages not sending

**Solution:**
- Verify INTERAKT_API_TOKEN is correct
- Check INTERAKT_BUSINESS_NUMBER format
- Test API credentials with Interakt directly

### Debug Mode

Enable detailed logging:

```env
NODE_ENV=development
DEBUG=*
```

This will show:
- Database queries
- API requests/responses
- WhatsApp message attempts
- Error stack traces

### Performance Issues

If the application is slow:

1. **Check Database Indexes**
   ```sql
   -- Verify indexes exist
   SELECT schemaname, tablename, indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public';
   ```

2. **Monitor Query Performance**
   ```sql
   -- Enable query logging in PostgreSQL
   SHOW log_statement;
   ```

3. **Check Network Latency**
   - Database connection speed
   - API response times

### Getting Help

1. **Check Logs**
   - Browser developer console
   - Server logs in terminal/Replit console
   - Database logs

2. **Verify Configuration**
   - Environment variables
   - Database schema
   - API credentials

3. **Test Components Individually**
   - Database connection
   - Frontend build
   - API endpoints
   - WhatsApp integration

## Production Deployment

For production deployment:

1. **Environment Security**
   - Use strong SESSION_SECRET
   - Enable SSL/HTTPS
   - Set NODE_ENV=production

2. **Database Security**
   - Use connection pooling
   - Enable SSL for database connections
   - Regular backups

3. **Monitoring**
   - Set up error tracking
   - Monitor database performance
   - Track API usage

4. **Scaling Considerations**
   - Database connection limits
   - Session storage
   - File upload limits

## Support

For additional support:
- Check the detailed documentation in each component
- Review the setup guides within the application
- Ensure all environment variables are properly configured
- Test database connectivity independently