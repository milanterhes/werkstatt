/**
 * Zod schemas generated from Drizzle ORM tables using drizzle-zod
 * This file centralizes all schema definitions for type safety and validation
 */

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { customers, fleets, vehicles } from "./customer-schema";
import { workOrders } from "./work-order-schema";
import { workshopDetails } from "./workshop-schema";

// Customer schemas
export const customerSelectSchema = createSelectSchema(customers);
export const customerInsertSchema = createInsertSchema(customers);
export const customerUpdateSchema = createUpdateSchema(customers);

// Customer form schema (excludes generated fields, adds custom validation)
export const customerFormSchema = customerInsertSchema
  .omit({ id: true, organizationId: true, createdAt: true, updatedAt: true })
  .extend({
    email: z
      .string()
      .optional()
      .refine((val) => !val || z.string().email().safeParse(val).success, {
        message: "Invalid email address",
      }),
  });

export type Customer = typeof customers.$inferSelect;
export type CustomerInput = typeof customers.$inferInsert;
export type CustomerUpdate = typeof customers.$inferInsert;
export type CustomerFormInput = z.infer<typeof customerFormSchema>;

// Fleet schemas
export const fleetSelectSchema = createSelectSchema(fleets);
export const fleetInsertSchema = createInsertSchema(fleets);
export const fleetUpdateSchema = createUpdateSchema(fleets);

// Fleet form schema (excludes generated fields)
export const fleetFormSchema = fleetInsertSchema.omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  defaultSettings: true, // Exclude JSONB field from form
});

export type Fleet = typeof fleets.$inferSelect;
export type FleetInput = typeof fleets.$inferInsert;
export type FleetUpdate = typeof fleets.$inferInsert;
export type FleetFormInput = z.infer<typeof fleetFormSchema>;

// Vehicle schemas
export const vehicleSelectSchema = createSelectSchema(vehicles);
export const vehicleInsertSchema = createInsertSchema(vehicles);
export const vehicleUpdateSchema = createUpdateSchema(vehicles);

// Vehicle form schema (excludes generated fields, handles date strings)
export const vehicleFormSchema = vehicleInsertSchema
  .omit({
    id: true,
    organizationId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    year: z.number().optional().nullable(),
    mileage: z.number().optional().nullable(),
    registrationDate: z.string().optional().nullable(), // Accept string for date input
  });

export type Vehicle = typeof vehicles.$inferSelect;
export type VehicleInput = typeof vehicles.$inferInsert;
export type VehicleUpdate = typeof vehicles.$inferInsert;
export type VehicleFormInput = z.infer<typeof vehicleFormSchema>;

// Workshop details schemas
export const workshopDetailsSelectSchema = createSelectSchema(workshopDetails);
export const workshopDetailsInsertSchema = createInsertSchema(workshopDetails);
export const workshopDetailsUpdateSchema = createUpdateSchema(workshopDetails);

// Workshop details form schema (excludes generated fields, adds validation)
export const workshopDetailsFormSchema = workshopDetailsInsertSchema
  .omit({
    id: true,
    organizationId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial({
    paymentTermsDays: true,
    defaultCurrency: true,
    invoicePrefix: true,
  })
  .extend({
    email: z
      .string()
      .nullish()
      .refine((val) => !val || z.string().email().safeParse(val).success, {
        message: "Invalid email address",
      }),
    website: z
      .string()
      .nullish()
      .refine((val) => !val || z.string().url().safeParse(val).success, {
        message: "Invalid URL",
      }),
  });

export type WorkshopDetails = typeof workshopDetails.$inferSelect;
export type WorkshopDetailsInput = typeof workshopDetails.$inferInsert;
export type WorkshopDetailsUpdate = typeof workshopDetails.$inferInsert;
export type WorkshopDetailsFormInput = z.infer<
  typeof workshopDetailsFormSchema
>;

// Work Order schemas
export const workOrderSelectSchema = createSelectSchema(workOrders);
export const workOrderInsertSchema = createInsertSchema(workOrders);
export const workOrderUpdateSchema = createUpdateSchema(workOrders);

// Part schema for validation
const partSchema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  buyPrice: z.number().min(0, "Buy price must be positive"),
  customerPrice: z.number().min(0, "Customer price must be positive"),
});

// Work Order form schema (excludes generated fields, handles date strings and parts validation)
export const workOrderFormSchema = workOrderInsertSchema
  .omit({
    id: true,
    organizationId: true,
    createdAt: true,
    updatedAt: true,
    status: true, // Omit and redefine with enum
  })
  .extend({
    status: z
      .enum(["draft", "in-progress", "completed", "cancelled"])
      .default("draft"),
    createdDate: z.string().optional().nullable(), // Accept string for date input
    dueDate: z.string().optional().nullable(), // Accept string for date input
    completedDate: z.string().optional().nullable(), // Accept string for date input
    laborCosts: z.number().optional().nullable(),
    laborHours: z.number().optional().nullable(),
    parts: z.array(partSchema).default([]),
  });

export type WorkOrder = typeof workOrders.$inferSelect;
export type WorkOrderInput = typeof workOrders.$inferInsert;
export type WorkOrderUpdate = typeof workOrders.$inferInsert;
export type WorkOrderFormInput = z.infer<typeof workOrderFormSchema>;
