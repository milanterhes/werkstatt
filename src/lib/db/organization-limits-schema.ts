import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth-schema";

/**
 * Organization limits table - stores resource limits for each organization
 * Limits are enforced when creating resources (vehicles, fleets, etc.)
 */
export const organizationLimits = pgTable("organization_limits", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Resource Limits
  maxVehicles: integer("max_vehicles").default(100).notNull(),
  maxFleets: integer("max_fleets").default(50).notNull(),
  maxCustomers: integer("max_customers").default(200).notNull(),
  maxMonthlyInvoices: integer("max_monthly_invoices"), // Nullable for future use

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

