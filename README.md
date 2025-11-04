# Werkstatt Next

A comprehensive workshop management system built with Next.js, designed to manage the complete lifecycle of a car mechanic shop including customers, vehicles, work orders, invoicing, service intervals, and more.

## Overview

Werkstatt Next is a full-stack application that helps automotive workshops manage their entire business operations. The system covers the complete workflow from customer and vehicle management, through work order tracking and service scheduling, to invoicing and payment processing. It's designed to streamline operations for automotive repair shops of all sizes.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **API**: tRPC (type-safe API layer)
- **Authentication**: Better Auth (with organization support)
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod validation
- **Data Transformation**: SuperJSON
- **Error Handling**: Neverthrow (Result types)

## Features

### Currently Implemented

- 🔐 Multi-tenant authentication with organization support
- 👥 Customer management
- 🚗 Vehicle tracking and management
- 🚛 Fleet management
- 📋 Work order tracking and management
- 🏢 Workshop details and configuration
- 📱 Responsive UI with modern design
- 🔒 Type-safe API calls with tRPC
- ✅ Form validation with Zod schemas

### Planned Features

- 💰 Invoicing and payment processing
- 🔧 Service interval tracking and reminders
- 📊 Reporting and analytics
- 📄 Document management
- 📧 Email notifications
- 🔍 Advanced search and filtering
- 📤 Export functionality (CSV, PDF)

## Prerequisites

- Node.js 18+ (or pnpm)
- PostgreSQL database
- pnpm (recommended) or npm

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd werkstatt-next
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/werkstatt_db
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
```

### 4. Set up the database

Run database migrations:

```bash
pnpm drizzle-kit migrate
```

Or manually run the SQL files from the `drizzle/` directory.

### 5. Generate Better Auth schema (if needed)

```bash
npx @better-auth/cli@latest generate --output ./src/lib/db/auth-schema.ts
```

### 6. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
werkstatt-next/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes (tRPC, auth)
│   │   ├── customers/         # Customer management pages
│   │   ├── vehicles/          # Vehicle management pages
│   │   ├── fleets/            # Fleet management pages
│   │   ├── work-orders/       # Work order management pages
│   │   └── settings/          # Settings page
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   └── *.tsx              # Feature components
│   ├── lib/                   # Shared utilities
│   │   ├── db/                # Database schemas and types
│   │   ├── services/          # Business logic layer
│   │   ├── auth.ts            # Better Auth configuration
│   │   ├── db.ts              # Drizzle database instance
│   │   └── trpc.ts            # tRPC client setup
│   └── server/                # Server-side code
│       ├── routers/           # tRPC routers
│       └── trpc/              # tRPC configuration
├── drizzle/                   # Database migrations
└── public/                    # Static assets
```

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking

## Database Schema

The application uses the following main entities:

### Core Entities (Implemented)

- **Organization** - Multi-tenant organization (via Better Auth)
- **User** - Authentication users (via Better Auth)
- **Customer** - Customer contact and address information
- **Vehicle** - Vehicle details (license plate, VIN, make, model, etc.)
- **Fleet** - Fleet/group of vehicles
- **Work Order** - Service requests and repair orders with parts tracking
- **Workshop Details** - Workshop/company configuration and invoicing settings

### Planned Entities

- **Invoices** - Billing and payment tracking
- **Service Intervals** - Scheduled maintenance and reminders
- **Parts Inventory** - Parts and supplies management
- **Labor Rates** - Service pricing and billing
- **Appointments** - Service scheduling

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed schema information.

## Authentication

The app uses Better Auth with:

- Email/password authentication
- Organization-based multi-tenancy
- Session management
- Active organization resolution

## API

The application uses tRPC for type-safe API calls. All API routes are defined in `src/server/routers/` and can be accessed via the tRPC client:

```typescript
const { data } = trpc.customers.list.useQuery();
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for API structure details.

## Development

### Code Patterns

- **Service Layer**: Business logic in `src/lib/services/` using Neverthrow Result types
- **Forms**: React Hook Form with Zod schemas from `src/lib/db/schemas.ts`
- **Error Handling**: Result types from Neverthrow library
- **Type Safety**: Full TypeScript with inferred types from Drizzle schemas

### Adding a New Feature

1. Create database schema in `src/lib/db/`
2. Generate Zod schemas (already automated via drizzle-zod)
3. Create service functions in `src/lib/services/`
4. Create tRPC router in `src/server/routers/`
5. Add to main router in `src/server/trpc/router.ts`
6. Create React components in `src/components/`
7. Create pages in `src/app/`

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture and design decisions
- [CODEBASE.md](./CODEBASE.md) - Directory structure and conventions

## License

Private project
