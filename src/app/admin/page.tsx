"use client";

import { OrganizationLimitsTable } from "@/components/admin/organization-limits";

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8 max-w-7xl px-5">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Organization Limits (Debug)</h1>
        <p className="text-muted-foreground mt-2">
          Manage resource limits for organizations. Limits are enforced when
          creating vehicles and fleets.
        </p>
      </div>
      <OrganizationLimitsTable />
    </div>
  );
}
