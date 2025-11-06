"use client";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { CreateOrganizationForm } from "./create-organization-form";
import { OnboardingFlow } from "./onboarding-flow";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

const Home = () => {
  const session = authClient.useSession();
  const organizations = authClient.useListOrganizations();
  const activeOrganization = authClient.useActiveOrganization();
  const router = useRouter();

  // Check if workshop details exist
  const { data: workshopDetails, isLoading: isLoadingWorkshopDetails } =
    trpc.workshop.getDetails.useQuery(undefined, {
      enabled: !!activeOrganization.data?.id,
    });

  async function handleSignOut() {
    const result = await authClient.signOut();
    if (result.error) {
      throw new Error(result.error.message);
    }
    router.push("/sign-in?tab=signin");
  }

  // Determine loading states
  const isLoadingOrganizations = organizations.isPending;
  const isLoadingSession = session.isPending;
  const isLoadingActiveOrg = activeOrganization.isPending;
  const isLoadingHeader =
    isLoadingSession || isLoadingOrganizations || isLoadingActiveOrg;

  // Show organization creation form if user has no organizations
  const hasNoOrganizations =
    !isLoadingOrganizations &&
    (!organizations.data || organizations.data.length === 0);

  // Show onboarding flow if organization exists but no workshop details yet
  // or if workshop details are incomplete
  const hasWorkshopDetails = !!workshopDetails;
  const hasAddress = !!(
    workshopDetails?.street &&
    workshopDetails?.houseNumber &&
    workshopDetails?.postalCode &&
    workshopDetails?.city
  );
  const hasContact = !!(workshopDetails?.phone && workshopDetails?.email);
  const hasBank = !!(workshopDetails?.iban && workshopDetails?.bic);

  const shouldShowOnboarding =
    !isLoadingWorkshopDetails &&
    !hasNoOrganizations &&
    (!hasWorkshopDetails || !hasAddress || !hasContact || !hasBank);

  const shouldShowDashboard =
    !isLoadingWorkshopDetails &&
    !hasNoOrganizations &&
    hasWorkshopDetails &&
    hasAddress &&
    hasContact &&
    hasBank;

  return (
    <div className="container mx-auto py-8 px-5">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          {isLoadingHeader ? (
            <>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-5 w-48" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">
                Welcome, {session.data?.user.name}
              </h1>
              <p className="text-muted-foreground">
                {activeOrganization.data?.name}
              </p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {isLoadingHeader ? (
            <>
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </>
          ) : (
            <>
              <Button
                onClick={() => router.push("/settings")}
                variant="outline"
              >
                Settings
              </Button>
              <Button onClick={handleSignOut} variant="outline">
                Sign out
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {hasNoOrganizations ? (
        <CreateOrganizationForm />
      ) : isLoadingWorkshopDetails ? (
        <div className="rounded-lg border p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-6" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : shouldShowOnboarding ? (
        <OnboardingFlow />
      ) : shouldShowDashboard ? (
        <Dashboard />
      ) : null}
    </div>
  );
};

const Dashboard = () => {
  const router = useRouter();
  return (
    <div className="rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-4">Workshop Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <Button
          onClick={() => router.push("/customers")}
          variant="outline"
          className="h-auto flex-col items-start py-4 min-w-0 wrap-break-word"
        >
          <span className="font-semibold wrap-break-word">Customers</span>
          <span className="text-sm text-muted-foreground wrap-break-word text-wrap">
            Manage customer contacts
          </span>
        </Button>
        <Button
          onClick={() => router.push("/vehicles")}
          variant="outline"
          className="h-auto flex-col items-start py-4 min-w-0 wrap-break-word"
        >
          <span className="font-semibold wrap-break-word">Vehicles</span>
          <span className="text-sm text-muted-foreground wrap-break-word text-wrap">
            Track vehicle information
          </span>
        </Button>
        <Button
          onClick={() => router.push("/fleets")}
          variant="outline"
          className="h-auto flex-col items-start py-4 min-w-0 wrap-break-word"
        >
          <span className="font-semibold wrap-break-word">Fleets</span>
          <span className="text-sm text-muted-foreground wrap-break-word text-wrap">
            Manage vehicle fleets
          </span>
        </Button>
        <Button
          onClick={() => router.push("/work-orders")}
          variant="outline"
          className="h-auto flex-col items-start py-4 min-w-0 wrap-break-word"
        >
          <span className="font-semibold wrap-break-word">Work Orders</span>
          <span className="text-sm text-muted-foreground wrap-break-word text-wrap">
            Manage work orders
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Home;
