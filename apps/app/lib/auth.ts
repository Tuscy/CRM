import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireStaffSession() {
  const session = await auth();
  if (!session?.user?.isStaff) {
    throw new Error("Unauthorized");
  }
  return session.user;
}
