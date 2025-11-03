import { router } from "./trpc";
import { customerRouter } from "../routers/customer";
import { vehicleRouter } from "../routers/vehicle";
import { fleetRouter } from "../routers/fleet";
import { workshopRouter } from "../routers/workshop";

/**
 * Root router combining all sub-routers
 */
export const appRouter = router({
  customers: customerRouter,
  vehicles: vehicleRouter,
  fleets: fleetRouter,
  workshop: workshopRouter,
});

export type AppRouter = typeof appRouter;

