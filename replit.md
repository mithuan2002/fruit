# Overview

Fruitbox is a comprehensive referral marketing management system designed as a full-stack web application. It enables businesses to create and manage referral campaigns, track customer engagement, distribute e-coupon codes, and communicate with customers via automated WhatsApp messaging. The platform provides a modern dashboard for monitoring campaign performance, customer management, and analytics reporting.

## Business Vision & Ambition

Fruitbox aims to be the leading platform for businesses seeking to leverage referral marketing for customer acquisition and retention. By integrating seamlessly with POS systems and utilizing automated WhatsApp communication, Fruitbox provides a powerful, user-friendly solution to grow customer bases and drive sales through word-of-mouth referrals. Our ambition is to simplify referral program management for businesses of all sizes, making sophisticated marketing accessible and effective.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Build Tool**: Vite for fast development and optimized production builds
- **UI/UX Decisions**: Modern aesthetic with dark gradient backgrounds, floating elements, and sophisticated branding. Emphasizes clean, minimalist e-coupon designs with personalized touches (gradient backgrounds, decorative elements, clear typography). Split-screen layouts for desktop authentication and enhanced mobile responsiveness.

## Backend Architecture
- **Framework**: Express.js running on Node.js with TypeScript
- **API Design**: RESTful API endpoints
- **Data Validation**: Zod schemas for runtime type checking and validation

## Data Storage & Database Schema
- **Database**: Currently using in-memory storage (MemoryStorage) due to disabled Neon endpoint
- **ORM**: Drizzle ORM for type-safe database operations and migrations (ready for PostgreSQL)
- **Schema Management**: Centralized schema definitions with automatic validation
- **Core Tables**: Users, customers, products, campaigns, coupons (referral codes), referrals, and points transactions
- **Database Features**: UUID primary keys, performance-optimized indexes (phone numbers, referral codes), UNIQUE constraints, audit fields, and foreign key constraints for data integrity
- **Current Status**: Application fully functional with memory storage; database migration pending resolution of PostgreSQL connection issues

## Authentication & Authorization
- **System**: Username/password authentication with bcryptjs hashing.
- **Session Management**: Express sessions with PostgreSQL session store.
- **Onboarding**: Comprehensive onboarding flow collecting shop details (admin name, shop name, WhatsApp business number, industry type) for personalized user experience.

## External Integrations & Feature Specifications
- **WhatsApp Integration**: Automated e-coupon delivery and notifications via WhatsApp for new customers, points earned, and redemptions.
- **POS Integration**: Comprehensive system supporting Square, Shopify, and custom APIs for automatic customer sync, referral code generation, and real-time webhook support for instant customer creation from POS transactions.
- **E-Coupon System**: Simple e-coupon cards using the referral code as the coupon code, with personalized UI for sharing.

## Architecture Patterns
- **Monorepo Structure**: Shared schema and types between frontend and backend.
- **Component-Based UI**: Modular React components.
- **Service Layer**: Abstracted storage interface.
- **Error Handling**: Centralized error management.

# External Dependencies

## Core Services
- **Neon Database**: Serverless PostgreSQL database hosting.
- **Interakt**: WhatsApp Business API service.

## Development & Deployment
- **Replit**: Cloud development environment.
- **Vite**: Frontend build tool.
- **Node.js**: Server runtime environment.

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework.
- **Radix UI**: Headless component primitives.
- **Lucide React**: Icon library.

## Data & State Management
- **Drizzle Kit**: Database migration and schema management.
- **TanStack Query**: Server state management and caching.
- **Zod**: Runtime schema validation.

## Form & Interaction
- **React Hook Form**: Form state management.
- **Date-fns**: Date manipulation.
- **Wouter**: Lightweight React routing.