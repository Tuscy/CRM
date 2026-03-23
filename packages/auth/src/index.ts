import { cookies } from "next/headers";
import { prisma } from "@stky/db";

/** Cookie stores portal session — value is `Membership.id` */
export const MEMBERSHIP_COOKIE = "membershipId";

/** @deprecated use MEMBERSHIP_COOKIE */
export const CLIENT_USER_COOKIE = MEMBERSHIP_COOKIE;

export async function getCurrentMembership() {
  const cookieStore = await cookies();
  const id = cookieStore.get(MEMBERSHIP_COOKIE)?.value;
  if (!id) return null;

  return prisma.membership.findUnique({
    where: { id },
    include: { client: true, user: true },
  });
}

export async function requireCurrentMembership() {
  const m = await getCurrentMembership();
  if (!m) {
    throw new Error("Unauthorized");
  }
  return m;
}

export async function clearPortalSession() {
  const cookieStore = await cookies();
  cookieStore.delete(MEMBERSHIP_COOKIE);
}
