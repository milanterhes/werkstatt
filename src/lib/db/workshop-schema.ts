import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { organization } from "./auth-schema";

/**
 * Workshop details table - stores additional company/workshop information
 * Separate from Better Auth's organization table to keep it independent
 */
export const workshopDetails = pgTable("workshop_details", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Company Information
  companyName: text("company_name"), // Company/Workshop name
  commercialRegisterNumber: text("commercial_register_number"), // Handelsregisternummer
  managingDirector: text("managing_director"), // Geschäftsführer

  // Address Information
  street: text("street"),
  houseNumber: text("house_number"),
  postalCode: text("postal_code"), // PLZ
  city: text("city"),
  country: text("country").default("Deutschland"),

  // Contact Information
  phone: text("phone"),
  email: text("email"), // Business email
  website: text("website"),

  // Tax Information
  taxId: text("tax_id"), // Steuernummer (11 digits)
  vatId: text("vat_id"), // Umsatzsteuer-ID/USt-IdNr (DE + 9 digits)

  // Bank Information
  iban: text("iban"), // IBAN for EU (required for invoicing in Germany)
  bic: text("bic"), // BIC/SWIFT code

  // Invoice Settings (for future invoicing feature)
  paymentTermsDays: integer("payment_terms_days").default(14), // Payment terms in days (default: 14 days)
  defaultCurrency: varchar("default_currency", { length: 3 }).default("EUR"),
  invoicePrefix: text("invoice_prefix").default("RE"), // Prefix for invoice numbers

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
