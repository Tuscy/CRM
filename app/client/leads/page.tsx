import { redirect } from "next/navigation";
import { requireCurrentClientUser } from "@/lib/auth-client";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClientLeadsPage() {
  let clientUser;
  try {
    clientUser = await requireCurrentClientUser();
  } catch {
    redirect("/client/login");
  }

  const leads = await prisma.lead.findMany({
    where: { clientId: clientUser.clientId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your leads</h1>
        <p className="text-sm text-muted-foreground">
          Leads associated with your organisation.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <p className="text-sm text-muted-foreground">
            {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No leads have been assigned to you yet.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Company</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0">
                      <td className="p-3">{lead.name}</td>
                      <td className="p-3 text-muted-foreground">{lead.email}</td>
                      <td className="p-3">{lead.company ?? "—"}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
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

