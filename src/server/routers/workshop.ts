import { protectedProcedure, router } from "../trpc/trpc";
import { TRPCError } from "@trpc/server";
import db from "@/lib/db";
import { workshopDetails } from "@/lib/db/workshop-schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { workshopDetailsFormSchema } from "@/lib/db/schemas";

export const workshopRouter = router({
  getDetails: protectedProcedure.query(async ({ ctx }) => {
    try {
      const details = await db
        .select()
        .from(workshopDetails)
        .where(eq(workshopDetails.organizationId, ctx.activeOrganizationId))
        .limit(1);

      if (details.length === 0) {
        return null;
      }

      return details[0];
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch workshop details",
      });
    }
  }),

  updateDetails: protectedProcedure
    .input(workshopDetailsFormSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Clean up empty strings to null for optional fields
        const cleanedData = Object.fromEntries(
          Object.entries(input).map(([key, value]) => [
            key,
            value === "" ? null : value,
          ])
        );

        // Check if workshop details already exist
        const existing = await db
          .select()
          .from(workshopDetails)
          .where(eq(workshopDetails.organizationId, ctx.activeOrganizationId))
          .limit(1);

        if (existing.length > 0) {
          // Update existing record
          const updated = await db
            .update(workshopDetails)
            .set({
              ...cleanedData,
              updatedAt: new Date(),
            })
            .where(eq(workshopDetails.organizationId, ctx.activeOrganizationId))
            .returning();

          return updated[0];
        } else {
          // Create new record
          const created = await db
            .insert(workshopDetails)
            .values({
              id: nanoid(),
              organizationId: ctx.activeOrganizationId,
              ...cleanedData,
            })
            .returning();

          return created[0];
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update workshop details",
        });
      }
    }),
});

