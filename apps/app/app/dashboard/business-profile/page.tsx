import { getClients } from "@/lib/server/actions/clients";
import { BusinessProfileView } from "@/components/gbp/business-profile-view";

export const dynamic = "force-dynamic";

export default async function BusinessProfilePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const clientId =
    typeof searchParams.clientId === "string" ? searchParams.clientId : "";

  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reviews, posts, and performance for Google Business Profile locations.
        </p>
      </div>

      <BusinessProfileView
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        initialClientId={clientId}
      />
    </div>
  );
}
