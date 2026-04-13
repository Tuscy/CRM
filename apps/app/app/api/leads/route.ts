import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stky/db";
import type { Prisma } from "@stky/db";
import { isValidLeadStatus } from "@stky/crm";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { notifyLeadCreated } from "@/lib/crm/webhook-events";

export async function GET(request: NextRequest) {
  if (
    !(await requireAutomationAuth(
      request,
      "GET /api/leads",
      ApiScope.LEADS_READ
    ))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const q = searchParams.get("q");

    const where: Prisma.LeadWhereInput = {
      ...(status && { status }),
      ...(source && { source }),
      ...(q?.trim() && {
        OR: [
          { name: { contains: q.trim(), mode: "insensitive" } },
          { email: { contains: q.trim(), mode: "insensitive" } },
          { company: { contains: q.trim(), mode: "insensitive" } },
        ],
      }),
    };

    const leads = await prisma.lead.findMany({
      where,
      include: {
        deals: true,
        _count: { select: { tasks: true, notes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("GET /api/leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (
    !(await requireAutomationAuth(
      request,
      "POST /api/leads",
      ApiScope.LEADS_WRITE
    ))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, company, website, source, status } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const nextStatus = status ?? "NEW";
    if (!isValidLeadStatus(nextStatus)) {
      return NextResponse.json({ error: "Invalid lead status" }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        company: company ?? undefined,
        website: website ?? undefined,
        source: source ?? undefined,
        status: nextStatus,
      },
      include: { deals: true },
    });

    await notifyLeadCreated(lead);

    return NextResponse.json(lead);
  } catch (error) {
    console.error("POST /api/leads:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
