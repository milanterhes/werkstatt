import db from "@/lib/db";
import { vehicles } from "@/lib/db/customer-schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Result, err, ok } from "neverthrow";
import type { Vehicle, VehicleInput } from "@/lib/db/schemas";

export interface VehicleFilters {
  customerId?: string;
  fleetId?: string;
}

export async function getVehicles(
  organizationId: string,
  filters?: VehicleFilters
): Promise<Result<Vehicle[], Error>> {
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

    return ok(result);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to fetch vehicles")
    );
  }
}

export async function getVehicleById(
  id: string,
  organizationId: string
): Promise<Result<Vehicle, Error>> {
  try {
    const result = await db
      .select()
      .from(vehicles)
      .where(
        and(eq(vehicles.id, id), eq(vehicles.organizationId, organizationId))
      )
      .limit(1);

    if (result.length === 0) {
      return err(new Error("Vehicle not found"));
    }

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to fetch vehicle")
    );
  }
}

export async function createVehicle(
  data: Omit<VehicleInput, "id" | "organizationId" | "createdAt" | "updatedAt">,
  organizationId: string
): Promise<Result<Vehicle, Error>> {
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

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to create vehicle")
    );
  }
}

export async function updateVehicle(
  id: string,
  data: Partial<Omit<VehicleInput, "id" | "organizationId" | "createdAt" | "updatedAt">>,
  organizationId: string
): Promise<Result<Vehicle, Error>> {
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
      return err(new Error("Vehicle not found"));
    }

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to update vehicle")
    );
  }
}

export async function deleteVehicle(
  id: string,
  organizationId: string
): Promise<Result<void, Error>> {
  try {
    const result = await db
      .delete(vehicles)
      .where(
        and(eq(vehicles.id, id), eq(vehicles.organizationId, organizationId))
      )
      .returning();

    if (result.length === 0) {
      return err(new Error("Vehicle not found"));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to delete vehicle")
    );
  }
}

