import db from "@/lib/db";
import { customers, fleets, vehicles } from "@/lib/db/customer-schema";
import { organizationLimits } from "@/lib/db/organization-limits-schema";
import { BaseError, DatabaseError, LimitExceededError } from "@/lib/errors";
import { serviceTracer } from "@/lib/tracer";
import { SpanStatusCode } from "@opentelemetry/api";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { err, ok, Result } from "neverthrow";

export type OrganizationLimits = typeof organizationLimits.$inferSelect;
export type OrganizationLimitsInput = typeof organizationLimits.$inferInsert;

export interface OrganizationUsage {
  vehicleCount: number;
  fleetCount: number;
  customerCount: number;
}

/**
 * Default limits for new organizations
 */
const DEFAULT_LIMITS = {
  maxVehicles: 100,
  maxFleets: 50,
  maxCustomers: 200,
  maxMonthlyInvoices: null,
};

/**
 * Retrieves limits for an organization, creating with defaults if not exists.
 *
 * @param organizationId - The ID of the organization
 * @returns A Result containing the organization limits or an error
 */
export async function getLimits(
  organizationId: string
): Promise<Result<OrganizationLimits, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "organizationLimits.getLimits",
    {
      attributes: {
        "service.name": "organizationLimits",
        "service.operation": "get",
        "organization.id": organizationId,
      },
    },
    async (span) => {
      try {
        const result = await db
          .select()
          .from(organizationLimits)
          .where(eq(organizationLimits.organizationId, organizationId))
          .limit(1);

        if (result.length === 0) {
          // Create with defaults if not exists
          const created = await db
            .insert(organizationLimits)
            .values({
              id: nanoid(),
              organizationId,
              ...DEFAULT_LIMITS,
            })
            .returning();

          span.setAttribute("created", true);
          return ok(created[0]);
        }

        return ok(result[0]);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to fetch organization limits",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return err(
          new DatabaseError({
            customMessage: "Failed to fetch organization limits",
            code: "DATABASE_ERROR",
            statusCode: 500,
            metadata: { organizationId },
            cause: error instanceof Error ? error : undefined,
          })
        );
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Sets or updates limits for an organization.
 *
 * @param organizationId - The ID of the organization
 * @param limits - Partial limits to update
 * @returns A Result containing the updated limits or an error
 */
export async function setLimits(
  organizationId: string,
  limits: Partial<
    Pick<
      OrganizationLimitsInput,
      "maxVehicles" | "maxFleets" | "maxCustomers" | "maxMonthlyInvoices"
    >
  >
): Promise<Result<OrganizationLimits, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "organizationLimits.setLimits",
    {
      attributes: {
        "service.name": "organizationLimits",
        "service.operation": "set",
        "organization.id": organizationId,
      },
    },
    async (span) => {
      try {
        // Check if limits exist
        const existing = await db
          .select()
          .from(organizationLimits)
          .where(eq(organizationLimits.organizationId, organizationId))
          .limit(1);

        if (existing.length === 0) {
          // Create new limits
          const created = await db
            .insert(organizationLimits)
            .values({
              id: nanoid(),
              organizationId,
              maxVehicles: limits.maxVehicles ?? DEFAULT_LIMITS.maxVehicles,
              maxFleets: limits.maxFleets ?? DEFAULT_LIMITS.maxFleets,
              maxCustomers: limits.maxCustomers ?? DEFAULT_LIMITS.maxCustomers,
              maxMonthlyInvoices:
                limits.maxMonthlyInvoices ?? DEFAULT_LIMITS.maxMonthlyInvoices,
            })
            .returning();

          span.setAttribute("created", true);
          return ok(created[0]);
        } else {
          // Update existing limits
          const updated = await db
            .update(organizationLimits)
            .set({
              ...limits,
              updatedAt: new Date(),
            })
            .where(eq(organizationLimits.organizationId, organizationId))
            .returning();

          return ok(updated[0]);
        }
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to set organization limits",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return err(
          new DatabaseError({
            customMessage: "Failed to set organization limits",
            code: "DATABASE_ERROR",
            statusCode: 500,
            metadata: { organizationId, limits },
            cause: error instanceof Error ? error : undefined,
          })
        );
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Checks if vehicle creation is allowed for an organization.
 *
 * @param organizationId - The ID of the organization
 * @returns A Result containing void if allowed, or LimitExceededError if limit exceeded
 */
export async function checkVehicleLimit(
  organizationId: string
): Promise<Result<void, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "organizationLimits.checkVehicleLimit",
    {
      attributes: {
        "service.name": "organizationLimits",
        "service.operation": "checkVehicleLimit",
        "organization.id": organizationId,
      },
    },
    async (span) => {
      try {
        const limitsResult = await getLimits(organizationId);
        if (limitsResult.isErr()) {
          return err(limitsResult.error);
        }

        const limits = limitsResult.value;

        // Get current vehicle count
        const vehicleCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(vehicles)
          .where(eq(vehicles.organizationId, organizationId));

        const currentCount = Number(vehicleCountResult[0]?.count ?? 0);

        span.setAttribute("limit.maxVehicles", limits.maxVehicles);
        span.setAttribute("usage.vehicleCount", currentCount);

        if (currentCount >= limits.maxVehicles) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Vehicle limit exceeded",
          });
          return err(
            new LimitExceededError({
              customMessage: `Vehicle limit exceeded. Current: ${currentCount}/${limits.maxVehicles}`,
              code: "LIMIT_EXCEEDED",
              statusCode: 403,
              limitType: "vehicles",
              currentUsage: currentCount,
              limit: limits.maxVehicles,
              metadata: { organizationId },
            })
          );
        }

        return ok(undefined);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to check vehicle limit",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return err(
          new DatabaseError({
            customMessage: "Failed to check vehicle limit",
            code: "DATABASE_ERROR",
            statusCode: 500,
            metadata: { organizationId },
            cause: error instanceof Error ? error : undefined,
          })
        );
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Checks if fleet creation is allowed for an organization.
 *
 * @param organizationId - The ID of the organization
 * @returns A Result containing void if allowed, or LimitExceededError if limit exceeded
 */
export async function checkFleetLimit(
  organizationId: string
): Promise<Result<void, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "organizationLimits.checkFleetLimit",
    {
      attributes: {
        "service.name": "organizationLimits",
        "service.operation": "checkFleetLimit",
        "organization.id": organizationId,
      },
    },
    async (span) => {
      try {
        const limitsResult = await getLimits(organizationId);
        if (limitsResult.isErr()) {
          return err(limitsResult.error);
        }

        const limits = limitsResult.value;

        // Get current fleet count
        const fleetCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(fleets)
          .where(eq(fleets.organizationId, organizationId));

        const currentCount = Number(fleetCountResult[0]?.count ?? 0);

        span.setAttribute("limit.maxFleets", limits.maxFleets);
        span.setAttribute("usage.fleetCount", currentCount);

        if (currentCount >= limits.maxFleets) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Fleet limit exceeded",
          });
          return err(
            new LimitExceededError({
              customMessage: `Fleet limit exceeded. Current: ${currentCount}/${limits.maxFleets}`,
              code: "LIMIT_EXCEEDED",
              statusCode: 403,
              limitType: "fleets",
              currentUsage: currentCount,
              limit: limits.maxFleets,
              metadata: { organizationId },
            })
          );
        }

        return ok(undefined);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to check fleet limit",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return err(
          new DatabaseError({
            customMessage: "Failed to check fleet limit",
            code: "DATABASE_ERROR",
            statusCode: 500,
            metadata: { organizationId },
            cause: error instanceof Error ? error : undefined,
          })
        );
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Checks if customer creation is allowed for an organization.
 *
 * @param organizationId - The ID of the organization
 * @returns A Result containing void if allowed, or LimitExceededError if limit exceeded
 */
export async function checkCustomerLimit(
  organizationId: string
): Promise<Result<void, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "organizationLimits.checkCustomerLimit",
    {
      attributes: {
        "service.name": "organizationLimits",
        "service.operation": "checkCustomerLimit",
        "organization.id": organizationId,
      },
    },
    async (span) => {
      try {
        const limitsResult = await getLimits(organizationId);
        if (limitsResult.isErr()) {
          return err(limitsResult.error);
        }

        const limits = limitsResult.value;

        // Get current customer count
        const customerCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(customers)
          .where(eq(customers.organizationId, organizationId));

        const currentCount = Number(customerCountResult[0]?.count ?? 0);

        span.setAttribute("limit.maxCustomers", limits.maxCustomers);
        span.setAttribute("usage.customerCount", currentCount);

        if (currentCount >= limits.maxCustomers) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Customer limit exceeded",
          });
          return err(
            new LimitExceededError({
              customMessage: `Customer limit exceeded. Current: ${currentCount}/${limits.maxCustomers}`,
              code: "LIMIT_EXCEEDED",
              statusCode: 403,
              limitType: "customers",
              currentUsage: currentCount,
              limit: limits.maxCustomers,
              metadata: { organizationId },
            })
          );
        }

        return ok(undefined);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to check customer limit",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return err(
          new DatabaseError({
            customMessage: "Failed to check customer limit",
            code: "DATABASE_ERROR",
            statusCode: 500,
            metadata: { organizationId },
            cause: error instanceof Error ? error : undefined,
          })
        );
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Gets current usage statistics for an organization.
 *
 * @param organizationId - The ID of the organization
 * @returns A Result containing usage statistics or an error
 */
export async function getUsage(
  organizationId: string
): Promise<Result<OrganizationUsage, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "organizationLimits.getUsage",
    {
      attributes: {
        "service.name": "organizationLimits",
        "service.operation": "getUsage",
        "organization.id": organizationId,
      },
    },
    async (span) => {
      try {
        const [vehicleCountResult, fleetCountResult, customerCountResult] =
          await Promise.all([
            db
              .select({ count: sql<number>`count(*)` })
              .from(vehicles)
              .where(eq(vehicles.organizationId, organizationId)),
            db
              .select({ count: sql<number>`count(*)` })
              .from(fleets)
              .where(eq(fleets.organizationId, organizationId)),
            db
              .select({ count: sql<number>`count(*)` })
              .from(customers)
              .where(eq(customers.organizationId, organizationId)),
          ]);

        const usage: OrganizationUsage = {
          vehicleCount: Number(vehicleCountResult[0]?.count ?? 0),
          fleetCount: Number(fleetCountResult[0]?.count ?? 0),
          customerCount: Number(customerCountResult[0]?.count ?? 0),
        };

        span.setAttribute("usage.vehicleCount", usage.vehicleCount);
        span.setAttribute("usage.fleetCount", usage.fleetCount);
        span.setAttribute("usage.customerCount", usage.customerCount);

        return ok(usage);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to get organization usage",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return err(
          new DatabaseError({
            customMessage: "Failed to get organization usage",
            code: "DATABASE_ERROR",
            statusCode: 500,
            metadata: { organizationId },
            cause: error instanceof Error ? error : undefined,
          })
        );
      } finally {
        span.end();
      }
    }
  );
}

