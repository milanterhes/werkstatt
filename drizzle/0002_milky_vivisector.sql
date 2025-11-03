CREATE TABLE "workshop_details" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"legal_form" text,
	"commercial_register_number" text,
	"managing_director" text,
	"street" text,
	"house_number" text,
	"postal_code" text,
	"city" text,
	"country" text DEFAULT 'Deutschland',
	"phone" text,
	"email" text,
	"website" text,
	"tax_id" text,
	"vat_id" text,
	"iban" text,
	"bic" text,
	"payment_terms_days" integer DEFAULT 14,
	"default_currency" varchar(3) DEFAULT 'EUR',
	"invoice_prefix" text DEFAULT 'RE',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workshop_details_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "workshop_details" ADD CONSTRAINT "workshop_details_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;