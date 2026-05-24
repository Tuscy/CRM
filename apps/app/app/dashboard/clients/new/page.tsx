import Link from "next/link";
import { CreateClientForm } from "@/components/crm/create-client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/clients"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to clients
        </Link>
        <h1 className="text-2xl font-bold mt-1">Add client</h1>
        <p className="text-sm text-muted-foreground">
          Create a client record with contact and billing details.
        </p>
      </div>
      <CreateClientForm />
    </div>
  );
}
