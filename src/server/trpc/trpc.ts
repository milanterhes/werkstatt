import { serviceTracer } from "@/lib/tracer";
import { SpanStatusCode } from "@opentelemetry/api";
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

/**
 * OpenTelemetry instrumentation middleware for tRPC procedures
 */
const otelMiddleware = t.middleware(
  async ({ ctx, path, type, getRawInput, next }) => {
    const rawInput = await getRawInput();

    return await serviceTracer.startActiveSpan(
      `trpc.${path}`,
      {
        attributes: {
          "trpc.path": path,
          "trpc.type": type,
          "organization.id": ctx.activeOrganizationId,
          "user.id": ctx.userId,
          ...(rawInput !== undefined &&
            rawInput !== null && {
              "trpc.input": JSON.stringify(rawInput),
            }),
        },
      },
      async (span) => {
        try {
          const result = await next({ ctx });
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          });
          span.recordException(
            error instanceof Error ? error : new Error(String(error))
          );
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }
);

/**
 * Base procedure with OpenTelemetry instrumentation
 */
export const publicProcedure = t.procedure.use(otelMiddleware);

/**
 * Protected procedure that ensures user is authenticated and has active organization
 */
export const protectedProcedure = t.procedure
  .use(otelMiddleware)
  .use(async ({ ctx, next }) => {
    // Context already ensures authentication and active organization
    // This is just a wrapper for clarity and potential future middleware
    return next({
      ctx: {
        ...ctx,
      },
    });
  });
