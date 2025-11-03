import { protectedProcedure, router } from "../trpc/trpc";
import { TRPCError } from "@trpc/server";
import {
  getFleets,
  getFleetById,
  createFleet,
  updateFleet,
  deleteFleet,
} from "@/lib/services/fleet-service";
import { fleetFormSchema } from "@/lib/db/schemas";
import { z } from "zod";

export const fleetRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await getFleets(ctx.activeOrganizationId);
    return result.match(
      (data) => data,
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
      const result = await getFleetById(input.id, ctx.activeOrganizationId);
      return result.match(
        (data) => data,
        (error) => {
          if (error.message.includes("not found")) {
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
    .input(fleetFormSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await createFleet(input, ctx.activeOrganizationId);
      return result.match(
        (data) => data,
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
        data: fleetFormSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await updateFleet(
        input.id,
        input.data,
        ctx.activeOrganizationId
      );
      return result.match(
        (data) => data,
        (error) => {
          if (error.message.includes("not found")) {
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
      const result = await deleteFleet(input.id, ctx.activeOrganizationId);
      return result.match(
        () => ({ success: true }),
        (error) => {
          if (error.message.includes("not found")) {
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
});

