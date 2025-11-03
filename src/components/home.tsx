"use client";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { CreateOrganizationForm } from "./create-organization-form";
import { OnboardingFlow } from "./onboarding-flow";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";

const Home = () => {
  const session = authClient.useSession();
  const organizations = authClient.useListOrganizations();
  const activeOrganization = authClient.useActiveOrganization();
  const router = useRouter();

  // Check if workshop details exist
  const { data: workshopDetails } = trpc.workshop.getDetails.useQuery(
    undefined,
    {
      enabled: !!activeOrganization.data?.id,
    }
  );

  async function handleSignOut() {
    const result = await authClient.signOut();
    if (result.error) {
      throw new Error(result.error.message);
    }
    router.push("/sign-in?tab=signin");
  }

  // Show loading state while checking organizations
  if (organizations.isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // Show organization creation form if user has no organizations
  if (!organizations.data || organizations.data.length === 0) {
    return <CreateOrganizationForm />;
  }

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
    !hasWorkshopDetails || !hasAddress || !hasContact || !hasBank;

  if (shouldShowOnboarding) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {session.data?.user.name}
            </h1>
            <p className="text-muted-foreground">
              {activeOrganization.data?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/settings")} variant="outline">
              Settings
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              Sign out
            </Button>
          </div>
        </div>
        <OnboardingFlow />
      </div>
    );
  }

  // Show regular home content if workshop details are complete
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {session.data?.user.name}
          </h1>
          <p className="text-muted-foreground">
            {activeOrganization.data?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/settings")} variant="outline">
            Settings
          </Button>
          <Button onClick={handleSignOut} variant="outline">
            Sign out
          </Button>
        </div>
      </div>
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Workshop Dashboard</h2>
        <p className="text-muted-foreground mb-6">
          Your workshop setup is complete. You can now use all features of the
          platform.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Button
            onClick={() => router.push("/customers")}
            variant="outline"
            className="h-auto flex-col items-start py-4"
          >
            <span className="font-semibold">Customers</span>
            <span className="text-sm text-muted-foreground">
              Manage customer contacts
            </span>
          </Button>
          <Button
            onClick={() => router.push("/vehicles")}
            variant="outline"
            className="h-auto flex-col items-start py-4"
          >
            <span className="font-semibold">Vehicles</span>
            <span className="text-sm text-muted-foreground">
              Track vehicle information
            </span>
          </Button>
          <Button
            onClick={() => router.push("/fleets")}
            variant="outline"
            className="h-auto flex-col items-start py-4"
          >
            <span className="font-semibold">Fleets</span>
            <span className="text-sm text-muted-foreground">
              Manage vehicle fleets
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
