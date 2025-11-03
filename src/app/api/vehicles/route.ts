import { auth } from "@/lib/auth";
import { ensureActiveOrganization, resultToResponse } from "@/lib/api-helpers";
import {
  getVehicles,
  createVehicle,
  type VehicleInput,
  type VehicleFilters,
} from "@/lib/services/vehicle-service";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.session || !sessionData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeOrgId = await ensureActiveOrganization(sessionData);
  if (!activeOrgId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const filters: VehicleFilters = {};
  if (searchParams.get("customerId")) {
    filters.customerId = searchParams.get("customerId")!;
  }
  if (searchParams.get("fleetId")) {
    filters.fleetId = searchParams.get("fleetId")!;
  }

  const result = await getVehicles(activeOrgId, filters);
  return resultToResponse(result);
}

export async function POST(request: NextRequest) {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.session || !sessionData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeOrgId = await ensureActiveOrganization(sessionData);
  if (!activeOrgId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const result = await createVehicle(
    body as Omit<VehicleInput, "id" | "organizationId" | "createdAt" | "updatedAt">,
    activeOrgId
  );

  return resultToResponse(result, 201);
}

