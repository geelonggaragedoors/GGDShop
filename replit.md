# Geelong Garage Doors E-commerce Platform

## Overview

This is a full-stack e-commerce platform built for Geelong Garage Doors, featuring a React frontend with TypeScript, Express.js backend, and PostgreSQL database. The application includes both customer-facing storefront and admin management capabilities, with PayPal integration for payments and advanced shipping calculations using Australia Post APIs.

## User Preferences

Preferred communication style: Simple, everyday language.
Email domain: Using geelonggaragedoors.com (verified in Resend) instead of .com.au

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state, React Context for client state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Hybrid system supporting both Replit Auth and password-based auth
- **File Upload**: UploadThing for image and file management
- **API Design**: RESTful APIs with TypeScript interfaces

### Key Components

#### Authentication System
- **Dual Auth Support**: Both Replit OAuth and traditional password authentication
- **Security Features**: bcrypt password hashing, rate limiting, account lockout
- **Session Management**: PostgreSQL session storage with configurable TTL
- **Role-Based Access**: Admin, manager, and staff roles with different permissions

#### E-commerce Features
- **Product Management**: Full CRUD operations with categories, brands, and media
- **Order Processing**: Complete order lifecycle with status tracking
- **Payment Integration**: PayPal SDK for secure payment processing
- **Shipping Calculations**: Australia Post API integration for real-time shipping costs
- **Inventory Management**: Stock tracking and low stock alerts

#### Admin Dashboard
- **User Interface**: Responsive admin panel with sidebar navigation
- **Data Management**: CRUD operations for all entities with search/filter/sort
- **Analytics**: Basic reporting and dashboard metrics
- **Bulk Operations**: Mass edit/delete capabilities for products and orders

## Data Flow

### Request Processing
1. Client requests hit Express middleware stack
2. Authentication middleware validates user sessions
3. Route handlers process business logic
4. Database queries executed via Drizzle ORM
5. Responses formatted and sent back to client

### Real-time Updates
- WebSocket connections for notifications
- Real-time order status updates
- Live inventory updates for admin users

### File Upload Process
1. Client uploads files via UploadThing widget
2. Files processed and stored in cloud storage
3. Database updated with file metadata
4. URLs returned for immediate use

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL hosting with serverless scaling
- **UploadThing**: File upload and storage service
- **PayPal SDK**: Payment processing integration
- **Australia Post API**: Shipping cost calculations

### Development Tools
- **Replit**: Development environment and hosting
- **Vite**: Fast build tool with HMR support
- **TypeScript**: Type safety across the entire stack

### UI Libraries
- **Radix UI**: Unstyled, accessible UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

## Deployment Strategy

### Development Environment
- **Platform**: Replit with auto-scaling
- **Database**: Neon PostgreSQL with connection pooling
- **Build Process**: Vite handles frontend bundling, esbuild for backend

### Production Considerations
- **Environment Variables**: All sensitive data stored in environment variables
- **Database Migrations**: Drizzle Kit for schema management
- **Static Assets**: Served via Express with proper caching headers
- **Error Handling**: Comprehensive error boundaries and logging

### Configuration Management
- **Database**: Drizzle config with PostgreSQL dialect
- **TypeScript**: Shared types between frontend and backend
- **Build**: Separate build commands for development and production

The architecture emphasizes type safety, performance, and maintainability while providing a solid foundation for e-commerce operations. The hybrid authentication system allows for flexible deployment options, and the modular design enables easy feature additions and modifications.