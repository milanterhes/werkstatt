import db from "@/lib/db";
import { fleets } from "@/lib/db/customer-schema";
import type { Fleet, FleetInput } from "@/lib/db/schemas";
import { BaseError, DatabaseError, NotFoundError } from "@/lib/errors";
import { Result } from "@praha/byethrow";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export type { FleetInput };

/**
 * Retrieves all fleets for a given organization.
 *
 * @param organizationId - The ID of the organization to fetch fleets for
 * @returns A Result containing an array of fleets or an error
 */
export async function getFleets(
  organizationId: string
): Promise<Result.Result<Fleet[], BaseError>> {
  try {
    const result = await db
      .select()
      .from(fleets)
      .where(eq(fleets.organizationId, organizationId));

    return Result.succeed(result);
  } catch (error) {
    return Result.fail(
      new DatabaseError({
        customMessage: "Failed to fetch fleets",
        code: "DATABASE_ERROR",
        statusCode: 500,
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}

/**
 * Retrieves a single fleet by ID.
 *
 * @param id - The fleet ID to fetch
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing the fleet or an error if not found
 */
export async function getFleetById(
  id: string,
  organizationId: string
): Promise<Result.Result<Fleet, BaseError>> {
  try {
    const result = await db
      .select()
      .from(fleets)
      .where(and(eq(fleets.id, id), eq(fleets.organizationId, organizationId)))
      .limit(1);

    if (result.length === 0) {
      return Result.fail(
        new NotFoundError({
          customMessage: "Fleet not found",
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
        customMessage: "Failed to fetch fleet",
        code: "DATABASE_ERROR",
        statusCode: 500,
        metadata: { id, organizationId },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}

/**
 * Creates a new fleet.
 *
 * @param data - Fleet data (excluding auto-generated fields)
 * @param organizationId - The ID of the organization to create the fleet for
 * @returns A Result containing the created fleet or an error
 */
export async function createFleet(
  data: Omit<FleetInput, "id" | "organizationId" | "createdAt" | "updatedAt">,
  organizationId: string
): Promise<Result.Result<Fleet, BaseError>> {
  try {
    // Clean up empty strings to null for optional fields
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );

    const result = await db
      .insert(fleets)
      .values({
        id: nanoid(),
        organizationId,
        ...cleanedData,
      } as FleetInput)
      .returning();

    return Result.succeed(result[0]);
  } catch (error) {
    return Result.fail(
      new DatabaseError({
        customMessage: "Failed to create fleet",
        code: "DATABASE_ERROR",
        statusCode: 500,
        metadata: { organizationId },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}

/**
 * Updates an existing fleet.
 *
 * @param id - The fleet ID to update
 * @param data - Partial fleet data to update
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing the updated fleet or an error if not found
 */
export async function updateFleet(
  id: string,
  data: Partial<
    Omit<FleetInput, "id" | "organizationId" | "createdAt" | "updatedAt">
  >,
  organizationId: string
): Promise<Result.Result<Fleet, BaseError>> {
  try {
    // Clean up empty strings to null for optional fields
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );

    const result = await db
      .update(fleets)
      .set({
        ...cleanedData,
        updatedAt: new Date(),
      })
      .where(and(eq(fleets.id, id), eq(fleets.organizationId, organizationId)))
      .returning();

    if (result.length === 0) {
      return Result.fail(
        new NotFoundError({
          customMessage: "Fleet not found",
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
        customMessage: "Failed to update fleet",
        code: "DATABASE_ERROR",
        statusCode: 500,
        metadata: { id, organizationId },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}

/**
 * Deletes a fleet by ID.
 *
 * @param id - The fleet ID to delete
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing void on success or an error if not found
 */
export async function deleteFleet(
  id: string,
  organizationId: string
): Promise<Result.Result<void, BaseError>> {
  try {
    const result = await db
      .delete(fleets)
      .where(and(eq(fleets.id, id), eq(fleets.organizationId, organizationId)))
      .returning();

    if (result.length === 0) {
      return Result.fail(
        new NotFoundError({
          customMessage: "Fleet not found",
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
        customMessage: "Failed to delete fleet",
        code: "DATABASE_ERROR",
        statusCode: 500,
        metadata: { id, organizationId },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}
