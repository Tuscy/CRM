import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getClientAnalytics } from "@/lib/analytics/ga4";
import { getCurrentMembership } from "@stky/auth";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ?? "30daysAgo";
    const endDate = searchParams.get("endDate") ?? "today";
    const clientIdParam = searchParams.get("clientId");

    if (clientIdParam) {
      if (
        !(await requireAutomationAuth(
          request,
          "GET /api/analytics",
          ApiScope.ANALYTICS_READ
        ))
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const data = await getClientAnalytics({
        clientId: clientIdParam,
        startDate,
        endDate,
      });
      return NextResponse.json(data);
    }

    const clientUser = await getCurrentMembership();
    if (!clientUser) {
      return NextResponse.json(
        { error: "Client context required" },
        { status: 401 }
      );
    }

    const data = await getClientAnalytics({
      clientId: clientUser.clientId,
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
