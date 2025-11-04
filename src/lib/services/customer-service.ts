import db from "@/lib/db";
import { customers } from "@/lib/db/customer-schema";
import type { Customer, CustomerInput } from "@/lib/db/schemas";
import { BaseError, DatabaseError, NotFoundError } from "@/lib/errors";
import { serviceTracer } from "@/lib/tracer";
import { SpanStatusCode } from "@opentelemetry/api";
import { Result } from "@praha/byethrow";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export type { CustomerInput };

/**
 * Retrieves all customers for a given organization.
 *
 * @param organizationId - The ID of the organization to fetch customers for
 * @returns A Result containing an array of customers or an error
 *
 * @example
 * ```typescript
 * const result = await getCustomers(orgId);
 * result.match(
 *   (customers) => console.log(`Found ${customers.length} customers`),
 *   (error) => console.error("Failed to fetch customers:", error)
 * );
 * ```
 */
export async function getCustomers(
  organizationId: string
): Promise<Result.Result<Customer[], BaseError>> {
  return await serviceTracer.startActiveSpan(
    "customer.getCustomers",
    {
      attributes: {
        "service.name": "customer",
        "service.operation": "get",
        "organization.id": organizationId,
      },
    },
    async (span) => {
      try {
        const result = await db
          .select()
          .from(customers)
          .where(eq(customers.organizationId, organizationId));

        span.setAttribute("result.count", result.length);
        return Result.succeed(result);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to fetch customers",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return Result.fail(
          new DatabaseError({
            customMessage: "Failed to fetch customers",
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
 * Retrieves a single customer by ID.
 *
 * @param id - The customer ID to fetch
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing the customer or an error if not found
 *
 * @example
 * ```typescript
 * const result = await getCustomerById(customerId, orgId);
 * result.match(
 *   (customer) => console.log("Customer:", customer.name),
 *   (error) => console.error("Customer not found")
 * );
 * ```
 */
export async function getCustomerById(
  id: string,
  organizationId: string
): Promise<Result.Result<Customer, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "customer.getCustomerById",
    {
      attributes: {
        "service.name": "customer",
        "service.operation": "get",
        "organization.id": organizationId,
        "entity.id": id,
      },
    },
    async (span) => {
      try {
        const result = await db
          .select()
          .from(customers)
          .where(
            and(
              eq(customers.id, id),
              eq(customers.organizationId, organizationId)
            )
          )
          .limit(1);

        if (result.length === 0) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Customer not found",
          });
          return Result.fail(
            new NotFoundError({
              customMessage: "Customer not found",
              code: "NOT_FOUND",
              statusCode: 404,
              metadata: { id, organizationId },
            })
          );
        }

        return Result.succeed(result[0]);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to fetch customer",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return Result.fail(
          new DatabaseError({
            customMessage: "Failed to fetch customer",
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
 * Creates a new customer.
 *
 * @param data - Customer data (excluding auto-generated fields)
 * @param organizationId - The ID of the organization to create the customer for
 * @returns A Result containing the created customer or an error
 *
 * @remarks
 * - Automatically generates a new ID using nanoid()
 * - Converts empty strings to null for optional fields
 * - Sets timestamps automatically
 *
 * @example
 * ```typescript
 * const result = await createCustomer(
 *   { name: "John Doe", email: "john@example.com" },
 *   orgId
 * );
 * ```
 */
export async function createCustomer(
  data: Omit<
    CustomerInput,
    "id" | "organizationId" | "createdAt" | "updatedAt"
  >,
  organizationId: string
): Promise<Result.Result<Customer, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "customer.createCustomer",
    {
      attributes: {
        "service.name": "customer",
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
          .insert(customers)
          .values({
            id: nanoid(),
            organizationId,
            ...cleanedData,
          } as CustomerInput)
          .returning();

        span.setAttribute("entity.id", result[0].id);
        return Result.succeed(result[0]);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to create customer",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return Result.fail(
          new DatabaseError({
            customMessage: "Failed to create customer",
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
 * Updates an existing customer.
 *
 * @param id - The customer ID to update
 * @param data - Partial customer data to update
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing the updated customer or an error if not found
 *
 * @remarks
 * - Converts empty strings to null for optional fields
 * - Automatically updates the updatedAt timestamp
 * - Only updates fields provided in the data parameter
 *
 * @example
 * ```typescript
 * const result = await updateCustomer(
 *   customerId,
 *   { email: "newemail@example.com" },
 *   orgId
 * );
 * ```
 */
export async function updateCustomer(
  id: string,
  data: Partial<
    Omit<CustomerInput, "id" | "organizationId" | "createdAt" | "updatedAt">
  >,
  organizationId: string
): Promise<Result.Result<Customer, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "customer.updateCustomer",
    {
      attributes: {
        "service.name": "customer",
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
          .update(customers)
          .set({
            ...cleanedData,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(customers.id, id),
              eq(customers.organizationId, organizationId)
            )
          )
          .returning();

        if (result.length === 0) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Customer not found",
          });
          return Result.fail(
            new NotFoundError({
              customMessage: "Customer not found",
              code: "NOT_FOUND",
              statusCode: 404,
              metadata: { id, organizationId },
            })
          );
        }

        return Result.succeed(result[0]);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to update customer",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return Result.fail(
          new DatabaseError({
            customMessage: "Failed to update customer",
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
 * Deletes a customer by ID.
 *
 * @param id - The customer ID to delete
 * @param organizationId - The ID of the organization (for security/tenant isolation)
 * @returns A Result containing void on success or an error if not found
 *
 * @remarks
 * - Returns an error if the customer doesn't exist
 * - Cascade deletes are handled at the database level for related records
 *
 * @example
 * ```typescript
 * const result = await deleteCustomer(customerId, orgId);
 * result.match(
 *   () => console.log("Customer deleted"),
 *   (error) => console.error("Failed to delete:", error)
 * );
 * ```
 */
export async function deleteCustomer(
  id: string,
  organizationId: string
): Promise<Result.Result<void, BaseError>> {
  return await serviceTracer.startActiveSpan(
    "customer.deleteCustomer",
    {
      attributes: {
        "service.name": "customer",
        "service.operation": "delete",
        "organization.id": organizationId,
        "entity.id": id,
      },
    },
    async (span) => {
      try {
        const result = await db
          .delete(customers)
          .where(
            and(
              eq(customers.id, id),
              eq(customers.organizationId, organizationId)
            )
          )
          .returning();

        if (result.length === 0) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Customer not found",
          });
          return Result.fail(
            new NotFoundError({
              customMessage: "Customer not found",
              code: "NOT_FOUND",
              statusCode: 404,
              metadata: { id, organizationId },
            })
          );
        }

        return Result.succeed(undefined);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to delete customer",
        });
        span.recordException(
          error instanceof Error ? error : new Error(String(error))
        );
        return Result.fail(
          new DatabaseError({
            customMessage: "Failed to delete customer",
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
