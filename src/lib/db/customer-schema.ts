import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth-schema";

/**
 * Customers table - stores customer contact details
 */
export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Contact Information
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),

  // Address Information
  street: text("street"),
  houseNumber: text("house_number"),
  postalCode: text("postal_code"),
  city: text("city"),
  country: text("country").default("Deutschland"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Fleets table - stores fleet information
 */
export const fleets = pgTable("fleets", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  customerId: text("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),

  // Fleet Information
  name: text("name").notNull(),
  description: text("description"),
  notes: text("notes"),
  fleetManagerContact: text("fleet_manager_contact"),
  defaultSettings: jsonb("default_settings"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Vehicles table - stores vehicle information
 */
export const vehicles = pgTable("vehicles", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  customerId: text("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  fleetId: text("fleet_id").references(() => fleets.id, {
    onDelete: "set null",
  }),

  // Vehicle Information
  licensePlate: text("license_plate"),
  vin: text("vin"), // Vehicle Identification Number
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  mileage: integer("mileage"),
  color: text("color"),
  fuelType: text("fuel_type"),
  engineInfo: text("engine_info"),
  registrationDate: timestamp("registration_date"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
