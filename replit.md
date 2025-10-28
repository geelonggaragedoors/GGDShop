# Geelong Garage Doors E-commerce Platform

## Overview
This is a full-stack e-commerce platform for Geelong Garage Doors, featuring a React frontend with TypeScript, Express.js backend, and PostgreSQL database. The application includes both customer-facing storefront and admin management capabilities, with PayPal integration for payments and advanced shipping calculations. It aims to be a comprehensive e-commerce parts supplier, focusing on shipping garage door parts.

## User Preferences
Preferred communication style: Simple, everyday language.
Email domain: Using geelonggaragedoors.com instead of .com.au
Deployment: Site deployed to geelonggaragedoors.com - needs NODE_ENV=production for correct password reset URLs
Email system: Using Resend for all transactional emails (password resets, order confirmations, shipping notifications) with API key stored securely in Replit Secrets
Font preferences: Quicksand medium 500 for "Geelong" in reddish color (#c53030), Raleway black 900 for "GARAGE DOORS" with white background
Payment system: PayPal-only checkout (handles both PayPal accounts and guest credit card payments)
Design preference: Blue-only color scheme throughout application
Business model: E-commerce parts supplier - sells garage door parts for shipping, does NOT provide installation services

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state, React Context for client state
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM
- **Authentication**: Hybrid system supporting both Replit Auth and password-based auth
- **File Upload**: UploadThing
- **API Design**: RESTful APIs with TypeScript interfaces

### Key Features
- **Authentication System**: Dual Replit OAuth and password authentication, bcrypt hashing, rate limiting, PostgreSQL session storage, role-based access (Admin, Manager, Staff).
- **E-commerce Capabilities**: Product CRUD, order processing with status tracking, PayPal-only checkout, Australia Post API for real-time shipping, inventory management, smart checkout.
- **Admin Dashboard**: Responsive UI, CRUD operations for all entities, basic analytics, bulk operations.
- **SEO Implementation**: WordPress/WooCommerce compatible URL structures, 301 redirects, `sanitize_title()` function for slug generation, Schema.org structured data, XML sitemap generation, enhanced meta tags.
- **Email System**: Integration with Resend for all transactional emails.

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL hosting
- **UploadThing**: File upload and storage
- **PayPal SDK**: Payment processing
- **Australia Post API**: Shipping cost calculations
- **Resend**: Transactional email service

### Development Tools
- **Replit**: Development environment and hosting
- **Vite**: Fast build tool
- **TypeScript**: Type safety

### UI Libraries
- **Radix UI**: Unstyled, accessible UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library