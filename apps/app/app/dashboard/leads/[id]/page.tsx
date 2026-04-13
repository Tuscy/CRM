import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeadById } from "@/lib/server/actions/leads";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { UpdateLeadForm } from "@/components/crm/update-lead-form";
import { DeleteLeadButton } from "@/components/crm/delete-lead-button";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link
            href="/dashboard/leads"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to leads
          </Link>
          <h1 className="text-2xl font-bold mt-1">{lead.name}</h1>
        </div>
        <DeleteLeadButton leadId={id} />
      </div>
      <UpdateLeadForm lead={lead} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {lead.deals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No deals.</p>
            ) : (
              <ul className="space-y-2">
                {lead.deals.map((d) => (
                  <li key={d.id} className="flex justify-between text-sm">
                    <span>{d.stage}</span>
                    {d.value != null && (
                      <span className="font-medium">${d.value.toLocaleString()}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {lead.tasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tasks.</p>
            ) : (
              <ul className="space-y-2">
                {lead.tasks.map((t) => (
                  <li key={t.id} className="flex justify-between text-sm">
                    <span className={t.completed ? "line-through text-muted-foreground" : ""}>
                      {t.title}
                    </span>
                    {t.dueDate && (
                      <span className="text-muted-foreground">
                        {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Notes and tasks, newest first
          </p>
        </CardHeader>
        <CardContent>
          {(() => {
            const items = [
              ...lead.notes.map((n) => ({
                kind: "note" as const,
                at: n.createdAt,
                text: n.content,
                id: n.id,
              })),
              ...lead.tasks.map((t) => ({
                kind: "task" as const,
                at: t.dueDate ?? lead.createdAt,
                text: t.title,
                completed: t.completed,
                id: t.id,
              })),
            ].sort((a, b) => b.at.getTime() - a.at.getTime());
            if (items.length === 0) {
              return (
                <p className="text-muted-foreground text-sm">No activity yet.</p>
              );
            }
            return (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="text-sm border-l-2 border-muted pl-3 py-1"
                  >
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      {item.kind}
                    </span>
                    {item.kind === "task" && item.completed ? (
                      <span className="line-through text-muted-foreground ml-2">
                        {item.text}
                      </span>
                    ) : (
                      <span className="ml-2">{item.text}</span>
                    )}
                    <span className="text-muted-foreground text-xs ml-2 block sm:inline">
                      {new Date(item.at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
