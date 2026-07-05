import { getAllContactRows } from "@/lib/server/actions/contacts";
import { ContactsManager } from "@/components/dashboard/contacts-manager";

export default async function ContactsPage() {
  const rows = await getAllContactRows();

  return <ContactsManager rows={rows} />;
}
