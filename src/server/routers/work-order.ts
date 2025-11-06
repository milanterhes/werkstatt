import { workOrderFormSchema } from "@/lib/db/schemas";
import {
  createWorkOrder,
  deleteWorkOrder,
  getWorkOrderById,
  getWorkOrders,
  updateWorkOrder,
} from "@/lib/services/work-order-service";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc/trpc";
import { NotFoundError } from "@/lib/errors";

export const workOrderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await getWorkOrders(ctx.activeOrganizationId);
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
      const result = await getWorkOrderById(input.id, ctx.activeOrganizationId);
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
    .input(workOrderFormSchema)
    .mutation(async ({ ctx, input }) => {
      // Convert date strings to Date objects for the service
      const serviceData = {
        ...input,
        createdDate: input.createdDate ? new Date(input.createdDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        completedDate: input.completedDate
          ? new Date(input.completedDate)
          : null,
      } as Parameters<typeof createWorkOrder>[0];
      const result = await createWorkOrder(
        serviceData,
        ctx.activeOrganizationId
      );
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
        data: workOrderFormSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Convert date strings to Date objects for the service
      const serviceData = {
        ...input.data,
        createdDate: input.data.createdDate
          ? new Date(input.data.createdDate)
          : input.data.createdDate,
        dueDate: input.data.dueDate
          ? new Date(input.data.dueDate)
          : input.data.dueDate,
        completedDate: input.data.completedDate
          ? new Date(input.data.completedDate)
          : input.data.completedDate,
      } as Parameters<typeof updateWorkOrder>[1];
      const result = await updateWorkOrder(
        input.id,
        serviceData,
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
      const result = await deleteWorkOrder(input.id, ctx.activeOrganizationId);
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
