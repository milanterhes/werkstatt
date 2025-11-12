import { fleetFormSchema } from "@/lib/db/schemas";
import { LimitExceededError, NotFoundError } from "@/lib/errors";
import {
  createFleet,
  deleteFleet,
  getFleetById,
  getFleets,
  updateFleet,
  type FleetFilters,
} from "@/lib/services/fleet-service";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc/trpc";

export const fleetRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          customerId: z.string().optional(),
          filters: z
            .array(
              z.object({
                column: z.string(),
                value: z.string(),
              })
            )
            .optional(),
        })
        .optional()
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const filters: FleetFilters = {};
      if (input?.customerId) {
        filters.customerId = input.customerId;
      }
      if (input?.filters) {
        filters.filters = input.filters;
      }

      const result = await getFleets(ctx.activeOrganizationId, filters);
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
      const result = await getFleetById(input.id, ctx.activeOrganizationId);
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
    .input(fleetFormSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await createFleet(input, ctx.activeOrganizationId);
      return result.match(
        (value) => value,
        (error) => {
          if (error instanceof LimitExceededError) {
            throw new TRPCError({
              code: "FORBIDDEN",
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
      const result = await deleteFleet(input.id, ctx.activeOrganizationId);
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
