import { fleetFormSchema } from "@/lib/db/schemas";
import {
  createFleet,
  deleteFleet,
  getFleetById,
  getFleets,
  updateFleet,
} from "@/lib/services/fleet-service";
import { TRPCError } from "@trpc/server";
import { match, P } from "ts-pattern";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc/trpc";

export const fleetRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await getFleets(ctx.activeOrganizationId);
    return match(result)
      .with({ type: "Success" }, (r) => r.value)
      .with({ type: "Failure", error: P.select() }, (error: Error) => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      })
      .exhaustive();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await getFleetById(input.id, ctx.activeOrganizationId);
      return match(result)
        .with({ type: "Success" }, ({ value }) => value)
        .with({ type: "Failure", error: P.select() }, (error: Error) => {
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes("not found")) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        })
        .exhaustive();
    }),

  create: protectedProcedure
    .input(fleetFormSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await createFleet(input, ctx.activeOrganizationId);
      return match(result)
        .with({ type: "Success" }, ({ value }) => value)
        .with({ type: "Failure", error: P.select() }, (error: Error) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        })
        .exhaustive();
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
      return match(result)
        .with({ type: "Success" }, ({ value }) => value)
        .with({ type: "Failure", error: P.select() }, (error: Error) => {
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes("not found")) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        })
        .exhaustive();
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteFleet(input.id, ctx.activeOrganizationId);
      match(result)
        .with({ type: "Success" }, () => {})
        .with({ type: "Failure", error: P.select() }, (error: Error) => {
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes("not found")) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        })
        .exhaustive();
      return { success: true };
    }),
});
