import { jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organization } from "./auth-schema";
import { customers, vehicles } from "./customer-schema";

/**
 * Work Orders table - stores work order information with items (labor, parts, and other items)
 */
export const workOrders = pgTable("work_orders", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  customerId: text("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  vehicleId: text("vehicle_id").references(() => vehicles.id, {
    onDelete: "set null",
  }),

  // Work Order Information
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("draft").notNull(),
  notes: text("notes"),

  // Dates
  createdDate: timestamp("created_date"),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),

  // Items list stored as JSONB array (unified structure for labor, parts, and other items)
  // Structure: [{ type: "labor" | "part" | "other", description: string, quantity: number, unitType: string, unitPrice: number, totalPrice: number, notes?: string, partNumber?: string, buyPrice?: number, hours?: number, rate?: number }]
  items: jsonb("items").$type<
    Array<{
      type: "labor" | "part" | "other";
      description: string;
      quantity: number;
      unitType: string;
      unitPrice: number;
      totalPrice: number;
      notes?: string;
      // For parts
      partNumber?: string;
      buyPrice?: number;
      // For labor
      hours?: number;
      rate?: number;
    }>
  >().default(sql`'[]'::jsonb`).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
