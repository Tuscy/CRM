import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { StaffCredentialsForm } from "@/components/crm/staff-credentials-form";

const STAFF_COOKIE = "stky_staff_gate";

async function legacyStaffLogin(formData: FormData) {
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
  const showLegacyError = sp.error === "1";
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET);
  const legacyPassword = Boolean(process.env.STAFF_DASHBOARD_PASSWORD);

  if (!hasAuthSecret && !legacyPassword) {
    return (
      <div className="mx-auto max-w-md p-8">
        <Card>
          <CardHeader>
            <CardTitle>Staff gate disabled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Set <code className="rounded bg-muted px-1">AUTH_SECRET</code> and
              create a staff user (see README), or set{" "}
              <code className="rounded bg-muted px-1">STAFF_DASHBOARD_PASSWORD</code>{" "}
              for the legacy shared password.
            </p>
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
          <p className="text-sm text-muted-foreground">
            {hasAuthSecret
              ? "Sign in with your staff account."
              : "Use the shared dashboard password."}
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {hasAuthSecret ? (
            <StaffCredentialsForm
              callbackUrl={
                nextPath.startsWith("/dashboard") ? nextPath : "/dashboard"
              }
            />
          ) : null}

          {legacyPassword && hasAuthSecret ? (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or legacy password
                </span>
              </div>
            </div>
          ) : null}

          {legacyPassword ? (
            <form action={legacyStaffLogin} className="space-y-4">
              <input type="hidden" name="next" value={nextPath} />
              {showLegacyError ? (
                <p className="text-sm text-destructive">
                  Incorrect password. Try again.
                </p>
              ) : null}
              <div>
                <label
                  htmlFor="legacy-password"
                  className="mb-1 block text-sm font-medium"
                >
                  Shared dashboard password
                </label>
                <input
                  id="legacy-password"
                  name="password"
                  type="password"
                  required={!hasAuthSecret}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full">
                Unlock with shared password
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
