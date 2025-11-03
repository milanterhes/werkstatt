import { auth } from "@/lib/auth";
import { ensureActiveOrganization, resultToResponse } from "@/lib/api-helpers";
import {
  getFleetById,
  updateFleet,
  deleteFleet,
  type FleetInput,
} from "@/lib/services/fleet-service";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const result = await getFleetById(id, activeOrgId);
  return resultToResponse(result);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const body = await request.json();
  const result = await updateFleet(
    id,
    body as Partial<Omit<FleetInput, "id" | "organizationId" | "createdAt" | "updatedAt">>,
    activeOrgId
  );

  return resultToResponse(result);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const result = await deleteFleet(id, activeOrgId);
  return resultToResponse(result);
}

