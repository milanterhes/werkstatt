import { auth } from "@/lib/auth";
import { ensureActiveOrganization, resultToResponse } from "@/lib/api-helpers";
import {
  getFleets,
  createFleet,
  type FleetInput,
} from "@/lib/services/fleet-service";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
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

  const result = await getFleets(activeOrgId);
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
  const result = await createFleet(
    body as Omit<FleetInput, "id" | "organizationId" | "createdAt" | "updatedAt">,
    activeOrgId
  );

  return resultToResponse(result, 201);
}

