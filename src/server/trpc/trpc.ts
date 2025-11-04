import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

/**
 * Initialize tRPC with context
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

/**
 * Base router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure that ensures user is authenticated and has active organization
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // Context already ensures authentication and active organization
  // This is just a wrapper for clarity and potential future middleware
  return next({
    ctx: {
      ...ctx,
    },
  });
});
