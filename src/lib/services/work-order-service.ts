import db from "@/lib/db";
import type {
  WorkOrder,
  WorkOrderFormInput,
  WorkOrderInput,
} from "@/lib/db/schemas";
import { workOrders } from "@/lib/db/work-order-schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Result, err, ok } from "neverthrow";

export type { WorkOrderInput };

/**
 * Retrieves all work orders for a given organization.
 *
 * @param organizationId - The ID of the organization to fetch work orders for
 * @returns A Result containing an array of work orders or an error
 */
export async function getWorkOrders(
  organizationId: string
): Promise<Result<WorkOrder[], Error>> {
  try {
    const result = await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.organizationId, organizationId));

    return ok(result);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to fetch work orders")
    );
  }
}

/**
 * Retrieves a single work order by ID.
 *
 * @param id - The work order ID to fetch
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing the work order or an error if not found
 */
export async function getWorkOrderById(
  id: string,
  organizationId: string
): Promise<Result<WorkOrder, Error>> {
  try {
    const result = await db
      .select()
      .from(workOrders)
      .where(
        and(
          eq(workOrders.id, id),
          eq(workOrders.organizationId, organizationId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return err(new Error("Work order not found"));
    }

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to fetch work order")
    );
  }
}

/**
 * Creates a new work order.
 *
 * @param data - Work order data (excluding auto-generated fields)
 * @param organizationId - The ID of the organization to create the work order for
 * @returns A Result containing the created work order or an error
 *
 * @remarks
 * - Automatically generates a new ID using nanoid()
 * - Converts empty strings to null for optional fields
 * - Converts date strings to Date objects for timestamp fields
 * - Sets timestamps automatically
 */
export async function createWorkOrder(
  data: Omit<
    WorkOrderFormInput,
    "id" | "organizationId" | "createdAt" | "updatedAt"
  > & {
    createdDate?: Date | string | null;
    dueDate?: Date | string | null;
    completedDate?: Date | string | null;
  },
  organizationId: string
): Promise<Result<WorkOrder, Error>> {
  try {
    // Clean up empty strings to null for optional fields
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (value === "") {
          return [key, null];
        }
        // Convert date strings to Date objects for timestamp fields
        if (
          (key === "createdDate" ||
            key === "dueDate" ||
            key === "completedDate") &&
          typeof value === "string" &&
          value !== ""
        ) {
          return [key, new Date(value)];
        }
        return [key, value];
      })
    );

    const result = await db
      .insert(workOrders)
      .values({
        id: nanoid(),
        organizationId,
        ...cleanedData,
      } as WorkOrderInput)
      .returning();

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to create work order")
    );
  }
}

/**
 * Updates an existing work order.
 *
 * @param id - The work order ID to update
 * @param data - Partial work order data to update
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing the updated work order or an error if not found
 *
 * @remarks
 * - Converts empty strings to null for optional fields
 * - Converts date strings to Date objects for timestamp fields
 * - Automatically updates the updatedAt timestamp
 * - Only updates fields provided in the data parameter
 */
export async function updateWorkOrder(
  id: string,
  data: Partial<
    Omit<
      WorkOrderFormInput,
      "id" | "organizationId" | "createdAt" | "updatedAt"
    >
  > & {
    createdDate?: Date | string | null;
    dueDate?: Date | string | null;
    completedDate?: Date | string | null;
  },
  organizationId: string
): Promise<Result<WorkOrder, Error>> {
  try {
    // Clean up empty strings to null for optional fields
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (value === "") {
          return [key, null];
        }
        // Convert date strings to Date objects for timestamp fields
        if (
          (key === "createdDate" ||
            key === "dueDate" ||
            key === "completedDate") &&
          typeof value === "string" &&
          value !== ""
        ) {
          return [key, new Date(value)];
        }
        return [key, value];
      })
    );

    const result = await db
      .update(workOrders)
      .set({
        ...cleanedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(workOrders.id, id),
          eq(workOrders.organizationId, organizationId)
        )
      )
      .returning();

    if (result.length === 0) {
      return err(new Error("Work order not found"));
    }

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to update work order")
    );
  }
}

/**
 * Deletes a work order by ID.
 *
 * @param id - The work order ID to delete
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing void on success or an error if not found
 *
 * @remarks
 * - Returns an error if the work order doesn't exist
 * - Cascade deletes are handled at the database level for related records
 */
export async function deleteWorkOrder(
  id: string,
  organizationId: string
): Promise<Result<void, Error>> {
  try {
    const result = await db
      .delete(workOrders)
      .where(
        and(
          eq(workOrders.id, id),
          eq(workOrders.organizationId, organizationId)
        )
      )
      .returning();

    if (result.length === 0) {
      return err(new Error("Work order not found"));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to delete work order")
    );
  }
}
