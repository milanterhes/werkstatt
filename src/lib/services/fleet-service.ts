import db from "@/lib/db";
import { fleets } from "@/lib/db/customer-schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Result, err, ok } from "neverthrow";
import type { Fleet, FleetInput } from "@/lib/db/schemas";

export async function getFleets(
  organizationId: string
): Promise<Result<Fleet[], Error>> {
  try {
    const result = await db
      .select()
      .from(fleets)
      .where(eq(fleets.organizationId, organizationId));

    return ok(result);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to fetch fleets")
    );
  }
}

export async function getFleetById(
  id: string,
  organizationId: string
): Promise<Result<Fleet, Error>> {
  try {
    const result = await db
      .select()
      .from(fleets)
      .where(and(eq(fleets.id, id), eq(fleets.organizationId, organizationId)))
      .limit(1);

    if (result.length === 0) {
      return err(new Error("Fleet not found"));
    }

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to fetch fleet")
    );
  }
}

export async function createFleet(
  data: Omit<FleetInput, "id" | "organizationId" | "createdAt" | "updatedAt">,
  organizationId: string
): Promise<Result<Fleet, Error>> {
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

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to create fleet")
    );
  }
}

export async function updateFleet(
  id: string,
  data: Partial<Omit<FleetInput, "id" | "organizationId" | "createdAt" | "updatedAt">>,
  organizationId: string
): Promise<Result<Fleet, Error>> {
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
      .where(
        and(eq(fleets.id, id), eq(fleets.organizationId, organizationId))
      )
      .returning();

    if (result.length === 0) {
      return err(new Error("Fleet not found"));
    }

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to update fleet")
    );
  }
}

export async function deleteFleet(
  id: string,
  organizationId: string
): Promise<Result<void, Error>> {
  try {
    const result = await db
      .delete(fleets)
      .where(and(eq(fleets.id, id), eq(fleets.organizationId, organizationId)))
      .returning();

    if (result.length === 0) {
      return err(new Error("Fleet not found"));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to delete fleet")
    );
  }
}

