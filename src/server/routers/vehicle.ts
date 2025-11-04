import { vehicleFormSchema } from "@/lib/db/schemas";
import { NotFoundError } from "@/lib/errors";
import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  getVehicles,
  updateVehicle,
  type VehicleFilters,
} from "@/lib/services/vehicle-service";
import { TRPCError } from "@trpc/server";
import { match, P } from "ts-pattern";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc/trpc";

export const vehicleRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          customerId: z.string().optional(),
          fleetId: z.string().optional(),
        })
        .optional()
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const filters: VehicleFilters = {};
      if (input?.customerId) {
        filters.customerId = input.customerId;
      }
      if (input?.fleetId) {
        filters.fleetId = input.fleetId;
      }

      const result = await getVehicles(ctx.activeOrganizationId, filters);
      return match(result)
        .with({ type: "Success" }, (r) => r.value)
        .with({ type: "Failure", error: P.select() }, (error) => {
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
      const result = await getVehicleById(input.id, ctx.activeOrganizationId);
      return match(result)
        .with({ type: "Success" }, (r) => r.value)
        .with({ type: "Failure", error: P.select() }, (error) => {
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
        })
        .exhaustive();
    }),

  create: protectedProcedure
    .input(vehicleFormSchema)
    .mutation(async ({ ctx, input }) => {
      // Transform registrationDate from string to Date if provided
      const transformedInput = {
        ...input,
        registrationDate: input.registrationDate
          ? new Date(input.registrationDate)
          : null,
      };
      const result = await createVehicle(
        transformedInput,
        ctx.activeOrganizationId
      );
      return match(result)
        .with({ type: "Success" }, (r) => r.value)
        .with({ type: "Failure", error: P.select() }, (error) => {
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
        data: vehicleFormSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Transform registrationDate from string to Date if provided
      const transformedData = {
        ...input.data,
        registrationDate: input.data.registrationDate
          ? new Date(input.data.registrationDate)
          : input.data.registrationDate === null
          ? null
          : undefined,
      };
      const result = await updateVehicle(
        input.id,
        transformedData,
        ctx.activeOrganizationId
      );
      return match(result)
        .with({ type: "Success" }, (r) => r.value)
        .with({ type: "Failure", error: P.select() }, (error) => {
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
        })
        .exhaustive();
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteVehicle(input.id, ctx.activeOrganizationId);
      match(result)
        .with({ type: "Success" }, () => {})
        .with({ type: "Failure", error: P.select() }, (error) => {
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
        })
        .exhaustive();
      return { success: true };
    }),
});
