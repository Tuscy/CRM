import { type NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@stky/security/edge";

/** Light edge rate limit for public site renderer (requires Upstash in production). */
export async function middleware(request: NextRequest) {
  const blocked = await rateLimit(request, "general");
  if (blocked) return blocked;
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
