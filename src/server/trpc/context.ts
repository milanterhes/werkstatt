import { ensureActiveOrganization } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TRPCError } from "@trpc/server";

export interface Context {
  userId: string;
  sessionId: string;
  activeOrganizationId: string;
}

/**
 * Create tRPC context for each request
 * Handles authentication and active organization resolution
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

