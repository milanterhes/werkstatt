import db from "@/lib/db";
import type {
  WorkOrder,
  WorkOrderFormInput,
  WorkOrderInput,
} from "@/lib/db/schemas";
import { workOrders } from "@/lib/db/work-order-schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ok, err, Result } from "neverthrow";
import { BaseError, DatabaseError, NotFoundError } from "@/lib/errors";
import { serviceTracer } from "@/lib/tracer";
import { SpanStatusCode } from "@opentelemetry/api";

export type { WorkOrderInput };

/**
 * Retrieves all work orders for a given organization.
 *
 * @param organizationId - The ID of the organization to fetch work orders for
 * @returns A Result containing an array of work orders or an error
 */
export async function getWorkOrders(
  organizationId: string
): Promise<Result<WorkOrder[], BaseError>> {
  return await serviceTracer.startActiveSpan(
    "workOrder.getWorkOrders",
    {
      attributes: {
        "service.name": "workOrder",
        "service.operation": "get",
        "organization.id": organizationId,
      },
    },
    async (span) => {
      try {
        const result = await db
          .select()
          .from(workOrders)
          .where(eq(workOrders.organizationId, organizationId));

        span.setAttribute("result.count", result.length);
        return ok(result);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to fetch work orders",
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        return err(
          new DatabaseError({
            customMessage: "Failed to fetch work orders",
            code: "DATABASE_ERROR",
            statusCode: 500,
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
 * Retrieves a single work order by ID.
 *
 * @param id - The work order ID to fetch
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing the work order or an error if not found
 */
export async function getWorkOrderById(
  id: string,
  organizationId: string
): Promise<Result<WorkOrder, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "workOrder.getWorkOrderById",
    {
      attributes: {
        "service.name": "workOrder",
        "service.operation": "get",
        "organization.id": organizationId,
        "entity.id": id,
      },
    },
    async (span) => {
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
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Work order not found",
          });
          return err(
            new NotFoundError({
              customMessage: "Work order not found",
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
          message: "Failed to fetch work order",
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        return err(
          new DatabaseError({
            customMessage: "Failed to fetch work order",
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
): Promise<Result<WorkOrder, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "workOrder.createWorkOrder",
    {
      attributes: {
        "service.name": "workOrder",
        "service.operation": "create",
        "organization.id": organizationId,
      },
    },
    async (span) => {
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

        span.setAttribute("entity.id", result[0].id);
        return ok(result[0]);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to create work order",
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        return err(
          new DatabaseError({
            customMessage: "Failed to create work order",
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
): Promise<Result<WorkOrder, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "workOrder.updateWorkOrder",
    {
      attributes: {
        "service.name": "workOrder",
        "service.operation": "update",
        "organization.id": organizationId,
        "entity.id": id,
      },
    },
    async (span) => {
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
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Work order not found",
          });
          return err(
            new NotFoundError({
              customMessage: "Work order not found",
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
          message: "Failed to update work order",
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        return err(
          new DatabaseError({
            customMessage: "Failed to update work order",
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
): Promise<Result<void, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "workOrder.deleteWorkOrder",
    {
      attributes: {
        "service.name": "workOrder",
        "service.operation": "delete",
        "organization.id": organizationId,
        "entity.id": id,
      },
    },
    async (span) => {
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
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Work order not found",
          });
          return err(
            new NotFoundError({
              customMessage: "Work order not found",
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
          message: "Failed to delete work order",
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        return err(
          new DatabaseError({
            customMessage: "Failed to delete work order",
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
