import db from "@/lib/db";
import { vehicles } from "@/lib/db/customer-schema";
import type { Vehicle, VehicleInput } from "@/lib/db/schemas";
import { BaseError, DatabaseError, NotFoundError } from "@/lib/errors";
import { serviceTracer } from "@/lib/tracer";
import { SpanStatusCode } from "@opentelemetry/api";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { err, ok, Result } from "neverthrow";

export type { VehicleInput };

/**
 * Filters for vehicle queries.
 */
export interface VehicleFilter {
  column: string;
  value: string;
}

export interface VehicleFilters {
  customerId?: string;
  fleetId?: string;
  filters?: VehicleFilter[];
}

/**
 * Retrieves all vehicles for a given organization, optionally filtered.
 *
 * @param organizationId - The ID of the organization to fetch vehicles for
 * @param filters - Optional filters to narrow down results (by customer or fleet)
 * @returns A Result containing an array of vehicles or an error
 *
 * @example
 * ```typescript
 * // Get all vehicles for an organization
 * const result = await getVehicles(orgId);
 *
 * // Get vehicles for a specific customer
 * const result = await getVehicles(orgId, { customerId: "customer-123" });
 *
 * // Get vehicles for a specific fleet
 * const result = await getVehicles(orgId, { fleetId: "fleet-456" });
 * ```
 */
export async function getVehicles(
  organizationId: string,
  filters?: VehicleFilters
): Promise<Result<Vehicle[], BaseError>> {
  return await serviceTracer.startActiveSpan(
    "vehicle.getVehicles",
    {
      attributes: {
        "service.name": "vehicle",
        "service.operation": "get",
        "organization.id": organizationId,
        ...(filters?.customerId && { "filter.customerId": filters.customerId }),
        ...(filters?.fleetId && { "filter.fleetId": filters.fleetId }),
      },
    },
    async (span) => {
      try {
        const conditions = [eq(vehicles.organizationId, organizationId)];

        if (filters?.customerId) {
          conditions.push(eq(vehicles.customerId, filters.customerId));
        }

        if (filters?.fleetId) {
          conditions.push(eq(vehicles.fleetId, filters.fleetId));
        }

        if (filters?.filters && filters.filters.length > 0) {
          const filterConditions = filters.filters
            .map((filter) => {
              const searchPattern = `%${filter.value}%`;
              switch (filter.column) {
                case "licensePlate":
                  return sql`COALESCE(${vehicles.licensePlate}, '') ILIKE ${searchPattern}`;
                case "vin":
                  return sql`COALESCE(${vehicles.vin}, '') ILIKE ${searchPattern}`;
                case "make":
                  return sql`COALESCE(${vehicles.make}, '') ILIKE ${searchPattern}`;
                case "model":
                  return sql`COALESCE(${vehicles.model}, '') ILIKE ${searchPattern}`;
                default:
                  return null;
              }
            })
            .filter((c): c is ReturnType<typeof sql> => c !== null);

          if (filterConditions.length > 0) {
            conditions.push(and(...filterConditions)!);
          }
        }

        const result = await db
          .select()
          .from(vehicles)
          .where(and(...conditions));

        span.setAttribute("result.count", result.length);
        return ok(result);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to fetch vehicles",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return err(
          new DatabaseError({
            customMessage: "Failed to fetch vehicles",
            code: "DATABASE_ERROR",
            statusCode: 500,
            metadata: { organizationId, filters },
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
 * Retrieves a single vehicle by ID.
 *
 * @param id - The vehicle ID to fetch
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing the vehicle or an error if not found
 */
export async function getVehicleById(
  id: string,
  organizationId: string
): Promise<Result<Vehicle, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "vehicle.getVehicleById",
    {
      attributes: {
        "service.name": "vehicle",
        "service.operation": "get",
        "organization.id": organizationId,
        "entity.id": id,
      },
    },
    async (span) => {
      try {
        const result = await db
          .select()
          .from(vehicles)
          .where(
            and(
              eq(vehicles.id, id),
              eq(vehicles.organizationId, organizationId)
            )
          )
          .limit(1);

        if (result.length === 0) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Vehicle not found",
          });
          return err(
            new NotFoundError({
              customMessage: "Vehicle not found",
              code: "NOT_FOUND",
              statusCode: 404,
              metadata: { id, organizationId },
            })
          );
        }

        return ok(result[0]);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to fetch vehicle",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return err(
          new DatabaseError({
            customMessage: "Failed to fetch vehicle",
            code: "DATABASE_ERROR",
            statusCode: 500,
            metadata: { id, organizationId },
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
 * Creates a new vehicle.
 *
 * @param data - Vehicle data (excluding auto-generated fields)
 * @param organizationId - The ID of the organization to create the vehicle for
 * @returns A Result containing the created vehicle or an error
 *
 * @remarks
 * - Automatically generates a new ID using nanoid()
 * - Converts empty strings to null for optional fields
 * - Sets timestamps automatically
 */
export async function createVehicle(
  data: Omit<VehicleInput, "id" | "organizationId" | "createdAt" | "updatedAt">,
  organizationId: string
): Promise<Result<Vehicle, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "vehicle.createVehicle",
    {
      attributes: {
        "service.name": "vehicle",
        "service.operation": "create",
        "organization.id": organizationId,
      },
    },
    async (span) => {
      try {
        // Clean up empty strings to null for optional fields
        const cleanedData = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            value === "" ? null : value,
          ])
        );

        const result = await db
          .insert(vehicles)
          .values({
            id: nanoid(),
            organizationId,
            ...cleanedData,
          } as VehicleInput)
          .returning();

        span.setAttribute("entity.id", result[0].id);
        return ok(result[0]);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to create vehicle",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return err(
          new DatabaseError({
            customMessage: "Failed to create vehicle",
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
 * Updates an existing vehicle.
 *
 * @param id - The vehicle ID to update
 * @param data - Partial vehicle data to update
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing the updated vehicle or an error if not found
 */
export async function updateVehicle(
  id: string,
  data: Partial<
    Omit<VehicleInput, "id" | "organizationId" | "createdAt" | "updatedAt">
  >,
  organizationId: string
): Promise<Result<Vehicle, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "vehicle.updateVehicle",
    {
      attributes: {
        "service.name": "vehicle",
        "service.operation": "update",
        "organization.id": organizationId,
        "entity.id": id,
      },
    },
    async (span) => {
      try {
        // Clean up empty strings to null for optional fields
        const cleanedData = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            value === "" ? null : value,
          ])
        );

        const result = await db
          .update(vehicles)
          .set({
            ...cleanedData,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(vehicles.id, id),
              eq(vehicles.organizationId, organizationId)
            )
          )
          .returning();

        if (result.length === 0) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Vehicle not found",
          });
          return err(
            new NotFoundError({
              customMessage: "Vehicle not found",
              code: "NOT_FOUND",
              statusCode: 404,
              metadata: { id, organizationId },
            })
          );
        }

        return ok(result[0]);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to update vehicle",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return err(
          new DatabaseError({
            customMessage: "Failed to update vehicle",
            code: "DATABASE_ERROR",
            statusCode: 500,
            metadata: { id, organizationId },
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
 * Deletes a vehicle by ID.
 *
 * @param id - The vehicle ID to delete
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing void on success or an error if not found
 */
export async function deleteVehicle(
  id: string,
  organizationId: string
): Promise<Result<void, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "vehicle.deleteVehicle",
    {
      attributes: {
        "service.name": "vehicle",
        "service.operation": "delete",
        "organization.id": organizationId,
        "entity.id": id,
      },
    },
    async (span) => {
      try {
        const result = await db
          .delete(vehicles)
          .where(
            and(
              eq(vehicles.id, id),
              eq(vehicles.organizationId, organizationId)
            )
          )
          .returning();

        if (result.length === 0) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Vehicle not found",
          });
          return err(
            new NotFoundError({
              customMessage: "Vehicle not found",
              code: "NOT_FOUND",
              statusCode: 404,
              metadata: { id, organizationId },
            })
          );
        }

        return ok(undefined);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to delete vehicle",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return err(
          new DatabaseError({
            customMessage: "Failed to delete vehicle",
            code: "DATABASE_ERROR",
            statusCode: 500,
            metadata: { id, organizationId },
            cause: error instanceof Error ? error : undefined,
          })
        );
      } finally {
        span.end();
      }
    }
  );
}
