import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const CLIENT_USER_COOKIE = "clientUserId";

export async function getCurrentClientUser() {
  const cookieStore = await cookies();
  const id = cookieStore.get(CLIENT_USER_COOKIE)?.value;
  if (!id) return null;

  return prisma.clientUser.findUnique({
    where: { id },
    include: { client: true },
  });
}

export async function requireCurrentClientUser() {
  const user = await getCurrentClientUser();
  if (!user) {
    throw new Error("Client user not authenticated");
  }
  return user;
}

export async function clearClientUserSession() {
  const cookieStore = await cookies();
  cookieStore.set(CLIENT_USER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

