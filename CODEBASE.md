# Codebase Structure

This document describes the directory structure and conventions used in Werkstatt Next, a comprehensive workshop management system for automotive repair shops.

## Overview

Werkstatt Next manages the complete lifecycle of a car mechanic shop, including customer management, vehicle tracking, work orders, invoicing, service intervals, and more. The codebase is organized to support these features and future expansions.

## Root Directory

```
werkstatt-next/
├── src/                    # Source code
├── drizzle/               # Database migrations
├── public/                # Static assets
├── .cursorrules           # Cursor AI context
├── ARCHITECTURE.md        # Architecture documentation
├── CODEBASE.md           # This file
├── README.md             # Project overview
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── next.config.ts        # Next.js configuration
├── drizzle.config.ts     # Drizzle configuration
└── tailwind.config.*     # Tailwind CSS configuration
```

## Source Directory (`src/`)

### App Directory (`src/app/`)

Next.js App Router pages and API routes:

```
app/
├── layout.tsx                    # Root layout
├── page.tsx                      # Home page
├── globals.css                   # Global styles
├── favicon.ico                   # Favicon
├── api/                          # API routes
│   ├── auth/[...all]/route.ts   # Better Auth catch-all route
│   └── trpc/[trpc]/route.ts     # tRPC API handler
├── sign-in/page.tsx             # Sign-in page
├── customers/page.tsx           # Customer list page
├── vehicles/page.tsx            # Vehicle list page
├── fleets/page.tsx              # Fleet list page
├── work-orders/page.tsx        # Work order list page
└── settings/page.tsx            # Settings page
```

**Conventions:**

- Use App Router conventions (page.tsx, layout.tsx)
- API routes in `app/api/`
- Pages are server components by default
- Use `"use client"` directive for client components

### Components Directory (`src/components/`)

React components organized by feature:

```
components/
├── ui/                          # shadcn/ui base components
│   ├── button.tsx
│   ├── form.tsx
│   ├── table.tsx
│   └── ...
├── app-sidebar.tsx             # Application sidebar
├── sidebar-wrapper.tsx         # Sidebar layout wrapper
├── providers.tsx               # React Query + tRPC providers
├── login-form.tsx              # Login form component
├── signup-form.tsx             # Sign-up form component
├── onboarding-flow.tsx         # Onboarding wizard
├── create-organization-form.tsx # Organization creation
├── customer-form.tsx           # Customer form component
├── customers-table.tsx         # Customer data table
├── vehicle-form.tsx            # Vehicle form component
├── vehicles-table.tsx          # Vehicle data table
├── fleet-form.tsx             # Fleet form component
├── fleets-table.tsx           # Fleet data table
├── work-order-form.tsx        # Work order form component
├── work-orders-table.tsx      # Work order data table
├── workshop-details-form.tsx   # Workshop settings form
├── settings.tsx                # Settings page component
└── home.tsx                    # Home page component
```

**Conventions:**

- Feature components: `*-form.tsx`, `*-table.tsx`
- UI components in `ui/` directory (shadcn/ui)
- Use PascalCase for component names
- Export default for page components, named exports for reusable components

### Library Directory (`src/lib/`)

Shared utilities and configurations:

```
lib/
├── db/
│   ├── index.ts               # Database exports
│   ├── auth-schema.ts         # Better Auth tables (generated)
│   ├── customer-schema.ts     # Customers, Vehicles, Fleets tables
│   ├── work-order-schema.ts   # Work Orders table
│   ├── workshop-schema.ts     # Workshop details table
│   └── schemas.ts             # Zod schemas (generated from Drizzle)
├── services/
│   ├── customer-service.ts    # Customer business logic
│   ├── vehicle-service.ts     # Vehicle business logic
│   ├── fleet-service.ts       # Fleet business logic
│   └── work-order-service.ts  # Work order business logic
├── auth.ts                    # Better Auth configuration
├── auth-client.ts             # Better Auth client setup
├── db.ts                      # Drizzle database instance
├── trpc.ts                    # tRPC client configuration
├── api-helpers.ts             # API helper functions
└── utils.ts                   # General utilities
```

**Conventions:**

- `db/` - Database schemas and types
- `services/` - Business logic layer (returns Result types)
- Configuration files at root level
- Utility functions in `utils.ts`

### Server Directory (`src/server/`)

Server-side code (tRPC routers and configuration):

```
server/
├── routers/
│   ├── customer.ts            # Customer tRPC router
│   ├── vehicle.ts             # Vehicle tRPC router
│   ├── fleet.ts               # Fleet tRPC router
│   ├── work-order.ts          # Work order tRPC router
│   └── workshop.ts            # Workshop tRPC router
└── trpc/
    ├── router.ts              # Main app router
    ├── trpc.ts                # tRPC initialization
    └── context.ts             # tRPC context creation
```

**Conventions:**

- One router file per domain entity
- Routers export a `*Router` constant
- Main router combines all sub-routers
- Context handles authentication and organization resolution

### Hooks Directory (`src/hooks/`)

Custom React hooks:

```
hooks/
└── use-mobile.ts              # Mobile detection hook
```

**Conventions:**

- Custom hooks prefixed with `use`
- One hook per file

## Database Migrations (`drizzle/`)

SQL migration files:

```
drizzle/
├── 0000_polite_mercury.sql
├── 0001_magenta_nightshade.sql
├── 0002_milky_vivisector.sql
├── 0003_rename_legal_form_to_company_name.sql
├── 0004_add_customers_vehicles_fleets.sql
└── meta/
    ├── _journal.json
    └── *.json                  # Migration snapshots
```

**Conventions:**

- Sequential numbered migrations
- Descriptive names
- Meta directory contains migration metadata

## File Naming Conventions

### TypeScript/React Files

- **Components**: PascalCase (`CustomerForm.tsx`)
- **Pages**: lowercase (`page.tsx`, `layout.tsx`)
- **Utilities**: camelCase (`api-helpers.ts`)
- **Types**: PascalCase in type definitions
- **Constants**: UPPER_SNAKE_CASE

### Database Files

- **Schemas**: kebab-case (`customer-schema.ts`)
- **Services**: kebab-case (`customer-service.ts`)
- **Routers**: kebab-case (`customer.ts`)

## Import Conventions

### Path Aliases

- `@/` - Maps to `src/`
- Use path aliases instead of relative paths

### Import Order

1. External dependencies
2. Internal imports (path aliases)
3. Relative imports
4. Type imports (with `type` keyword)

Example:

```typescript
import { Result, ok, err } from "neverthrow";
import { z } from "zod";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/customer-schema";
import type { Customer } from "@/lib/db/schemas";
```

## Component Patterns

### Form Components

```typescript
// Form component structure
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc";
import { customerFormSchema } from "@/lib/db/schemas";
import type { CustomerFormInput } from "@/lib/db/schemas";

export function CustomerForm() {
  const form = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
  });

  const mutation = trpc.customers.create.useMutation();

  // ... form implementation
}
```

### Table Components

```typescript
// Table component structure
"use client";

import { useReactTable } from "@tanstack/react-table";
import { trpc } from "@/lib/trpc";

export function CustomersTable() {
  const { data, isLoading } = trpc.customers.list.useQuery();

  const table = useReactTable({
    data: data ?? [],
    // ... table configuration
  });

  // ... table rendering
}
```

### Service Functions

```typescript
// Service function pattern
import { Result, ok, err } from "neverthrow";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/customer-schema";
import { eq } from "drizzle-orm";
import type { Customer } from "@/lib/db/schemas";

export async function getCustomers(
  organizationId: string
): Promise<Result<Customer[], Error>> {
  try {
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.organizationId, organizationId));

    return ok(result);
  } catch (error) {
    return err(error instanceof Error ? error : new Error("Failed to fetch"));
  }
}
```

### Router Procedures

```typescript
// Router procedure pattern
import { protectedProcedure, router } from "../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { getCustomers } from "@/lib/services/customer-service";

export const customerRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await getCustomers(ctx.activeOrganizationId);
    return result.match(
      (data) => data,
      (error) => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    );
  }),
});
```

## Common Patterns

### Adding a New Feature

1. **Database Schema** (`src/lib/db/*-schema.ts`)
   - Define Drizzle table
   - Add relationships
   - Include `organizationId` and timestamps

2. **Zod Schemas** (`src/lib/db/schemas.ts`)
   - Auto-generated via drizzle-zod
   - Add form schema variations

3. **Service Layer** (`src/lib/services/*-service.ts`)
   - Create CRUD functions
   - Return Result types
   - Filter by organizationId

4. **tRPC Router** (`src/server/routers/*.ts`)
   - Create router with procedures
   - Convert Result to tRPC errors
   - Use protectedProcedure

5. **Add to Main Router** (`src/server/trpc/router.ts`)
   - Import router
   - Add to appRouter

6. **Components** (`src/components/`)
   - Create form component
   - Create table component
   - Use tRPC hooks

7. **Page** (`src/app/*/page.tsx`)
   - Create page component
   - Integrate form and table

## Configuration Files

- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `drizzle.config.ts` - Drizzle ORM configuration
- `tailwind.config.*` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration
- `eslint.config.mjs` - ESLint configuration

## Testing Structure

(Not yet implemented, but recommended structure)

```
__tests__/
├── services/
├── routers/
└── components/
```

As the system grows to include additional features, the following structure is planned:

```
app/
├── invoices/             # Invoice management pages
├── appointments/         # Appointment scheduling pages
└── reports/              # Reporting and analytics pages

components/
├── invoice-form.tsx
├── invoices-table.tsx
├── appointment-calendar.tsx
└── ...

lib/
├── db/
│   ├── invoice-schema.ts
│   ├── service-interval-schema.ts
│   └── parts-schema.ts
├── services/
│   ├── invoice-service.ts
│   ├── service-interval-service.ts
│   └── parts-service.ts

server/
└── routers/
    ├── invoice.ts
    ├── service-interval.ts
    └── parts.ts
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details on planned features.

## Documentation Files

- `README.md` - Project overview and setup
- `ARCHITECTURE.md` - Technical architecture
- `CODEBASE.md` - This file (structure and conventions)
- `.cursorrules` - Cursor AI context
