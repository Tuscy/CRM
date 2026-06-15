import { auth } from "@/auth";
import { AppBrand } from "@/components/app-brand";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { SignOutForm } from "./sign-out-form";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="dashboard-shell flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="flex h-full w-56 shrink-0 flex-col border-r bg-muted">
        <div className="shrink-0 border-b px-4 py-4">
          <AppBrand href="/dashboard" size="sm" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DashboardNav />
        </div>
        {session?.user?.isStaff ? (
          <div className="shrink-0 border-t px-4 py-3">
            <SignOutForm />
          </div>
        ) : null}
      </aside>
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">{children}</main>
    </div>
  );
}
