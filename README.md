# Fruitbox - Referral Marketing Management System

A comprehensive full-stack web application for managing referral marketing campaigns, customer engagement, and automated WhatsApp communications.

## 🚀 Quick Start

### For Replit Users

1. **Import this project** to your Replit workspace
2. **Create PostgreSQL database** in Replit Database panel
3. **Set environment variables** in Replit Secrets:
   ```
   DATABASE_URL=your-postgresql-connection-string
   SESSION_SECRET=your-secure-random-string
   ```
4. **Click Run** - the application will auto-configure!

### For Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fruitbox
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Initialize database**
   ```bash
   npm run db:push
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5000` to access the application.

## 📋 Features

### Core Functionality
- **Customer Management** - Add customers with automatic referral code generation
- **Product Catalog** - Manage products with flexible point calculation rules
- **Campaign Management** - Create marketing campaigns with custom reward structures
- **Points System** - Flexible point rules for products and campaigns
- **Referral Tracking** - Comprehensive tracking of customer referrals and rewards
- **E-Coupon Generation** - Personalized e-coupons with modern UI design

### WhatsApp Integration
- **Automated Messaging** - Welcome messages for new customers
- **E-Coupon Delivery** - Automatic delivery of personalized e-coupons
- **Points Notifications** - Notify customers when they earn or redeem points
- **Message Tracking** - Monitor delivery status and engagement

### Admin Dashboard
- **Real-time Analytics** - Monitor campaign performance and customer engagement
- **Sales Processing** - Process referral sales and award points instantly
- **Setup Guides** - Comprehensive guides for each system component
- **POS Integration** - Connect with Square, Shopify, and custom APIs

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn/ui
- **Backend**: Express.js + Node.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Authentication**: Session-based with bcryptjs
- **WhatsApp**: Interakt API integration

### Project Structure
```
fruitbox/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages and routing
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility libraries
├── server/                 # Express backend API
│   ├── db.ts              # Database connection setup
│   ├── routes.ts          # API endpoint definitions
│   ├── storage.ts         # Data access layer
│   └── interaktService.ts # WhatsApp integration
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema definitions
├── migrations/            # Database migration files
└── Documentation files
```

## 📊 Database Schema

### Core Tables (8 primary tables)
1. **users** - Admin accounts and shop configuration
2. **customers** - Customer profiles with referral codes and points
3. **products** - Product catalog with point calculation settings
4. **campaigns** - Marketing campaigns with reward rules
5. **coupons** - Generated discount coupons
6. **referrals** - Referral tracking and point awards
7. **whatsapp_messages** - Message delivery tracking
8. **points_transactions** - Points earning/redemption history

### Key Features
- **Performance Optimized** - Indexes on critical lookup columns
- **Data Integrity** - Foreign key constraints and proper relationships
- **Audit Trail** - Created/updated timestamps on all records
- **Scalable Design** - UUID primary keys and efficient query patterns

For detailed schema documentation, see [DATABASE_SETUP.md](./DATABASE_SETUP.md).

## 🔧 Configuration

### Required Environment Variables
```env
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-secure-random-string-here
```

### Optional Environment Variables
```env
# WhatsApp Integration (Interakt)
INTERAKT_API_TOKEN=your-interakt-api-token
INTERAKT_BUSINESS_NUMBER=your-whatsapp-business-number

# Development
NODE_ENV=development
DEBUG=*
```

### Database Setup
The application automatically creates all necessary tables and relationships. Simply provide a valid PostgreSQL connection string and run:

```bash
npm run db:push
```

## 📖 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete installation instructions
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Detailed database schema documentation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[replit.md](./replit.md)** - Project architecture and recent changes

### In-App Guides
The application includes comprehensive setup guides accessible from the admin interface:
- Dashboard Setup Guide
- Customer Management Guide
- Campaign Setup Guide
- WhatsApp Integration Guide
- Points System Setup Guide

## 🎯 Use Cases

### For E-commerce Businesses
- **Referral Programs** - Reward customers for bringing new business
- **Loyalty Points** - Flexible point systems for repeat customers
- **Marketing Campaigns** - Time-limited promotions and special offers
- **Customer Engagement** - Automated WhatsApp communications

### For Service Businesses
- **Customer Retention** - Points for service bookings
- **Word-of-Mouth Marketing** - Incentivize customer referrals
- **Promotional Campaigns** - Special offers for holidays/events
- **Communication Automation** - Keep customers informed via WhatsApp

### Real Campaign Examples
- **"Christmas offer: refer to buy two hoodies and get 1 free"**
- **"New customer gets 100 points, referrer gets 50 points"**
- **"Double points weekend for electronics purchases"**
- **"Refer 5 friends and get free premium service"**

## 🔧 Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Apply database schema changes
npm run check        # Type checking
```

### Adding New Features
1. **Database Changes** - Update `shared/schema.ts`
2. **API Endpoints** - Add routes in `server/routes.ts`
3. **Frontend Pages** - Create components in `client/src/pages/`
4. **Types** - Update shared types for consistency

### Testing
- **Manual Testing** - Use the built-in setup guides and examples
- **Database Testing** - Verify with sample data and real scenarios
- **WhatsApp Testing** - Test with real phone numbers (in development)

## 🚀 Deployment

### Replit Deployment
1. **Database** - Use Replit PostgreSQL or external provider
2. **Environment** - Set variables in Replit Secrets
3. **Deploy** - Use Replit's built-in deployment features

### External Deployment (Vercel/Railway/Heroku)
1. **Database** - Provision PostgreSQL database
2. **Build** - Run `npm run build`
3. **Environment** - Configure production environment variables
4. **Deploy** - Follow platform-specific deployment guides

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🔐 Security

- **Password Hashing** - bcryptjs for secure password storage
- **Session Management** - Secure session handling with PostgreSQL store
- **Environment Variables** - Sensitive data stored in environment variables
- **Database Security** - Parameterized queries prevent SQL injection
- **Input Validation** - Zod schemas validate all inputs

## 📞 Support

### Getting Help
1. **Setup Issues** - Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. **Database Issues** - Review [DATABASE_SETUP.md](./DATABASE_SETUP.md)
3. **In-App Guides** - Use the comprehensive guides within the application

### Common Issues
- **Database Connection** - Verify DATABASE_URL format and accessibility
- **WhatsApp Integration** - Check API credentials and phone number format
- **Build Errors** - Ensure all dependencies are installed correctly

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

**Built with ❤️ for modern referral marketing management**