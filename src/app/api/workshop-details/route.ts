import { ensureActiveOrganization } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { workshopDetails } from "@/lib/db/workshop-schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
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

    const details = await db
      .select()
      .from(workshopDetails)
      .where(eq(workshopDetails.organizationId, activeOrgId))
      .limit(1);

    if (details.length === 0) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: details[0] });
  } catch (error) {
    console.error("Error fetching workshop details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    // Clean up empty strings to null for optional fields
    const cleanedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );

    // Check if workshop details already exist
    const existing = await db
      .select()
      .from(workshopDetails)
      .where(eq(workshopDetails.organizationId, activeOrgId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      const updated = await db
        .update(workshopDetails)
        .set({
          ...cleanedBody,
          updatedAt: new Date(),
        })
        .where(eq(workshopDetails.organizationId, activeOrgId))
        .returning();

      return NextResponse.json({ data: updated[0] });
    } else {
      // Create new record
      const created = await db
        .insert(workshopDetails)
        .values({
          id: nanoid(),
          organizationId: activeOrgId,
          ...cleanedBody,
        })
        .returning();

      return NextResponse.json({ data: created[0] });
    }
  } catch (error) {
    console.error("Error updating workshop details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
