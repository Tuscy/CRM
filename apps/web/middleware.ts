import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Dev: `?siteId=...` pins tenant without DNS */
export function middleware(request: NextRequest) {
  const siteId = request.nextUrl.searchParams.get("siteId");
  if (siteId) {
    const res = NextResponse.next();
    res.headers.set("x-stky-site-id", siteId);
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
