"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@stky/db";
import { MEMBERSHIP_COOKIE } from "@stky/auth";

export async function clientLogin(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email is required" };
  }

  const membership = await prisma.membership.findFirst({
    where: { user: { email } },
    include: { client: true, user: true },
  });

  if (!membership) {
    return { error: "No portal access found for this email" };
  }

  const cookieStore = await cookies();
  cookieStore.set(MEMBERSHIP_COOKIE, membership.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/client");
}

export async function clientLogout() {
  const cookieStore = await cookies();
  cookieStore.set(MEMBERSHIP_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  redirect("/client/login");
}
