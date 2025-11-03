import { router } from "./trpc";
import { customerRouter } from "../routers/customer";
import { vehicleRouter } from "../routers/vehicle";
import { fleetRouter } from "../routers/fleet";
import { workshopRouter } from "../routers/workshop";

/**
 * Root tRPC router combining all domain-specific sub-routers.
 * 
 * This is the main API entry point for the application. All API calls
 * are routed through this router to their respective domain routers.
 * 
 * @example
 * ```typescript
 * // Client-side usage
 * const { data } = trpc.customers.list.useQuery();
 * const mutation = trpc.customers.create.useMutation();
 * ```
 * 
 * @see {@link AppRouter} - TypeScript type export for client-side usage
 */
export const appRouter = router({
  customers: customerRouter,
  vehicles: vehicleRouter,
  fleets: fleetRouter,
  workshop: workshopRouter,
});

/**
 * TypeScript type export of the app router for client-side type inference.
 * 
 * This type is used by the tRPC React client to provide full type safety
 * and autocomplete for all API procedures.
 */
export type AppRouter = typeof appRouter;

