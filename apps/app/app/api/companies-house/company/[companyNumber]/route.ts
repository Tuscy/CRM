import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getCompaniesHouseEnvStatus,
  getCompanyDetails,
  parseCompaniesHouseError,
} from "@/lib/companies-house/client";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companyNumber: string }> }
) {
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

  const { companyNumber } = await params;

  try {
    const company = await getCompanyDetails(companyNumber);
    return NextResponse.json({ company });
  } catch (err) {
    return NextResponse.json(
      { error: parseCompaniesHouseError(err) },
      { status: 502 }
    );
  }
}
