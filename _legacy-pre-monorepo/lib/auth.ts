// Placeholder for Clerk or Auth.js integration
// Replace with your auth provider when ready

export async function getCurrentUser() {
  // TODO: Integrate Clerk or Auth.js
  return null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
