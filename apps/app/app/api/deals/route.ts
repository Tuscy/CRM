import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stky/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, value, stage } = body;

    if (!leadId || !stage) {
      return NextResponse.json(
        { error: "leadId and stage are required" },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.create({
      data: {
        leadId,
        value: value ?? undefined,
        stage,
      },
      include: { lead: true },
    });

    return NextResponse.json(deal);
  } catch (error) {
    console.error("POST /api/deals:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
