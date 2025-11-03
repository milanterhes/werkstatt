import db from "@/lib/db";
import { customers } from "@/lib/db/customer-schema";
import type { Customer, CustomerInput } from "@/lib/db/schemas";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Result, err, ok } from "neverthrow";

export type { CustomerInput };

export async function getCustomers(
  organizationId: string
): Promise<Result<Customer[], Error>> {
  try {
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.organizationId, organizationId));

    return ok(result);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to fetch customers")
    );
  }
}

export async function getCustomerById(
  id: string,
  organizationId: string
): Promise<Result<Customer, Error>> {
  try {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, id), eq(customers.organizationId, organizationId))
      )
      .limit(1);

    if (result.length === 0) {
      return err(new Error("Customer not found"));
    }

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to fetch customer")
    );
  }
}

export async function createCustomer(
  data: Omit<
    CustomerInput,
    "id" | "organizationId" | "createdAt" | "updatedAt"
  >,
  organizationId: string
): Promise<Result<Customer, Error>> {
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

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to create customer")
    );
  }
}

export async function updateCustomer(
  id: string,
  data: Partial<
    Omit<CustomerInput, "id" | "organizationId" | "createdAt" | "updatedAt">
  >,
  organizationId: string
): Promise<Result<Customer, Error>> {
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
        and(eq(customers.id, id), eq(customers.organizationId, organizationId))
      )
      .returning();

    if (result.length === 0) {
      return err(new Error("Customer not found"));
    }

    return ok(result[0]);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to update customer")
    );
  }
}

export async function deleteCustomer(
  id: string,
  organizationId: string
): Promise<Result<void, Error>> {
  try {
    const result = await db
      .delete(customers)
      .where(
        and(eq(customers.id, id), eq(customers.organizationId, organizationId))
      )
      .returning();

    if (result.length === 0) {
      return err(new Error("Customer not found"));
    }

    return ok(undefined);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error("Failed to delete customer")
    );
  }
}
