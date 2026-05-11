# System Documentation - LuloyXpress

LuloyXpress is a modern, full-stack e-commerce marketplace built with Next.js, featuring real-time updates, secure wallet-based transactions, and advanced authentication.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Radix UI (Base UI)
- **Database:** Aiven MySQL (Relational storage with transactional integrity)
- **Authentication:** NextAuth.js v5 + Face 2FA (Luface integration)
- **Real-time:** Ably (Presence, Cart updates, Wallet notifications, Chat)
- **Storage:** Cloudinary (Product images)

## Core Architecture

### 1. Server Actions (`lib/actions.ts`)
Most business logic resides in Server Actions. This handles:
- User registration and authentication flows.
- Product CRUD (Create, Read, Update, Delete) with tier-based limits.
- Atomic checkout transactions using MySQL `beginTransaction`, `commit`, and `rollback`.
- Wallet management (deposits and balance updates).

### 2. Real-time Engine (`lib/ably.ts`)
Powered by Ably, the system provides a "live" feel:
- **Cart Sync:** Adding an item on one tab updates the cart count on all others.
- **Wallet Sync:** Sales or deposits reflect instantly in the UI without refresh.
- **Messaging:** Real-time chat between buyers and sellers with low latency.

### 3. Authentication & Security
- **NextAuth:** Secure session management.
- **Face 2FA:** A custom integration with Luface. Users can enable biometrics for an extra layer of security during login.
- **Transaction Auditing:** Every balance change is logged in the `transactions` table with a reference ID.

## Key Features

- **Standard vs. Pro Tiers:** Standard users are limited to 5 active listings, while Pro users (₱499/month) get unlimited listings and a verified badge.
- **Atomic Checkout:** Ensures that money is never lost or duplicated during purchase. Buyer's balance is deducted and seller's balance is credited in a single database transaction.
- **Digital Receipts:** Secure, printable receipts generated for every completed order with a unique tracking ID.
- **Smart Messaging:** Direct communication between users to negotiate or ask about products, limited to the 20 most recent messages per conversation to ensure performance.
- **Dual Review System:** Buyers can rate both the product and the seller, building trust in the community.

## Deployment & Infrastructure

- **Frontend/API:** Vercel (Next.js)
- **Database:** Aiven (Managed MySQL 8.0)
- **Media:** Cloudinary (CDN-optimized image delivery)
- **Real-time:** Ably (Global Pub/Sub network)
