import Link from "next/link";
import { getLeads } from "@/lib/server/actions/leads";
import { Button } from "@stky/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { CreateLeadForm } from "@/components/crm/create-lead-form";
import { LEAD_STATUSES } from "@stky/crm";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const source =
    typeof searchParams.source === "string" ? searchParams.source : undefined;

  const leads = await getLeads({ q, status, source });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <CreateLeadForm />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Search and filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end"
            method="get"
            action="/dashboard/leads"
          >
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="q" className="text-sm font-medium">
                Search
              </label>
              <input
                id="q"
                name="q"
                type="search"
                placeholder="Name, email, company"
                defaultValue={q ?? ""}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="w-full md:w-40">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status ?? ""}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                <option value="">Any</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-40">
              <label htmlFor="source" className="text-sm font-medium">
                Source
              </label>
              <input
                id="source"
                name="source"
                placeholder="e.g. web"
                defaultValue={source ?? ""}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Apply</Button>
              <Button variant="outline" type="button" asChild>
                <Link href="/dashboard/leads">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All leads</CardTitle>
          <p className="text-sm text-muted-foreground">
            {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No leads match your filters.
            </p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Company</th>
                    <th className="text-left p-3 font-medium">Source</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0">
                      <td className="p-3">
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="font-medium hover:underline"
                        >
                          {lead.name}
                        </Link>
                      </td>
                      <td className="p-3 text-muted-foreground">{lead.email}</td>
                      <td className="p-3">{lead.company ?? "—"}</td>
                      <td className="p-3">{lead.source ?? "—"}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/leads/${lead.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
