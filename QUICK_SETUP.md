
# Quick Setup Guide - Fruitbox Database Migration

This guide helps you set up the Fruitbox database in any environment quickly and reliably.

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database instance
2. **Node.js**: Version 16 or higher
3. **Environment Variables**: DATABASE_URL configured

## Setup Methods

### Method 1: Automatic Setup (Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Set your DATABASE_URL
export DATABASE_URL="postgresql://username:password@host:port/database"

# 3. Run automatic setup
npm run setup:database

# 4. Verify setup
npm run verify:database
```

### Method 2: Manual SQL Migration

```bash
# 1. Connect to your PostgreSQL database
psql $DATABASE_URL

# 2. Run the migration file
\i migrations/0001_initial_setup.sql

# 3. Verify tables were created
\dt
```

### Method 3: Using Drizzle (Development)

```bash
# 1. Install dependencies
npm install

# 2. Push schema to database
npm run db:push

# 3. Generate migrations (optional)
npm run db:generate
```

## Environment Variables Required

Create a `.env` file or set these environment variables:

```env
# Required - Database Connection
DATABASE_URL=postgresql://username:password@host:port/database

# Required - Session Security  
SESSION_SECRET=your-secure-random-string-here

# Optional - WhatsApp Integration
INTERAKT_API_TOKEN=your-interakt-token
INTERAKT_BUSINESS_NUMBER=your-whatsapp-number

# Optional - Environment
NODE_ENV=production  # or development
```

## Database Providers

### Replit PostgreSQL (Recommended)
```bash
# In Replit, go to Database tab and create PostgreSQL instance
# Copy the DATABASE_URL from connection details
```

### Neon Database
```bash
# Sign up at neon.tech
# Create new project and database
# Copy connection string
```

### Railway
```bash
# Sign up at railway.app
# Add PostgreSQL service
# Copy DATABASE_URL from variables
```

### Supabase
```bash
# Sign up at supabase.com
# Create new project
# Go to Settings > Database
# Copy connection string
```

## Verification

After setup, verify your database:

```bash
npm run verify:database
```

Expected output:
```
✅ Database verification passed!
📊 Tables: 15
🔗 Foreign keys: 12
📇 Indexes: 25
⚙️ System configs: 5
```

## Troubleshooting

### Connection Issues
- Ensure DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
- Check firewall/network connectivity
- Verify database exists and user has permissions

### Migration Failures
- Check PostgreSQL version (9.6+ required)
- Ensure database is empty or run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
- Check for existing data conflicts

### Permission Issues
- Database user needs `CREATE`, `ALTER`, `INSERT`, `UPDATE`, `DELETE` permissions
- For production: limit permissions to specific database only

## Starting the Application

Once database is set up:

```bash
# Development
npm run dev

# Production
npm start
```

The application will automatically verify database connectivity on startup.

## Schema Updates

When updating the schema:

1. Create new migration file: `migrations/0002_your_changes.sql`
2. Update the setup script to include new migration
3. Test in development environment first
4. Apply to production with backup

## Support

- Check logs for detailed error messages
- Ensure all environment variables are set
- Verify database provider connectivity
- For Replit-specific issues, check database provisioning status

This setup ensures your Fruitbox database can be migrated to any environment with minimal complexity.
