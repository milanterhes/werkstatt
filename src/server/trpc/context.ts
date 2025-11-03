import { ensureActiveOrganization } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TRPCError } from "@trpc/server";

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
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.session || !sessionData?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }

  const activeOrgId = await ensureActiveOrganization(sessionData);
  if (!activeOrgId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active organization",
    });
  }

  return {
    userId: sessionData.user.id,
    sessionId: sessionData.session.id,
    activeOrganizationId: activeOrgId,
  };
}

