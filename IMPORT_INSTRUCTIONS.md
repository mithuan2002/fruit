# Fruitbox Import Instructions for New Replit Environment

Follow these step-by-step instructions to successfully import and set up the Fruitbox project in a new Replit environment.

## Step 1: Import the Project

1. **Create New Replit**
   - Go to [replit.com](https://replit.com)
   - Click "Create Repl"
   - Choose "Import from GitHub" or upload project files

2. **Import Method A: From GitHub**
   - Enter the repository URL
   - Replit will automatically detect it's a Node.js project
   - Click "Import Repl"

3. **Import Method B: Upload Files**
   - Create a new Node.js Repl
   - Upload all project files maintaining the folder structure

## Step 2: Verify Project Structure

After import, ensure you have this structure:
```
fruitbox/
├── client/                 # React frontend
├── server/                 # Express backend  
├── shared/                 # Shared types/schema
├── migrations/            # Database migrations
├── package.json           # Dependencies
├── drizzle.config.ts      # Database config
├── DATABASE_SETUP.md      # Schema documentation
├── SETUP_GUIDE.md         # Detailed setup guide
└── README.md              # Project overview
```

## Step 3: Set Up PostgreSQL Database

### Option A: Use Replit Database (Recommended)
1. **Open Database Panel**
   - Click on "Database" icon in left sidebar
   - Click "Create database"
   - Select "PostgreSQL"

2. **Get Connection Details**
   - Once created, click "Connect"
   - Copy the connection string (DATABASE_URL)
   - It will look like: `postgresql://username:password@db.replit.com:5432/main`

### Option B: Use External Database
1. **Create Database with External Provider**
   - Neon: [neon.tech](https://neon.tech) (recommended)
   - Vercel: [vercel.com/storage/postgres](https://vercel.com/storage/postgres)
   - Railway: [railway.app](https://railway.app)

2. **Get Connection String**
   - Create new PostgreSQL database
   - Copy the connection string provided

## Step 4: Configure Environment Variables

1. **Open Replit Secrets**
   - Click on "Secrets" icon in left sidebar (lock icon)
   - Or go to Tools → Secrets

2. **Add Required Variables**
   
   **DATABASE_URL** (Required)
   ```
   Key: DATABASE_URL
   Value: postgresql://username:password@host:port/database
   ```
   
   **SESSION_SECRET** (Required)
   ```
   Key: SESSION_SECRET
   Value: [Generate a secure 32+ character string]
   ```
   
   To generate SESSION_SECRET, use one of these methods:
   ```bash
   # Method 1: In Replit Shell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Method 2: OpenSSL (if available)
   openssl rand -hex 32
   
   # Method 3: Manual (create a random 32+ character string)
   your-very-secure-random-string-here-32-chars-minimum
   ```

3. **Add Optional Variables** (for WhatsApp integration)
   
   **INTERAKT_API_TOKEN** (Optional)
   ```
   Key: INTERAKT_API_TOKEN
   Value: your-interakt-api-token
   ```
   
   **INTERAKT_BUSINESS_NUMBER** (Optional)
   ```
   Key: INTERAKT_BUSINESS_NUMBER  
   Value: your-whatsapp-business-number
   ```

## Step 5: Install Dependencies and Setup Database

1. **Dependencies Install**
   - Replit should automatically install dependencies
   - If not, run in Shell: `npm install`

2. **Initialize Database Schema**
   - Open Replit Shell (click Shell tab)
   - Run: `npm run db:push`
   - This creates all necessary tables and relationships

3. **Verify Database Setup**
   - The command should complete without errors
   - You should see messages about creating tables

## Step 6: Start the Application

1. **Run the Application**
   - Click the "Run" button
   - Or run in Shell: `npm run dev`

2. **Access the Application**
   - Replit will provide a URL (usually shown at the top)
   - Click the URL or the "Open in new tab" button
   - You should see the Fruitbox landing page

## Step 7: Complete Initial Setup

1. **Create Admin Account**
   - Click "Get Started" or go to `/auth`
   - Click "Sign Up" 
   - Fill in admin details (username, password)

2. **Complete Onboarding**
   - Enter shop information
   - Choose your industry
   - Set WhatsApp business number (if using WhatsApp features)

3. **Verify Setup**
   - You should reach the dashboard
   - All navigation should work
   - Database connection should be confirmed

## Step 8: Test Core Functionality

1. **Add Test Customer**
   - Go to Customers page
   - Add a customer with name and phone number
   - Verify referral code is generated

2. **Add Test Product**
   - Go to Products page
   - Add a product with name, code, and price
   - Save and verify it appears in the list

3. **Test Referral Processing**
   - Go to Dashboard
   - Use "Process Referral Sale" section
   - Enter customer's referral code and product code
   - Verify points are awarded

## Troubleshooting Common Issues

### Issue 1: "DATABASE_URL, ensure the database is provisioned"
**Solution:**
- Verify DATABASE_URL is set in Replit Secrets
- Check the connection string format is correct
- Ensure database exists and is accessible

### Issue 2: Dependencies not installing
**Solution:**
```bash
# In Replit Shell
rm -rf node_modules package-lock.json
npm install
```

### Issue 3: Database migration fails
**Solution:**
```bash
# Check database connection first
npm run db:push

# If it fails, verify DATABASE_URL and try again
```

### Issue 4: Application won't start
**Solution:**
- Check Console for error messages
- Verify all required environment variables are set
- Check that database is accessible
- Try running `npm run check` to verify TypeScript compilation

### Issue 5: "Module not found" errors
**Solution:**
- Ensure all files were imported correctly
- Check that the project structure matches the expected layout
- Run `npm install` to ensure dependencies are installed

## Environment Variables Quick Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | ✅ Yes | Session encryption key (32+ chars) | `abc123def456...` |
| `INTERAKT_API_TOKEN` | ❌ No | WhatsApp API token | `your-token-here` |
| `INTERAKT_BUSINESS_NUMBER` | ❌ No | WhatsApp business number | `+1234567890` |
| `NODE_ENV` | ❌ No | Environment mode | `development` |

## Success Verification Checklist

- [ ] Project imported successfully
- [ ] Database created and connected
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Database schema created (`npm run db:push`)
- [ ] Application starts without errors
- [ ] Landing page loads
- [ ] Admin account creation works
- [ ] Dashboard accessible after login
- [ ] Can add customers and products
- [ ] Referral processing works
- [ ] Setup guides accessible

## Next Steps After Successful Import

1. **Explore Setup Guides**
   - Dashboard Setup Guide
   - Customer Management Guide
   - Campaign Setup Guide
   - WhatsApp Integration Guide
   - Points System Setup Guide

2. **Configure WhatsApp Integration** (Optional)
   - Get Interakt API credentials
   - Test message delivery
   - Set up automated flows

3. **Customize for Your Business**
   - Add your products
   - Create marketing campaigns
   - Set up point rules
   - Import existing customers (if any)

4. **Deploy to Production** (When Ready)
   - See DEPLOYMENT.md for production deployment guide
   - Configure production database
   - Set up monitoring and backups

## Support Resources

- **SETUP_GUIDE.md** - Comprehensive setup documentation
- **DATABASE_SETUP.md** - Database schema and troubleshooting
- **README.md** - Project overview and features
- **replit.md** - Architecture and recent changes
- **In-app guides** - Available within the application

---

**Need Help?** Check the documentation files or the in-app setup guides for detailed assistance.