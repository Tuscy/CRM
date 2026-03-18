"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const CLIENT_USER_COOKIE = "clientUserId";

export async function clientLogin(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email is required" };
  }

  // Simple lookup-based auth for now: if a ClientUser exists with this email, log them in.
  // In production, replace with real auth (Clerk/Auth.js) or a proper magic-link flow.
  const clientUser = await prisma.clientUser.findFirst({
    where: { email },
    include: { client: true },
  });

  if (!clientUser) {
    return { error: "No client user found for this email" };
  }

  const cookieStore = await cookies();
  cookieStore.set(CLIENT_USER_COOKIE, clientUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect("/client");
}

export async function clientLogout() {
  const cookieStore = await cookies();
  cookieStore.set(CLIENT_USER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  redirect("/client/login");
}

