import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stky/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");

    const leads = await prisma.lead.findMany({
      where: {
        ...(status && { status }),
        ...(source && { source }),
      },
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
  try {
    const body = await request.json();
    const { name, email, company, website, source, status } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        company: company ?? undefined,
        website: website ?? undefined,
        source: source ?? undefined,
        status: status ?? "NEW",
      },
      include: { deals: true },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("POST /api/leads:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
