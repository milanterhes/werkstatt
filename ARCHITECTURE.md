# Architecture Documentation

This document describes the technical architecture, design decisions, and patterns used in Werkstatt Next.

## System Overview

Werkstatt Next is a full-stack TypeScript application built with Next.js App Router, providing a comprehensive multi-tenant workshop management system for automotive repair shops. The system is designed to manage the complete lifecycle of a car mechanic shop, from customer and vehicle management through work order tracking, service scheduling, invoicing, and payment processing.

The architecture follows a layered approach with clear separation between data access, business logic, API, and presentation layers. This design allows for scalability and maintainability as the system grows to include additional features like work orders, invoicing, service intervals, and reporting.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (React Components + Pages)         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           API Layer                      │
│      (tRPC Routers + Procedures)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        Service Layer                     │
│   (Business Logic + Error Handling)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        Data Access Layer                 │
│      (Drizzle ORM + PostgreSQL)         │
└─────────────────────────────────────────┘
```

## Technology Stack Details

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TanStack Query** - Server state management
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Radix UI** - Headless UI components
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library

### Backend

- **Next.js API Routes** - Server endpoints
- **tRPC** - Type-safe API layer
- **SuperJSON** - Date/Map/Set serialization
- **Better Auth** - Authentication and authorization
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Database

### Patterns

- **Neverthrow** - Functional error handling with Result types
- **drizzle-zod** - Schema generation from database tables

## Authentication & Authorization

### Better Auth Integration

The application uses Better Auth with the organization plugin for multi-tenant support:

- **Authentication**: Email/password authentication
- **Sessions**: Server-side session management
- **Organizations**: Multi-tenant support via Better Auth organization plugin
- **Active Organization**: Each session has an active organization context

### Authentication Flow

```
1. User signs in → Better Auth creates session
2. Session includes userId and optionally activeOrganizationId
3. On API request:
   a. Context middleware extracts session from headers
   b. Ensures user is authenticated
   c. Resolves active organization (auto-selects if user has only one)
   d. Makes organizationId available in all procedures
```

### Context Creation

The tRPC context (`src/server/trpc/context.ts`) ensures:
- User is authenticated
- Active organization is resolved
- `userId`, `sessionId`, and `activeOrganizationId` are available in all procedures

## API Layer (tRPC)

### Structure

tRPC provides end-to-end type safety:

```
App Router
  └─ appRouter (root)
      ├─ customers (customerRouter)
      ├─ vehicles (vehicleRouter)
      ├─ fleets (fleetRouter)
      ├─ workOrders (workOrderRouter)
      └─ workshop (workshopRouter)
```

### Router Pattern

Each router (`src/server/routers/*.ts`) follows this pattern:

```typescript
export const customerRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => { ... }),
  getById: protectedProcedure.input(...).query(async ({ ctx, input }) => { ... }),
  create: protectedProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
  update: protectedProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
  delete: protectedProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
});
```

### Procedures

- **protectedProcedure**: Requires authentication and active organization
- Uses `superjson` transformer for Date/Map/Set serialization
- All procedures receive `ctx` with `userId`, `sessionId`, and `activeOrganizationId`

### Error Handling

tRPC procedures convert Neverthrow Result types to tRPC errors:
- `NOT_FOUND` (404) for "not found" errors
- `INTERNAL_SERVER_ERROR` (500) for other errors
- `UNAUTHORIZED` (401) handled in context creation

## Service Layer

### Pattern

Services (`src/lib/services/*.ts`) contain business logic and use Neverthrow Result types:

```typescript
export async function getCustomers(
  organizationId: string
): Promise<Result<Customer[], Error>>
```

### Benefits

- Explicit error handling
- Type-safe error propagation
- Easy to test
- No thrown exceptions (functional approach)

### Service Functions

Each service typically provides:
- `get*` - List/fetch operations
- `get*ById` - Single item fetch
- `create*` - Create operations
- `update*` - Update operations
- `delete*` - Delete operations

### Data Cleaning

Services clean form data:
- Empty strings converted to `null` for optional fields
- `organizationId` always injected from context
- Timestamps managed automatically

## Database Layer

### Schema Structure

Database schemas are organized by domain:

- `src/lib/db/auth-schema.ts` - Better Auth tables (auto-generated)
- `src/lib/db/customer-schema.ts` - Customers, Vehicles, Fleets
- `src/lib/db/work-order-schema.ts` - Work Orders
- `src/lib/db/workshop-schema.ts` - Workshop details

### Relationships

```
Organization (Better Auth)
  ├─ Customers (1:N)
  │   ├─ Vehicles (1:N)
  │   └─ Fleets (1:N)
  │       └─ Vehicles (1:N)
  ├─ Work Orders (1:N)
  │   ├─ Customer (N:1, optional)
  │   └─ Vehicle (N:1, optional)
  └─ Workshop Details (1:1)
```

### Schema Generation

- Zod schemas generated from Drizzle tables using `drizzle-zod`
- Form schemas derived from insert schemas with:
  - Auto-generated fields omitted (id, organizationId, timestamps)
  - Custom validation added (email format, URL format)
  - Type transformations (date strings)

### Multi-tenancy

All tables include `organizationId`:
- Foreign key to `organization.id`
- Cascade delete on organization removal
- Filtered in all queries via context

## Frontend Architecture

### Component Structure

```
components/
├── ui/              # shadcn/ui base components
├── *-form.tsx       # Form components (React Hook Form)
├── *-table.tsx      # Data table components (TanStack Table)
└── *.tsx            # Feature components
```

### Form Pattern

Forms use React Hook Form with Zod validation:

```typescript
const form = useForm<CustomerFormInput>({
  resolver: zodResolver(customerFormSchema),
  defaultValues: { ... },
});

const mutation = trpc.customers.create.useMutation();
```

### Data Fetching

- tRPC hooks (`useQuery`, `useMutation`) via TanStack Query
- Automatic type inference from server
- Optimistic updates where appropriate
- Error handling via React Query error states

### State Management

- **Server State**: TanStack Query (via tRPC)
- **Form State**: React Hook Form
- **UI State**: React useState/useReducer
- **URL State**: nuqs (for search params)

## Data Flow

### Read Flow

```
1. Component calls trpc.customers.list.useQuery()
2. TanStack Query requests via tRPC client
3. tRPC client → API route → tRPC server
4. Context middleware authenticates & resolves org
5. Router calls service function
6. Service queries database via Drizzle
7. Result returned → tRPC → React Query → Component
```

### Write Flow

```
1. Form submission → React Hook Form
2. Validation via Zod schema
3. Component calls trpc.customers.create.useMutation()
4. Same server flow as read
5. Service uses Neverthrow Result
6. Router converts Result to tRPC response
7. React Query updates cache
8. UI updates optimistically
```

## Error Handling Strategy

### Service Layer

- All services return `Result<T, Error>` from Neverthrow
- Explicit error types (no thrown exceptions)
- Error messages descriptive and user-friendly

### API Layer

- tRPC procedures convert Result to tRPC errors
- Appropriate HTTP status codes
- Error messages propagated to client

### Frontend

- React Query handles error states
- Form validation errors shown inline
- Toast notifications for mutations (via Sonner)

## Type Safety

### End-to-End Type Safety

1. **Database**: Drizzle schemas define table types
2. **Schemas**: Zod schemas generated from Drizzle
3. **Services**: TypeScript types inferred from Drizzle
4. **API**: tRPC infers types from routers
5. **Frontend**: Types inferred from tRPC client

### Type Flow

```
Drizzle Schema → Zod Schema → Service Types → tRPC Types → Client Types
```

## Database Migrations

- Migrations in `drizzle/` directory
- Generated via `drizzle-kit generate`
- Applied via `drizzle-kit migrate`
- Version controlled with descriptive names

## Environment Variables

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret key
- `BETTER_AUTH_URL` - Application URL (for auth callbacks)

Optional:
- `PORT` - Server port (default: 3000)
- `VERCEL_URL` - Vercel deployment URL

## Security Considerations

- All API routes require authentication via context
- Organization isolation enforced at database level
- SQL injection prevented via Drizzle ORM parameterization
- CSRF protection via SameSite cookies
- XSS prevention via React's automatic escaping

## Performance Considerations

- tRPC batching for multiple requests
- React Query caching and stale-while-revalidate
- Database indexes on foreign keys and organizationId
- Server-side rendering where beneficial
- Client-side navigation for SPA-like experience

## Work Orders

### Implementation

Work orders are fully implemented and include:

- **Core Features**
  - Create, read, update, and delete work orders
  - Status tracking (draft, in-progress, completed, cancelled)
  - Optional customer and vehicle assignment
  - Title, description, and notes fields
  - Date tracking (created, due, completed)
  - Labor costs and hours tracking

- **Parts Management**
  - JSONB array storage for parts list
  - Each part includes: part number, buy price, customer price
  - Dynamic add/remove functionality in forms
  - Parts totals calculation (buy price and customer price)

- **Database Schema**
  - `work_orders` table with all fields
  - Foreign keys to customers and vehicles (optional, set null on delete)
  - Organization-scoped with cascade delete
  - JSONB column for parts array

- **Service Layer**
  - Full CRUD operations with Result types
  - Date string to Date object conversion
  - Empty string to null conversion for optional fields

- **API Layer**
  - tRPC router with list, getById, create, update, delete procedures
  - Date string handling in form inputs
  - Proper error handling and type safety

- **Frontend**
  - Work order form with all fields
  - Parts management UI with add/remove functionality
  - Customer and vehicle selects (vehicle filters by customer)
  - Work orders table with status badges
  - Full CRUD interface with edit/delete actions

### Core Features (Planned)

- **Invoicing System**
  - Generate invoices from work orders
  - Line items for labor and parts
  - Payment tracking and status
  - Multiple payment methods
  - Invoice templates and customization
  - Automatic numbering based on workshop settings

- **Service Interval Tracking**
  - Vehicle service history
  - Scheduled maintenance reminders
  - Service interval templates (oil change, tire rotation, etc.)
  - Automatic notifications based on mileage/time
  - Service recommendations

- **Parts Inventory**
  - Parts and supplies management
  - Stock tracking
  - Supplier management
  - Reorder points and alerts
  - Parts assignment to work orders

- **Appointments & Scheduling**
  - Service appointment scheduling
  - Calendar integration
  - Technician availability
  - Customer notifications
  - Recurring appointments

### Additional Features

- **Reporting and Analytics**
  - Revenue reports
  - Service statistics
  - Customer insights
  - Technician performance
  - Inventory reports

- **Document Management**
  - Vehicle images
  - Document attachments (invoices, receipts, etc.)
  - File storage integration

- **Email Notifications**
  - Service reminders
  - Invoice notifications
  - Appointment confirmations
  - Work order updates

- **Export Functionality**
  - CSV exports for reports
  - PDF generation for invoices
  - Data backup and export

- **Advanced Search and Filtering**
  - Global search across entities
  - Advanced filters for work orders
  - Saved filter presets

- **Audit Logging**
  - Track all changes
  - User activity logs
  - Compliance reporting

