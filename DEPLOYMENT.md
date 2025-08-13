# Fruitbox Deployment Guide

## Vercel Full-Stack Deployment

This project is configured for full-stack deployment on Vercel with both frontend and backend functionality.

### Current Configuration:

**vercel.json**:
- Deploys the Node.js backend as a serverless function
- Serves the React frontend through the same server
- Handles both API routes and static file serving

**.vercelignore**:
- Excludes development files and dependencies
- Includes all necessary source files for build

### Prerequisites:

1. **Neon Database**: Your PostgreSQL database connection string
2. **Interakt API**: Your WhatsApp integration credentials (optional for basic functionality)

### Deploy Steps:

1. **Push to GitHub**: Ensure your code is committed to a GitHub repository

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

3. **Set Environment Variables** in Vercel dashboard:
   ```
   DATABASE_URL=your_neon_database_connection_string
   SESSION_SECRET=your_random_session_secret
   INTERAKT_API_TOKEN=your_interakt_token (optional)
   INTERAKT_BUSINESS_NUMBER=your_whatsapp_number (optional)
   ```

4. **Deploy**: Vercel will build and deploy automatically

### What Gets Deployed:

✅ Complete referral marketing system
✅ Authentication and user management
✅ Product management with point calculation
✅ Campaign management with flexible rules
✅ Sales processing with real-time calculations
✅ Customer management and WhatsApp integration
✅ Dashboard with analytics and reporting
✅ POS integration capabilities
✅ Professional UI with dark/light theme support

### Key Features:

- **Point System**: Flexible point calculation (fixed, percentage, tier-based)
- **Campaign Management**: Create and manage referral campaigns
- **Sales Processing**: Process transactions with automatic point calculation
- **Customer Management**: Add customers and track their activity
- **WhatsApp Integration**: Automated customer notifications
- **Dashboard**: Comprehensive analytics and performance tracking
- **POS Integration**: Support for Square, Shopify, and custom APIs

### Build Process:

- **Frontend**: Vite builds the React application
- **Backend**: Node.js Express server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Serverless**: Optimized for Vercel's serverless functions

### Troubleshooting:

If deployment fails:
1. Check that all environment variables are set correctly
2. Ensure DATABASE_URL points to a valid PostgreSQL database
3. Verify the database schema is up to date (run migrations if needed)
4. Check Vercel build logs for specific error messages

### Local Testing:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Post-Deployment:

1. Test the authentication system
2. Create your first products and campaigns
3. Process a test sale to verify point calculation
4. Configure WhatsApp integration if desired
5. Set up POS integration for automatic customer sync

Your Fruitbox system is now ready for production use! 🎉