# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RideLikeAPro is a Next.js marketplace application for equestrians. It uses:
- **Next.js 15** with App Router and Turbopack
- **Supabase** for authentication and database
- **Stripe** for payment processing and seller onboarding
- **Tailwind CSS** with shadcn/ui components

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture

### Authentication & Authorization
- **Primary auth**: Supabase Auth with session management in `context/AuthContext.tsx`
- **Middleware**: `middleware.ts` protects routes (`/dashboard`, `/profile`, `/wishlist`, `/api/protected`)
- **Client creation**: Use `utils/supabase/client.ts` for client-side, `utils/supabase/server.ts` for server-side

### State Management
- **AuthContext**: Global authentication state (`context/AuthContext.tsx`)
- **WishlistContext**: Wishlist functionality (`context/WishlistContext.tsx`)
- **Providers**: Combined in `components/providers.tsx`

### Payment Integration
- **Stripe**: Payment processing and Connect for seller onboarding
- **API routes**: `/api/stripe/` for account creation, checkout sessions, and account sessions
- **Hook**: `hooks/useStripeConnect.ts` for Connect integration

### Key App Routes
- `/dashboard` - User dashboard
- `/create_listing` - Create new listing
- `/listings/[id]` - View listing details
- `/listings/[id]/edit` - Edit listing
- `/seller/[id]` - Seller profile
- `/seller_onboarding` - Stripe Connect onboarding
- `/account_management` - Account settings
- `/wishlist` - User wishlist

### UI Components
- **shadcn/ui**: Base UI components in `components/ui/`
- **Custom components**: `ListingCard`, `MegaMenu`, `MobileMegaMenu`
- **Animations**: Framer Motion for enhanced UX

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY
```

## Testing & Code Quality

Run linting before commits:
```bash
npm run lint
```

TypeScript configuration is in `tsconfig.json` with strict mode enabled.