import Link from "next/link";
import { auth } from "@/auth";
import { SignOutForm } from "./sign-out-form";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-14 items-center px-4 gap-4">
          <Link href="/dashboard" className="font-semibold mr-6">
            Web Agency CRM
          </Link>
          <nav className="flex flex-1 gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/clients"
              className="text-muted-foreground hover:text-foreground"
            >
              Clients
            </Link>
            <Link
              href="/dashboard/sites"
              className="text-muted-foreground hover:text-foreground"
            >
              Sites
            </Link>
            <Link
              href="/dashboard/leads"
              className="text-muted-foreground hover:text-foreground"
            >
              Leads
            </Link>
            <Link
              href="/dashboard/pipeline"
              className="text-muted-foreground hover:text-foreground"
            >
              Pipeline
            </Link>
            <Link
              href="/dashboard/tasks"
              className="text-muted-foreground hover:text-foreground"
            >
              Tasks
            </Link>
            <Link
              href="/dashboard/analytics"
              className="text-muted-foreground hover:text-foreground"
            >
              Analytics
            </Link>
            <Link
              href="/dashboard/automations"
              className="text-muted-foreground hover:text-foreground"
            >
              Automations
            </Link>
            <Link
              href="/dashboard/settings/api-keys"
              className="text-muted-foreground hover:text-foreground"
            >
              API keys
            </Link>
          </nav>
          {session?.user?.isStaff ? (
            <div className="ml-auto shrink-0">
              <SignOutForm />
            </div>
          ) : null}
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
