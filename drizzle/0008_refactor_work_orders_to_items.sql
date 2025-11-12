-- Add items column (nullable initially for data migration)
ALTER TABLE "work_orders" ADD COLUMN "items" jsonb;

-- Migrate existing data: Convert labor_costs + labor_hours to labor items
UPDATE "work_orders"
SET "items" = CASE
  WHEN "labor_costs" IS NOT NULL AND "labor_hours" IS NOT NULL AND "labor_hours" > 0 THEN
    jsonb_build_array(
      jsonb_build_object(
        'type', 'labor',
        'description', COALESCE("description", 'Labor'),
        'quantity', "labor_hours",
        'unitType', 'hours',
        'unitPrice', CASE WHEN "labor_hours" > 0 THEN "labor_costs" / "labor_hours" ELSE "labor_costs" END,
        'totalPrice', "labor_costs",
        'hours', "labor_hours",
        'rate', CASE WHEN "labor_hours" > 0 THEN "labor_costs" / "labor_hours" ELSE "labor_costs" END
      )
    )
  WHEN "labor_costs" IS NOT NULL THEN
    jsonb_build_array(
      jsonb_build_object(
        'type', 'labor',
        'description', COALESCE("description", 'Labor'),
        'quantity', 1,
        'unitType', 'hours',
        'unitPrice', "labor_costs",
        'totalPrice', "labor_costs",
        'hours', COALESCE("labor_hours", 1),
        'rate', "labor_costs"
      )
    )
  ELSE
    '[]'::jsonb
END
WHERE "labor_costs" IS NOT NULL OR "labor_hours" IS NOT NULL;

-- Migrate existing data: Convert parts array to part items
UPDATE "work_orders"
SET "items" = CASE
  WHEN "items" IS NULL OR "items" = '[]'::jsonb THEN
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'type', 'part',
            'description', COALESCE(part->>'partNumber', 'Part'),
            'quantity', 1,
            'unitType', 'pieces',
            'unitPrice', (part->>'customerPrice')::numeric,
            'totalPrice', (part->>'customerPrice')::numeric,
            'partNumber', part->>'partNumber',
            'buyPrice', CASE WHEN part->>'buyPrice' IS NOT NULL THEN (part->>'buyPrice')::numeric ELSE NULL END
          )
        )
        FROM jsonb_array_elements("parts") AS part
      ),
      '[]'::jsonb
    )
  WHEN "parts" IS NOT NULL AND jsonb_typeof("parts") = 'array' AND jsonb_array_length("parts") > 0 THEN
    "items" || (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', 'part',
          'description', COALESCE(part->>'partNumber', 'Part'),
          'quantity', 1,
          'unitType', 'pieces',
          'unitPrice', (part->>'customerPrice')::numeric,
          'totalPrice', (part->>'customerPrice')::numeric,
          'partNumber', part->>'partNumber',
          'buyPrice', CASE WHEN part->>'buyPrice' IS NOT NULL THEN (part->>'buyPrice')::numeric ELSE NULL END
        )
      )
      FROM jsonb_array_elements("parts") AS part
    )
  ELSE
    "items"
END
WHERE "parts" IS NOT NULL AND jsonb_typeof("parts") = 'array' AND jsonb_array_length("parts") > 0;

-- Set default empty array for rows that don't have items yet
UPDATE "work_orders"
SET "items" = '[]'::jsonb
WHERE "items" IS NULL;

-- Make items not null with default
ALTER TABLE "work_orders" ALTER COLUMN "items" SET DEFAULT '[]'::jsonb;
ALTER TABLE "work_orders" ALTER COLUMN "items" SET NOT NULL;

-- Drop old columns
ALTER TABLE "work_orders" DROP COLUMN "labor_costs";
--> statement-breakpoint
ALTER TABLE "work_orders" DROP COLUMN "labor_hours";
--> statement-breakpoint
ALTER TABLE "work_orders" DROP COLUMN "parts";

