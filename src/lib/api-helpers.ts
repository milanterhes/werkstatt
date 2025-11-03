import db from "@/lib/db";
import { member, session } from "@/lib/db/auth-schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Result } from "neverthrow";

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
 * Helper function to convert a neverthrow Result to a NextResponse
 */
export function resultToResponse<T>(
  result: Result<T, Error>,
  successStatus: number = 200
): NextResponse {
  return result.match(
    (data) => NextResponse.json({ data }, { status: successStatus }),
    (error) => {
      console.error("Error:", error);
      // Determine appropriate status code based on error type
      const status =
        error.message.includes("Not found") ||
        error.message.includes("not found")
          ? 404
          : error.message.includes("Unauthorized") ||
              error.message.includes("unauthorized")
            ? 401
            : error.message.includes("Forbidden") ||
                error.message.includes("forbidden")
              ? 403
              : 500;
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status }
      );
    }
  );
}

