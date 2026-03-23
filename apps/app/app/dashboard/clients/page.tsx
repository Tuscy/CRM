import Link from "next/link";
import { getClients } from "@/lib/server/actions/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { Button } from "@stky/ui";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button asChild>
          <Link href="/dashboard/clients/new">Add client</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No clients yet. Add your first client above.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Primary contact</th>
                    <th className="text-left p-3 font-medium">Leads</th>
                    <th className="text-left p-3 font-medium">Portal users</th>
                    <th className="text-left p-3 font-medium">Analytics</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b last:border-0">
                      <td className="p-3">{client.name}</td>
                      <td className="p-3 text-muted-foreground">
                        {client.primaryContactEmail}
                      </td>
                      <td className="p-3">{client._count.leads}</td>
                      <td className="p-3">{client._count.memberships}</td>
                      <td className="p-3">
                        {client._count.analytics > 0 ? "Connected" : "Not connected"}
                      </td>
                      <td className="p-3 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/clients/${client.id}`}>View</Link>
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

