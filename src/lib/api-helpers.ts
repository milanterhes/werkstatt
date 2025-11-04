import db from "@/lib/db";
import { member, session } from "@/lib/db/auth-schema";
import { Result } from "@praha/byethrow";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function ensureActiveOrganization(sessionData: {
  session: {
    id: string;
    userId: string;
    activeOrganizationId?: string | null;
  } | null;
  user: { id: string } | null;
}): Promise<string | null> {
  if (!sessionData.session || !sessionData.user) {
    return null;
  }

  let activeOrgId = sessionData.session.activeOrganizationId ?? null;

  // If no active organization, check if user has exactly one organization
  if (!activeOrgId) {
    const userOrganizations = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, sessionData.user.id));

    // If user has exactly one organization, set it as active
    if (userOrganizations.length === 1) {
      activeOrgId = userOrganizations[0].organizationId;
      // Update the session with the active organization
      await db
        .update(session)
        .set({ activeOrganizationId: activeOrgId })
        .where(eq(session.id, sessionData.session.id));
    }
  }

  return activeOrgId;
}

/**
 * Determines the appropriate HTTP status code based on error message content
 */
function getErrorStatus(errorMessage: string): number {
  const message = errorMessage.toLowerCase();

  if (message.includes("not found")) {
    return 404;
  }
  if (message.includes("unauthorized")) {
    return 401;
  }
  if (message.includes("forbidden")) {
    return 403;
  }

  return 500;
}

/**
 * Helper function to convert a byethrow Result to a NextResponse
 */
export function resultToResponse<T>(
  result: Result.ResultMaybeAsync<T, Error>,
  successStatus: number = 200
): NextResponse | Promise<NextResponse> {
  // Handle async results
  if (result instanceof Promise) {
    return result.then((resolvedResult) => {
      if (Result.isFailure(resolvedResult)) {
        console.error("Error:", resolvedResult.error);
        const status = getErrorStatus(resolvedResult.error.message);
        return NextResponse.json(
          { error: resolvedResult.error.message || "Internal server error" },
          { status }
        );
      }
      return NextResponse.json(
        { data: resolvedResult.value },
        { status: successStatus }
      );
    });
  }

  // Handle sync results
  if (Result.isFailure(result)) {
    console.error("Error:", result.error);
    const status = getErrorStatus(result.error.message);
    return NextResponse.json(
      { error: result.error.message || "Internal server error" },
      { status }
    );
  }

  return NextResponse.json({ data: result.value }, { status: successStatus });
}
