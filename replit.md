# Overview

Fruitbox is a comprehensive referral marketing management system built as a full-stack web application. It provides businesses with tools to create and manage referral campaigns, track customer engagement, distribute coupon codes, and communicate with customers via automated WhatsApp messaging. The platform features a modern dashboard interface for monitoring campaign performance, customer management, and analytics reporting.

## Recent Changes (January 2025)

Successfully migrated from SMS to Interakt WhatsApp integration:
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
- **Database**: PostgreSQL configured for production deployment
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Management**: Centralized schema definitions in TypeScript with automatic validation
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment

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