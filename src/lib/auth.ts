import { instrumentBetterAuth } from "@kubiks/otel-better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import db from "./db";
import * as schema from "./db/";

/**
 * Better Auth instance configuration.
 *
 * This is the central authentication configuration for the application.
 * It uses:
 * - Drizzle ORM adapter for database operations
 * - PostgreSQL as the database provider
 * - Organization plugin for multi-tenant support
 * - Email/password authentication
 *
 * The auth instance is used in:
 * - API routes for session management (`/api/auth/[...all]/route.ts`)
 * - tRPC context for authentication (`src/server/trpc/context.ts`)
 * - Client-side auth operations (`src/lib/auth-client.ts`)
 *
 * @see https://better-auth.com/docs for Better Auth documentation
 */
export const auth = instrumentBetterAuth(
  betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    plugins: [organization()],
    emailAndPassword: {
      enabled: true,
    },
  })
);
