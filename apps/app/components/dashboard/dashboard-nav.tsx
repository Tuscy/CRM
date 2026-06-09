"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@stky/ui/utils";

export const DASHBOARD_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/sites", label: "Sites" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/pipeline", label: "Pipeline" },
  { href: "/dashboard/tasks", label: "Tasks" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/google-ads", label: "Google Ads" },
  { href: "/dashboard/reporting", label: "Reporting" },
  { href: "/dashboard/automations", label: "Automations" },
  { href: "/dashboard/settings/api-keys", label: "API keys" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2">
      {DASHBOARD_NAV_ITEMS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
