import db from "@/lib/db";
import { organization } from "@/lib/db/auth-schema";
import {
  getLimits,
  getUsage,
  setLimits,
} from "@/lib/services/organization-limits-service";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc/trpc";

const setLimitsSchema = z.object({
  maxVehicles: z.number().int().positive().optional(),
  maxFleets: z.number().int().positive().optional(),
  maxCustomers: z.number().int().positive().optional(),
  maxMonthlyInvoices: z.number().int().positive().nullable().optional(),
});

export const adminRouter = router({
  getAllOrganizations: protectedProcedure.query(async () => {
    try {
      const organizations = await db.select().from(organization);
      return organizations;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch organizations",
      });
    }
  }),

  getLimits: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const result = await getLimits(input.organizationId);
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

  setLimits: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        limits: setLimitsSchema,
      })
    )
    .mutation(async ({ input }) => {
      const result = await setLimits(input.organizationId, input.limits);
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

  getUsage: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const result = await getUsage(input.organizationId);
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
});

