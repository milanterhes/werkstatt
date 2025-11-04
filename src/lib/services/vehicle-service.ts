import db from "@/lib/db";
import { vehicles } from "@/lib/db/customer-schema";
import type { Vehicle, VehicleInput } from "@/lib/db/schemas";
import { BaseError, DatabaseError, NotFoundError } from "@/lib/errors";
import { Result } from "@praha/byethrow";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export type { VehicleInput };

/**
 * Filters for vehicle queries.
 */
export interface VehicleFilters {
  customerId?: string;
  fleetId?: string;
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
): Promise<Result.Result<Vehicle[], BaseError>> {
  try {
    const conditions = [eq(vehicles.organizationId, organizationId)];

    if (filters?.customerId) {
      conditions.push(eq(vehicles.customerId, filters.customerId));
    }

    if (filters?.fleetId) {
      conditions.push(eq(vehicles.fleetId, filters.fleetId));
    }

    const result = await db
      .select()
      .from(vehicles)
      .where(and(...conditions));

    return Result.succeed(result);
  } catch (error) {
    return Result.fail(
      new DatabaseError({
        customMessage: "Failed to fetch vehicles",
        code: "DATABASE_ERROR",
        statusCode: 500,
        metadata: { organizationId, filters },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
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
): Promise<Result.Result<Vehicle, BaseError>> {
  try {
    const result = await db
      .select()
      .from(vehicles)
      .where(
        and(eq(vehicles.id, id), eq(vehicles.organizationId, organizationId))
      )
      .limit(1);

    if (result.length === 0) {
      return Result.fail(
        new NotFoundError({
          customMessage: "Vehicle not found",
          code: "NOT_FOUND",
          statusCode: 404,
          metadata: { id, organizationId },
        })
      );
    }

    return Result.succeed(result[0]);
  } catch (error) {
    return Result.fail(
      new DatabaseError({
        customMessage: "Failed to fetch vehicle",
        code: "DATABASE_ERROR",
        statusCode: 500,
        metadata: { id, organizationId },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
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
): Promise<Result.Result<Vehicle, BaseError>> {
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

    return Result.succeed(result[0]);
  } catch (error) {
    return Result.fail(
      new DatabaseError({
        customMessage: "Failed to create vehicle",
        code: "DATABASE_ERROR",
        statusCode: 500,
        metadata: { organizationId },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
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
): Promise<Result.Result<Vehicle, BaseError>> {
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
        and(eq(vehicles.id, id), eq(vehicles.organizationId, organizationId))
      )
      .returning();

    if (result.length === 0) {
      return Result.fail(
        new NotFoundError({
          customMessage: "Vehicle not found",
          code: "NOT_FOUND",
          statusCode: 404,
          metadata: { id, organizationId },
        })
      );
    }

    return Result.succeed(result[0]);
  } catch (error) {
    return Result.fail(
      new DatabaseError({
        customMessage: "Failed to update vehicle",
        code: "DATABASE_ERROR",
        statusCode: 500,
        metadata: { id, organizationId },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
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
): Promise<Result.Result<void, BaseError>> {
  try {
    const result = await db
      .delete(vehicles)
      .where(
        and(eq(vehicles.id, id), eq(vehicles.organizationId, organizationId))
      )
      .returning();

    if (result.length === 0) {
      return Result.fail(
        new NotFoundError({
          customMessage: "Vehicle not found",
          code: "NOT_FOUND",
          statusCode: 404,
          metadata: { id, organizationId },
        })
      );
    }

    return Result.succeed(undefined);
  } catch (error) {
    return Result.fail(
      new DatabaseError({
        customMessage: "Failed to delete vehicle",
        code: "DATABASE_ERROR",
        statusCode: 500,
        metadata: { id, organizationId },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}
