import { ensureActiveOrganization } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";
import { serviceTracer } from "@/lib/tracer";
import { SpanStatusCode } from "@opentelemetry/api";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";

/**
 * tRPC context interface containing authenticated user and organization information.
 *
 * This context is available in all tRPC procedures and provides:
 * - `userId`: The authenticated user's ID
 * - `sessionId`: The current session ID
 * - `activeOrganizationId`: The active organization ID (for multi-tenancy)
 *
 * All procedures automatically have access to this context, ensuring
 * that all operations are scoped to the authenticated user's organization.
 */
export interface Context {
  userId: string;
  sessionId: string;
  activeOrganizationId: string;
}

/**
 * Creates the tRPC context for each request.
 *
 * This function:
 * 1. Extracts session data from request headers using Better Auth
 * 2. Validates that the user is authenticated
 * 3. Resolves the active organization (auto-selects if user has only one)
 * 4. Returns context with user and organization information
 *
 * @returns A Promise resolving to the Context object
 * @throws {TRPCError} With code "UNAUTHORIZED" if user is not authenticated
 * @throws {TRPCError} With code "BAD_REQUEST" if no active organization can be resolved
 *
 * @example
 * ```typescript
 * // In a tRPC procedure
 * export const myProcedure = protectedProcedure.query(async ({ ctx }) => {
 *   // ctx.userId, ctx.sessionId, ctx.activeOrganizationId are available
 *   const customers = await getCustomers(ctx.activeOrganizationId);
 * });
 * ```
 */
export async function createContext(): Promise<Context> {
  return await serviceTracer.startActiveSpan(
    "auth.createContext",
    {
      attributes: {
        "auth.operation": "createContext",
      },
    },
    async (span) => {
      try {
        const sessionData = await serviceTracer.startActiveSpan(
          "auth.getSession",
          {
            attributes: {
              "auth.operation": "getSession",
            },
          },
          async (sessionSpan) => {
            try {
              const result = await auth.api.getSession({
                headers: await headers(),
              });
              sessionSpan.setAttribute(
                "auth.session_exists",
                !!(result?.session && result?.user)
              );
              if (result?.user) {
                sessionSpan.setAttribute("auth.user_id", result.user.id);
              }
              return result;
            } catch (error) {
              sessionSpan.setStatus({
                code: SpanStatusCode.ERROR,
                message: "Failed to get session",
              });
              sessionSpan.recordException(
                error instanceof Error ? error : new Error(String(error))
              );
              throw error;
            } finally {
              sessionSpan.end();
            }
          }
        );

        if (!sessionData?.session || !sessionData?.user) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Unauthorized",
          });
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Unauthorized",
          });
        }

        span.setAttribute("auth.user_id", sessionData.user.id);
        span.setAttribute("auth.session_id", sessionData.session.id);

        const activeOrgId = await ensureActiveOrganization(sessionData);

        if (!activeOrgId) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "No active organization",
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active organization",
          });
        }

        span.setAttribute("auth.organization_id", activeOrgId);

        return {
          userId: sessionData.user.id,
          sessionId: sessionData.session.id,
          activeOrganizationId: activeOrgId,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
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
