# BountyBay Platform Documentation

## Platform Overview

**BountyBay** is a marketplace platform that connects bounty posters with bounty hunters for various tasks and services. Users can post bounties (tasks with monetary rewards) and others can claim and complete them for payment.

### Core Concept
- **Bounty Posters**: Users who need tasks completed and offer monetary rewards
- **Bounty Hunters**: Users who complete tasks to earn rewards  
- **Escrow System**: Secure payment holding until task completion
- **Rating System**: Mutual rating system for trust and reputation

## Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for styling with custom design system
- **shadcn/ui** components for consistent UI
- **React Router** for navigation
- **React Query (@tanstack/react-query)** for data fetching and caching
- **React Hook Form** with Zod validation

### Backend & Database
- **Supabase** as Backend-as-a-Service
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions
  - Edge Functions for server-side logic
  - File storage with secure buckets
  - Built-in authentication

### Key APIs & Integrations

#### 1. **Supabase (Primary Backend)**
- **URL**: `https://lenyuvobgktgdearflim.supabase.co`
- **Purpose**: Database, authentication, storage, edge functions
- **Key Features**: 
  - Row Level Security policies for data protection
  - Real-time data synchronization
  - Automated user profile creation via triggers

#### 2. **Stripe (Payment Processing)**
- **Purpose**: Escrow payments, KYC verification
- **Integration**: Server-side processing via Supabase Edge Functions
- **Features**:
  - Identity verification sessions
  - Payment intents for escrow
  - Secure payment processing

#### 3. **Mapbox (Location Services)**
- **Purpose**: Location autocomplete and geocoding
- **Integration**: Client-side with token management via edge function
- **Features**:
  - Address suggestions
  - Coordinate resolution
  - Location-based search

#### 4. **Resend (Email Services)**
- **Purpose**: Transactional email notifications
- **Integration**: Server-side via edge functions
- **Features**:
  - Welcome emails
  - Bounty notifications
  - Submission alerts

#### 5. **OpenAI (Content Moderation)**
- **Purpose**: Automated content filtering
- **Integration**: Server-side content analysis
- **Features**:
  - Inappropriate content detection
  - Automated moderation decisions

## Database Structure

### Core Tables

#### **Bounties**
- Stores all bounty listings
- Fields: title, description, amount, deadline, location, status, category
- RLS: Open bounties viewable by all, own bounties manageable by poster

#### **Profiles** 
- Extended user information beyond Supabase auth
- Fields: username, bio, avatar, ratings, reputation, KYC status
- RLS: Public data viewable by all, private data only by owner

#### **Submissions**
- Bounty completion claims/submissions
- Fields: hunter_id, bounty_id, message, proof_urls, status
- RLS: Visible to hunter and bounty poster only

#### **Messages**
- Direct messaging between users
- Fields: sender_id, recipient_id, bounty_id, content
- RLS: Only participants can view conversation

#### **User_Ratings**
- Mutual rating system
- Fields: rater_id, rated_user_id, rating, review_text, bounty_id
- RLS: Public ratings, private rating submission

#### **Support_Tickets & Support_Messages**
- Customer support system
- RLS: Users see own tickets, admins see all

#### **User_Reports**
- User reporting system for misconduct
- RLS: Reporters see own reports, admins see all

#### **Escrow_Transactions**
- Payment escrow management
- Fields: bounty_id, amount, stripe_payment_intent_id, status
- RLS: Only transaction owner can view

#### **KYC_Verifications**
- Identity verification tracking
- Fields: user_id, status, stripe_verification_session_id
- RLS: Users see own verification, system manages updates

## Authentication System

### Supabase Auth Integration
- **Email/Password authentication**
- **Google OAuth** (configured but requires setup)
- **Automatic profile creation** via database triggers
- **Session persistence** with localStorage
- **Protected routes** with auth context

### User Roles & Permissions
- **Regular Users**: Can post bounties, submit claims, message others
- **Support Admins**: Can manage support tickets and user reports
- **System**: Automated processes via service role

## Payment & Escrow System

### Stripe Integration
1. **Escrow Creation**: Money held when bounty posted
2. **KYC Verification**: Required for large transactions
3. **Payment Release**: Triggered when bounty completed
4. **Platform Fees**: Calculated and collected automatically

### Security Features
- **Row Level Security**: Database-level access control
- **JWT Verification**: Secure API access
- **Service Role**: Elevated permissions for system operations
- **Escrow Protection**: Funds secured until completion

## Key Features & User Flows

### 1. Bounty Posting Flow
1. User authentication required
2. KYC verification for amounts >$500
3. Escrow payment via Stripe
4. Bounty published after payment confirmation
5. Email notifications sent

### 2. Bounty Discovery & Claiming
1. Browse/search bounties by location, category, amount
2. View bounty details and poster profile
3. Submit claim with proof/message
4. Real-time messaging with poster
5. Status updates and notifications

### 3. Completion & Rating
1. Poster reviews submissions
2. Accept/reject with feedback
3. Automatic escrow release on acceptance
4. Mutual rating system
5. Reputation score updates

### 4. Support System
1. Ticket creation for issues
2. Real-time chat with support
3. Admin dashboard for ticket management
4. User reporting system
5. Automated responses

## Admin Capabilities

### Support Admin Dashboard
- **View all support tickets** with full context
- **Respond to tickets** with file attachments
- **Update ticket status** and priority
- **View user reports** and take action
- **Access user profiles** and activity history

### Content Moderation
- **Automated screening** via OpenAI integration
- **Manual review** capabilities
- **User suspension** system
- **Report management**

## File Storage & Media

### Supabase Storage Buckets
- **avatars**: Public user profile images
- **bounty-images**: Public bounty attachments
- **submission-files**: Private proof files
- **documents**: Private document storage

### Security Policies
- **User-specific access**: Files organized by user ID
- **Public/Private buckets**: Based on content sensitivity
- **RLS on storage**: Row-level security for file access

## Edge Functions (Server-side Logic)

### Key Functions
1. **create-escrow-payment**: Stripe payment processing
2. **confirm-escrow-and-create-bounty**: Payment confirmation & bounty creation
3. **create-kyc-verification**: Identity verification setup
4. **check-kyc-status**: Verification status updates
5. **send-notification-email**: Email notifications
6. **moderate-content**: Content filtering
7. **get-mapbox-token**: Secure token management

## Environment Configuration

### Supabase Secrets
- `STRIPE_SECRET_KEY`: Payment processing
- `RESEND_API_KEY`: Email services  
- `OPENAI_API_KEY`: Content moderation
- `MAPBOX_PUBLIC_TOKEN`: Location services
- `SUPABASE_SERVICE_ROLE_KEY`: Elevated database access

### Project Configuration
- **Project ID**: `lenyuvobgktgdearflim`
- **Region**: Auto-assigned by Supabase
- **Database**: PostgreSQL with extensions
- **Real-time**: Enabled for live updates

## Security Measures

### Data Protection
- **Row Level Security** on all tables
- **JWT token verification** for API access
- **Encrypted secrets** via Supabase vault
- **HTTPS everywhere** for data transmission

### Business Logic Security
- **Reputation system** prevents spam/abuse
- **Claim limits** based on user reputation
- **Escrow protection** for financial transactions
- **Content moderation** for inappropriate material

## Mobile & Responsive Design

### Design System
- **Tailwind CSS** with custom HSL color tokens
- **Mobile-first** responsive breakpoints
- **Component variants** for different screen sizes
- **Touch-optimized** interactions

### Performance Optimizations
- **React Query caching** for API responses
- **Image optimization** via Supabase storage
- **Lazy loading** for components and routes
- **Debounced search** for better UX

## Development & Deployment

### Local Development
- **Vite dev server** with hot reload
- **Supabase CLI** for local edge function testing
- **TypeScript** for type safety
- **ESLint** for code quality

### Production Deployment
- **Lovable hosting** for frontend
- **Supabase cloud** for backend
- **Edge function auto-deployment**
- **Database migrations** via Supabase

## Business Model

### Revenue Streams
- **Platform fees** on completed bounties
- **Premium features** (future expansion)
- **Promoted listings** (future expansion)

### Key Metrics
- **Bounty completion rate**
- **User retention and engagement**
- **Average bounty values**
- **Platform fee collection**
- **User satisfaction ratings**

## Future Scalability

### Technical Scalability
- **Supabase auto-scaling** for database
- **Edge function distribution** globally
- **CDN integration** via Supabase
- **Real-time capabilities** for live features

### Feature Expansion
- **Mobile app development** (React Native compatible)
- **API marketplace** for third-party integrations
- **Advanced analytics** dashboard
- **Multi-language support**
- **Cryptocurrency payments**

---

## Quick Reference

### Important URLs
- **Live Platform**: [Your deployed URL]
- **Supabase Dashboard**: `https://supabase.com/dashboard/project/lenyuvobgktgdearflim`
- **Database**: `https://lenyuvobgktgdearflim.supabase.co`

### Key Contacts & Resources
- **Supabase Documentation**: https://supabase.com/docs
- **Stripe Documentation**: https://stripe.com/docs
- **React Documentation**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com

This documentation provides the complete technical overview for team members to understand BountyBay's architecture, functionality, and business model.