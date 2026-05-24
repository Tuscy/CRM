import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getCompaniesHouseEnvStatus,
  parseCompaniesHouseError,
  searchCompanies,
} from "@/lib/companies-house/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isStaff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = getCompaniesHouseEnvStatus();
  if (!env.configured) {
    return NextResponse.json(
      {
        error:
          "Companies House API key is not configured. Set COMPANIES_HOUSE_API_KEY.",
        env,
      },
      { status: 503 }
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ error: "Query parameter q is required" }, { status: 400 });
  }

  try {
    const items = await searchCompanies(q, 10);
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: parseCompaniesHouseError(err) },
      { status: 502 }
    );
  }
}
