CREATE TABLE "organization_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"max_vehicles" integer DEFAULT 100 NOT NULL,
	"max_fleets" integer DEFAULT 50 NOT NULL,
	"max_monthly_invoices" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_limits_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "organization_limits" ADD CONSTRAINT "organization_limits_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;