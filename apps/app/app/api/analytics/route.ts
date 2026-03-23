import { NextRequest, NextResponse } from "next/server";
import { getClientAnalytics } from "@/lib/analytics/ga4";
import { getCurrentMembership } from "@stky/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ?? "30daysAgo";
    const endDate = searchParams.get("endDate") ?? "today";
    const clientIdParam = searchParams.get("clientId");

    let clientId = clientIdParam ?? null;

    // If no clientId is provided, assume client portal context.
    if (!clientId) {
      const clientUser = await getCurrentMembership();
      if (!clientUser) {
        return NextResponse.json(
          { error: "Client context required" },
          { status: 401 }
        );
      }
      clientId = clientUser.clientId;
    }

    const data = await getClientAnalytics({
      clientId,
      startDate,
      endDate,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

