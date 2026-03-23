import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stky/ui";

const STAFF_COOKIE = "stky_staff_gate";

async function staffLogin(formData: FormData) {
  "use server";
  const password = process.env.STAFF_DASHBOARD_PASSWORD;
  if (!password) {
    redirect("/dashboard");
  }
  const submitted = (formData.get("password") as string) ?? "";
  const next = (formData.get("next") as string) || "/dashboard";
  if (submitted !== password) {
    redirect(
      `/dashboard/staff-login?error=1&next=${encodeURIComponent(next.startsWith("/dashboard") ? next : "/dashboard")}`
    );
  }
  const jar = await cookies();
  jar.set(STAFF_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(next.startsWith("/dashboard") ? next : "/dashboard");
}

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const nextPath = sp.next ?? "/dashboard";
  const showError = sp.error === "1";

  if (!process.env.STAFF_DASHBOARD_PASSWORD) {
    return (
      <div className="mx-auto max-w-md p-8">
        <Card>
          <CardHeader>
            <CardTitle>Staff gate disabled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Set <code className="rounded bg-muted px-1">STAFF_DASHBOARD_PASSWORD</code> to enable.</p>
            <Button asChild>
              <Link href="/dashboard">Continue to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Staff sign-in</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={staffLogin} className="space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            {showError ? (
              <p className="text-sm text-destructive">Incorrect password. Try again.</p>
            ) : null}
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full">
              Unlock dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
