# Overview

Fruitbox is a comprehensive referral marketing management system built as a full-stack web application. It provides businesses with tools to create and manage referral campaigns, track customer engagement, distribute coupon codes, and communicate with customers via automated WhatsApp messaging. The platform features a modern dashboard interface for monitoring campaign performance, customer management, and analytics reporting.

## Recent Changes (January 2025)

### Visual E-Coupon System Complete (Latest - August 13, 2025)
- Created professional-looking e-coupon cards that resemble actual discount coupons
- E-coupons automatically generated for each new customer with unique codes (EC prefix)
- Visual coupons display customer name, shop name, discount percentage, and usage terms
- Professional styling with gradients, borders, decorative scissors, and perforation dots
- Integrated into customer details view with scrollable layout for multiple coupons
- Added copy-to-clipboard functionality for easy code sharing
- E-coupons sent via WhatsApp welcome messages alongside referral codes

### Landing Page & Migration Complete (Previous - August 12, 2025)
- Successfully migrated project from Replit Agent to standard Replit environment
- Created completely separate landing page independent from authentication system
- Landing page features modern gradient design with comprehensive feature showcase
- Added industry-specific sections and clear call-to-action buttons
- Implemented proper routing: landing page (/) → auth (/auth) → dashboard flow
- Maintained all existing authentication and onboarding functionality
- Project now runs cleanly with PostgreSQL database and proper security practices

### Professional Authentication UI Complete (Previous)
- Completely redesigned authentication pages with professional, modern interface
- Added dark gradient background with floating elements and sophisticated branding
- Enhanced desktop experience with split-screen layout showing product features
- Improved form styling with rounded inputs, proper focus states, and placeholders
- Added gradient buttons with hover effects and better visual hierarchy
- Enhanced mobile responsiveness with condensed branding for smaller screens
- Confirmed onboarding bug is fixed - users properly redirected after completing onboarding

### Authentication & Onboarding System Complete (Previous)
- Implemented username/password authentication system with secure bcryptjs hashing
- Created comprehensive onboarding flow collecting shop details: admin name, shop name, WhatsApp business number, industry type
- Added personalized experience based on industry selection (food, fashion, electronics, beauty, services, others)
- Updated user interface to show shop information in sidebar and personalized dashboard content
- Fixed CSS button visibility issues - improved contrast, hover states, and accessibility
- Database schema enhanced with user profiles including shop information and onboarding status

### Database Setup Complete (Previous)
- Migrated from in-memory storage to PostgreSQL database with comprehensive schema
- Enhanced schema with proper relationships, indexes, and additional tables for analytics
- Added new tables: points_transactions, rewards, reward_redemptions, system_config, users
- Improved data integrity with foreign key constraints and proper cascading rules
- Created database indexes for optimal query performance
- Seeded database with initial system configuration and reward catalog
- Updated field names: couponCode → referralCode for consistency

### WhatsApp Integration (Previous)
- Successfully migrated from SMS to Interakt WhatsApp integration
- Completely replaced SMS functionality with Interakt API integration
- Removed WhatsApp Web.js simulation and implemented real Interakt messaging
- Created automated messaging triggers for new customers, points earned, and points redeemed
- Updated UI components (WhatsApp Center with Interakt integration)
- Implemented Interakt API token and business number configuration interface
- Added automatic welcome messages with referral codes for new customers
- Added points earned notifications when customers refer others
- Added points redemption confirmation messages

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Framework**: Express.js running on Node.js with TypeScript
- **API Design**: RESTful API endpoints organized by resource (customers, campaigns, coupons, referrals, SMS)
- **Data Validation**: Zod schemas for runtime type checking and validation
- **Development Environment**: Full-stack development with Vite middleware integration

## Data Storage
- **Database**: PostgreSQL with comprehensive schema for referral marketing system
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Management**: Centralized schema definitions in TypeScript with automatic validation
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment
- **Tables**: customers, campaigns, coupons, referrals, whatsapp_messages, points_transactions, rewards, reward_redemptions, system_config
- **Relationships**: Properly defined foreign keys and cascading rules for data integrity
- **Indexes**: Optimized indexes on frequently queried columns for performance
- **Configuration**: System-wide settings stored in database for runtime configuration

## Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Security**: Environment-based configuration for sensitive credentials
- **API Protection**: Middleware-based request logging and error handling

## External Integrations
- **WhatsApp Service**: Interakt API integration for WhatsApp Business messaging
- **Real-time Messaging**: Automated customer notifications for welcome, points earned, and redemption
- **Environment Configuration**: Support for multiple deployment environments with fallback defaults
- **Development Tools**: Replit-specific plugins for cloud development environment

## Architecture Patterns
- **Monorepo Structure**: Shared schema and types between frontend and backend
- **Component-Based UI**: Modular React components with consistent design system
- **Service Layer**: Abstracted storage interface for flexible data persistence
- **Error Handling**: Centralized error management with user-friendly messaging
- **Real-time Updates**: Query invalidation and optimistic updates for responsive UX

# External Dependencies

## Core Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Interakt**: WhatsApp Business API service for customer communications

## Development & Deployment
- **Replit**: Cloud development environment with specialized tooling
- **Vite**: Frontend build tool and development server
- **Node.js**: Server runtime environment

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless component primitives
- **Lucide React**: Icon library for consistent iconography

## Data & State Management
- **Drizzle Kit**: Database migration and schema management
- **TanStack Query**: Server state management and caching
- **Zod**: Runtime schema validation

## Form & Interaction
- **React Hook Form**: Form state management with validation
- **Date-fns**: Date manipulation and formatting utilities
- **Wouter**: Lightweight React routing library