"use client";
import { WorkshopDetailsForm } from "@/components/workshop-details-form";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const router = useRouter();

  const { data: workshopDetails, isLoading } = useQuery({
    queryKey: ["workshop-details"],
    queryFn: async () => {
      const response = await fetch("/api/workshop-details");
      if (!response.ok) {
        return null;
      }
      const result = await response.json();
      return result.data;
    },
  });

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
      <WorkshopDetailsForm initialData={workshopDetails} />
    </div>
  );
}

