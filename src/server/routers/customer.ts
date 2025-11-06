import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/lib/services/customer-service";
import { customerFormSchema } from "@/lib/db/schemas";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc/trpc";
import { NotFoundError } from "@/lib/errors";

export const customerRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await getCustomers(ctx.activeOrganizationId);
    return result.match(
      (value) => value,
      (error) => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    );
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await getCustomerById(input.id, ctx.activeOrganizationId);
      return result.match(
        (value) => value,
        (error) => {
          if (error instanceof NotFoundError) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      );
    }),

  create: protectedProcedure
    .input(customerFormSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await createCustomer(input, ctx.activeOrganizationId);
      return result.match(
        (value) => value,
        (error) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      );
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: customerFormSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await updateCustomer(
        input.id,
        input.data,
        ctx.activeOrganizationId
      );
      return result.match(
        (value) => value,
        (error) => {
          if (error instanceof NotFoundError) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteCustomer(input.id, ctx.activeOrganizationId);
      result.match(
        () => {},
        (error) => {
          if (error instanceof NotFoundError) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      );
      return { success: true };
    }),
});
