"use server";

import { randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@stky/db";
import { MEMBERSHIP_COOKIE } from "@stky/auth";
import { isOverRateLimit } from "@stky/security";
import { sendPortalMagicLink } from "@/lib/email/portal-magic-link";

const PORTAL_IDENTIFIER_PREFIX = "portal|";

function portalIdentifier(email: string) {
  return `${PORTAL_IDENTIFIER_PREFIX}${email.trim().toLowerCase()}`;
}

async function getRequestIdentityForRateLimit(email: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  return `${ip}:${email}`;
}

export type PortalMagicLinkResult =
  | { ok: true }
  | { error: string };

/**
 * Request a passwordless sign-in link for the client portal (15 min TTL).
 */
export async function requestClientMagicLink(formData: FormData): Promise<PortalMagicLinkResult> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email is required" };
  }

  if (await isOverRateLimit(await getRequestIdentityForRateLimit(email), "auth")) {
    return { error: "Too many sign-in attempts. Try again shortly." };
  }

  const membership = await prisma.membership.findFirst({
    where: { user: { email } },
    include: { client: true, user: true },
  });

  if (!membership) {
    /** Do not reveal whether the email has portal access (enumeration). */
    return { ok: true };
  }

  await prisma.verificationToken.deleteMany({
    where: { identifier: portalIdentifier(email) },
  });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: portalIdentifier(email),
      token,
      expires,
    },
  });

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const verifyUrl = `${base}/client/login/verify?token=${encodeURIComponent(token)}`;

  const sent = await sendPortalMagicLink({ email, verifyUrl });
  if (!sent.ok) {
    return { error: sent.error ?? "Could not send email." };
  }

  return { ok: true };
}

export async function clientLogout() {
  const cookieStore = await cookies();
  cookieStore.set(MEMBERSHIP_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 0,
  });

  redirect("/client/login");
}
