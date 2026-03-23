import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { value, stage } = body;

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(value !== undefined && { value }),
        ...(stage !== undefined && { stage }),
      },
      include: { lead: true },
    });

    return NextResponse.json(deal);
  } catch (error) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    console.error("PUT /api/deals/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    );
  }
}
