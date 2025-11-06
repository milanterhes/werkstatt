import db from "@/lib/db";
import { member, session } from "@/lib/db/auth-schema";
import { BaseError, isBaseError } from "@/lib/errors";
import { serviceTracer } from "@/lib/tracer";
import { SpanStatusCode } from "@opentelemetry/api";
import { Result } from "neverthrow";
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
  return await serviceTracer.startActiveSpan(
    "auth.ensureActiveOrganization",
    {
      attributes: {
        "auth.operation": "ensureActiveOrganization",
        "auth.user_id": sessionData.user?.id ?? "",
        "auth.session_id": sessionData.session?.id ?? "",
      },
    },
    async (span) => {
      try {
        if (!sessionData.session || !sessionData.user) {
          span.setAttribute("auth.resolution_strategy", "no_session");
          return null;
        }

        let activeOrgId = sessionData.session.activeOrganizationId ?? null;
        span.setAttribute("auth.has_active_org", activeOrgId !== null);

        // If no active organization, check if user has exactly one organization
        if (!activeOrgId) {
          const userOrganizations = await serviceTracer.startActiveSpan(
            "db.query.select",
            {
              attributes: {
                "db.operation": "select",
                "db.table": "member",
                "db.query": "getUserOrganizations",
              },
            },
            async (dbSpan) => {
              try {
                const result = await db
                  .select({ organizationId: member.organizationId })
                  .from(member)
                  .where(eq(member.userId, sessionData.user!.id));
                dbSpan.setAttribute("db.result_count", result.length);
                return result;
              } catch (error) {
                dbSpan.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: "Failed to query user organizations",
                });
                dbSpan.recordException(
                  error instanceof Error ? error : new Error(String(error))
                );
                throw error;
              } finally {
                dbSpan.end();
              }
            }
          );

          span.setAttribute(
            "auth.organization_count",
            userOrganizations.length
          );

          // If user has exactly one organization, set it as active
          if (userOrganizations.length === 1) {
            activeOrgId = userOrganizations[0].organizationId;
            span.setAttribute("auth.resolution_strategy", "auto_select_single");

            // Update the session with the active organization
            await serviceTracer.startActiveSpan(
              "db.query.update",
              {
                attributes: {
                  "db.operation": "update",
                  "db.table": "session",
                  "db.query": "updateActiveOrganization",
                },
              },
              async (updateSpan) => {
                try {
                  await db
                    .update(session)
                    .set({ activeOrganizationId: activeOrgId })
                    .where(eq(session.id, sessionData.session!.id));
                  if (activeOrgId) {
                    updateSpan.setAttribute(
                      "auth.organization_id",
                      activeOrgId
                    );
                  }
                } catch (error) {
                  updateSpan.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: "Failed to update session",
                  });
                  updateSpan.recordException(
                    error instanceof Error ? error : new Error(String(error))
                  );
                  throw error;
                } finally {
                  updateSpan.end();
                }
              }
            );
          } else {
            span.setAttribute(
              "auth.resolution_strategy",
              userOrganizations.length === 0
                ? "no_organizations"
                : "multiple_organizations"
            );
          }
        } else {
          span.setAttribute("auth.resolution_strategy", "already_set");
        }

        if (activeOrgId) {
          span.setAttribute("auth.organization_id", activeOrgId);
        }

        return activeOrgId;
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

/**
 * Determines the appropriate HTTP status code based on error type.
 * Uses BaseError statusCode if available, otherwise falls back to message parsing.
 */
function getErrorStatus(error: unknown): number {
  if (isBaseError(error)) {
    return error.statusCode;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("not found")) {
      return 404;
    }
    if (message.includes("unauthorized")) {
      return 401;
    }
    if (message.includes("forbidden")) {
      return 403;
    }
  }

  return 500;
}

/**
 * Helper function to convert a neverthrow Result to a NextResponse
 */
export function resultToResponse<T>(
  result: Result<T, BaseError | Error> | Promise<Result<T, BaseError | Error>>,
  successStatus: number = 200
): NextResponse | Promise<NextResponse> {
  // Handle async results
  if (result instanceof Promise) {
    return result.then((resolvedResult) => {
      if (resolvedResult.isErr()) {
        const error = resolvedResult._unsafeUnwrapErr();
        console.error("Error:", error);
        const status = getErrorStatus(error);
        return NextResponse.json(
          { error: error.message || "Internal server error" },
          { status }
        );
      }
      return NextResponse.json(
        { data: resolvedResult._unsafeUnwrap() },
        { status: successStatus }
      );
    });
  }

  // Handle sync results
  if (result.isErr()) {
    const error = result._unsafeUnwrapErr();
    console.error("Error:", error);
    const status = getErrorStatus(error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status }
    );
  }

  return NextResponse.json({ data: result._unsafeUnwrap() }, { status: successStatus });
}
