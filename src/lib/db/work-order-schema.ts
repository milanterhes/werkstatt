import { jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth-schema";
import { customers, vehicles } from "./customer-schema";

/**
 * Work Orders table - stores work order information with parts lists
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

  // Labor Information
  laborCosts: real("labor_costs"),
  laborHours: real("labor_hours"),

  // Parts list stored as JSONB array
  // Structure: [{ partNumber: string, buyPrice: number, customerPrice: number }]
  parts: jsonb("parts").$type<
    Array<{
      partNumber: string;
      buyPrice: number;
      customerPrice: number;
    }>
  >(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
