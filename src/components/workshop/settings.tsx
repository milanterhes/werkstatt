"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { WorkshopDetailsForm } from "./workshop-details-form";
import type { WorkshopDetailsFormInput } from "@/lib/db/schemas";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";

export default function Settings() {
  const router = useRouter();

  const { data: workshopDetails, isLoading } =
    trpc.workshop.getDetails.useQuery();

  // Exclude database-specific fields (id, organizationId, createdAt, updatedAt)
  const formData: Partial<WorkshopDetailsFormInput> | null | undefined =
    workshopDetails
      ? (Object.fromEntries(
          Object.entries(workshopDetails).filter(
            ([key]) =>
              !["id", "organizationId", "createdAt", "updatedAt"].includes(key)
          )
        ) as Partial<WorkshopDetailsFormInput>)
      : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your workshop details and preferences
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/")}>
          Back to Dashboard
        </Button>
      </div>
      <WorkshopDetailsForm initialData={formData} />
    </div>
  );
}
