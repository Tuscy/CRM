import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/dashboard" className="font-semibold mr-6">
            Web Agency CRM
          </Link>
          <nav className="flex gap-4 text-sm">
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
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
