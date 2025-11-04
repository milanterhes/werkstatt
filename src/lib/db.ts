import { instrumentDrizzleClient } from "@kubiks/otel-drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./db/";

/**
 * Drizzle ORM database instance.
 *
 * This is the main database connection and query builder instance.
 * It uses PostgreSQL as the database provider and includes all schema
 * definitions for type-safe queries.
 *
 * @example
 * ```typescript
 * import db from "@/lib/db";
 * import { customers } from "@/lib/db/customer-schema";
 * import { eq } from "drizzle-orm";
 *
 * const result = await db
 *   .select()
 *   .from(customers)
 *   .where(eq(customers.organizationId, orgId));
 * ```
 *
 * @requires DATABASE_URL environment variable
 * @see https://orm.drizzle.team/docs/overview for Drizzle ORM documentation
 */
const db = drizzle(process.env.DATABASE_URL!, {
  schema,
});

instrumentDrizzleClient(db);

export default db;
