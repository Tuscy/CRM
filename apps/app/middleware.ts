import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STAFF_COOKIE = "stky_staff_gate";

/**
 * Simple staff gate for the CRM dashboard only (`apps/app`).
 * Set `STAFF_DASHBOARD_PASSWORD` in env; omit or leave empty to disable the gate (local dev).
 */
export function middleware(request: NextRequest) {
  const password = process.env.STAFF_DASHBOARD_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/dashboard/staff-login")) {
    return NextResponse.next();
  }

  if (request.cookies.get(STAFF_COOKIE)?.value === "1") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/dashboard/staff-login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
