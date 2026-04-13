import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stky/db";
import { MEMBERSHIP_COOKIE } from "@stky/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const base = new URL(request.url).origin;

  if (!token) {
    return NextResponse.redirect(new URL("/client/login?error=missing", base));
  }

  const row = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!row || row.expires < new Date()) {
    return NextResponse.redirect(new URL("/client/login?error=invalid", base));
  }

  const email = row.identifier.replace(/^portal\|/i, "").trim().toLowerCase();

  const membership = await prisma.membership.findFirst({
    where: { user: { email } },
  });

  if (!membership) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return NextResponse.redirect(new URL("/client/login?error=invalid", base));
  }

  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

  const res = NextResponse.redirect(new URL("/client", base));
  res.cookies.set(MEMBERSHIP_COOKIE, membership.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
